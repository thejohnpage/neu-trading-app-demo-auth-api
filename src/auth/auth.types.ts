export type SubjectType = 'CLIENT' | 'ADMIN';

export interface AuthSubject {
  subjectType: SubjectType;
  subjectId: string;
  email: string;
  passwordHash: string;
  active: boolean;
  roles: string[];
}

export interface AccessClaims {
  sub: string;
  type: SubjectType;
  email: string;
  roles?: string[];
}

export interface RefreshClaims extends AccessClaims {
  sid: string;
  tokenType: 'refresh';
}
