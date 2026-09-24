import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { AccessClaims, AuthSubject, RefreshClaims, SubjectType } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string, type: SubjectType) {
    const subject = await this.findSubject(email.toLowerCase(), type);
    if (!subject?.active || !subject.passwordHash) throw new UnauthorizedException('Invalid credentials');
    if (!(await bcrypt.compare(password, subject.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    return this.issueSession(subject);
  }

  async refresh(refreshToken: string) {
    const claims = await this.verifyRefresh(refreshToken);
    const result = await this.db.query<{ refresh_token_hash: string; revoked_at: Date | null; expires_at: Date }>(
      'SELECT refresh_token_hash, revoked_at, expires_at FROM identity.sessions WHERE session_id=$1',
      [claims.sid],
    );
    const session = result.rows[0];
    if (!session || session.revoked_at || session.expires_at <= new Date()) throw new UnauthorizedException('Refresh token expired or revoked');
    if (session.refresh_token_hash !== this.hash(refreshToken)) throw new UnauthorizedException('Invalid refresh token');

    const subject = await this.findSubjectById(claims.sub, claims.type);
    if (!subject?.active) throw new UnauthorizedException('Subject disabled');

    await this.db.query('UPDATE identity.sessions SET revoked_at=CURRENT_TIMESTAMP WHERE session_id=$1', [claims.sid]);
    return this.issueSession(subject);
  }

  async logout(refreshToken: string) {
    const claims = await this.verifyRefresh(refreshToken);
    await this.db.query('UPDATE identity.sessions SET revoked_at=CURRENT_TIMESTAMP WHERE session_id=$1', [claims.sid]);
    return { loggedOut: true };
  }

  async me(accessToken: string) {
    return this.verifyAccess(accessToken);
  }

  async validateAccess(accessToken: string) {
    const claims = await this.verifyAccess(accessToken);
    const subject = await this.findSubjectById(claims.sub, claims.type);
    if (!subject?.active) throw new UnauthorizedException('Subject disabled');
    return { active: true, sub: subject.subjectId, type: subject.subjectType, email: subject.email, roles: subject.subjectType === 'ADMIN' ? subject.roles : [] };
  }

  private async issueSession(subject: AuthSubject) {
    const sid = randomUUID();
    const accessClaims: AccessClaims = {
      sub: subject.subjectId,
      type: subject.subjectType,
      email: subject.email,
      ...(subject.subjectType === 'ADMIN' ? { roles: subject.roles } : {}),
    };
    const refreshClaims: RefreshClaims = { ...accessClaims, sid, tokenType: 'refresh' };

    const accessToken = await this.jwt.signAsync(accessClaims, {
      secret: this.secret(),
      expiresIn: this.config.get('JWT_ACCESS_TTL', '15m'),
      issuer: 'neu-trading-auth',
      audience: 'neu-trading-api',
    });
    const refreshToken = await this.jwt.signAsync(refreshClaims, {
      secret: this.secret(),
      expiresIn: `${Number(this.config.get('JWT_REFRESH_TTL_DAYS', 7))}d`,
      issuer: 'neu-trading-auth',
      audience: 'neu-trading-auth',
    });
    const days = Number(this.config.get('JWT_REFRESH_TTL_DAYS', 7));
    await this.db.query(
      `INSERT INTO identity.sessions(session_id,subject_type,subject_id,refresh_token_hash,expires_at)
       VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP + ($5 * INTERVAL '1 day'))`,
      [sid, subject.subjectType === 'ADMIN' ? 'USER' : 'CLIENT', subject.subjectId, this.hash(refreshToken), days],
    );
    return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: this.config.get('JWT_ACCESS_TTL', '15m'), subject: accessClaims };
  }

  private async findSubject(email: string, type: SubjectType): Promise<AuthSubject | null> {
    if (type === 'CLIENT') {
      const r = await this.db.query<{ client_id:string;email:string;password_hash:string;active:boolean }>(
        'SELECT client_id,email,password_hash,active FROM identity.clients WHERE lower(email)=lower($1)', [email]);
      const x=r.rows[0]; return x ? { subjectType:'CLIENT',subjectId:x.client_id,email:x.email,passwordHash:x.password_hash,active:x.active,roles:[] } : null;
    }
    const r = await this.db.query<{ user_id:string;email:string;password_hash:string;active:boolean }>(
      'SELECT user_id,email,password_hash,active FROM identity.users WHERE lower(email)=lower($1)', [email]);
    const x=r.rows[0]; if(!x) return null;
    return { subjectType:'ADMIN',subjectId:x.user_id,email:x.email,passwordHash:x.password_hash,active:x.active,roles:await this.roles(x.user_id) };
  }

  private async findSubjectById(id:string,type:SubjectType) {
    if(type==='CLIENT'){
      const r=await this.db.query<{client_id:string;email:string;password_hash:string;active:boolean}>(
        'SELECT client_id,email,password_hash,active FROM identity.clients WHERE client_id=$1',[id]);
      const x=r.rows[0]; return x?{subjectType:'CLIENT' as const,subjectId:x.client_id,email:x.email,passwordHash:x.password_hash,active:x.active,roles:[]}:null;
    }
    const r=await this.db.query<{user_id:string;email:string;password_hash:string;active:boolean}>(
      'SELECT user_id,email,password_hash,active FROM identity.users WHERE user_id=$1',[id]);
    const x=r.rows[0]; return x?{subjectType:'ADMIN' as const,subjectId:x.user_id,email:x.email,passwordHash:x.password_hash,active:x.active,roles:await this.roles(x.user_id)}:null;
  }

  private async roles(userId:string){const r=await this.db.query<{role_name:string}>(
    'SELECT r.role_name FROM identity.user_roles ur JOIN identity.roles r ON r.role_id=ur.role_id WHERE ur.user_id=$1 ORDER BY r.role_name',[userId]);return r.rows.map(x=>x.role_name);}

  private async verifyAccess(token:string){try{return await this.jwt.verifyAsync<AccessClaims>(token,{secret:this.secret(),issuer:'neu-trading-auth',audience:'neu-trading-api'});}catch{throw new UnauthorizedException('Invalid access token');}}
  private async verifyRefresh(token:string){try{return await this.jwt.verifyAsync<RefreshClaims>(token,{secret:this.secret(),issuer:'neu-trading-auth',audience:'neu-trading-auth'});}catch{throw new UnauthorizedException('Invalid refresh token');}}
  private hash(value:string){return createHash('sha256').update(value).digest('hex');}
  private secret(){const s=this.config.get<string>('JWT_SECRET');if(!s)throw new Error('JWT_SECRET is required');return s;}
}
