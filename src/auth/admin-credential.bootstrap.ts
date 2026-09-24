import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';

/**
 * Optional local/demo bootstrap for resetting an existing administrator password.
 *
 * <p>Runs only when ADMIN_PASSWORD_RESET is set. The plaintext password remains
 * in the local environment and only its BCrypt hash is stored in PostgreSQL.</p>
 */
@Injectable()
export class AdminCredentialBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminCredentialBootstrap.name);
  constructor(private readonly db: DatabaseService, private readonly config: ConfigService) {}

  async onApplicationBootstrap() {
    const password = this.config.get<string>('ADMIN_PASSWORD_RESET');
    if (!password) return;

    const email = this.config.get<string>('ADMIN_PASSWORD_RESET_EMAIL', 'superadmin@trading.demo').toLowerCase();
    const rounds = Number(this.config.get('BCRYPT_ROUNDS', 12));
    const hash = await bcrypt.hash(password, rounds);
    const result = await this.db.query(
      `UPDATE identity.users SET password_hash=$1, updated_at=CURRENT_TIMESTAMP
       WHERE lower(email)=lower($2) AND active=true`,
      [hash, email],
    );
    if (result.rowCount !== 1) throw new Error(`Admin password reset expected one active user for ${email}; found ${result.rowCount ?? 0}`);
    await this.db.query(
      `UPDATE identity.sessions SET revoked_at=CURRENT_TIMESTAMP
       WHERE subject_type='USER'
         AND subject_id=(SELECT user_id FROM identity.users WHERE lower(email)=lower($1))
         AND revoked_at IS NULL`,
      [email],
    );
    this.logger.log(`Administrator credential reset for ${email}; existing refresh sessions revoked`);
  }
}
