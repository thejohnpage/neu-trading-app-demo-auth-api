import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';

/**
 * Optional demo-only credential bootstrap.
 *
 * Enabled only when DEMO_CLIENT_PASSWORD is present. The configured password is
 * BCrypt-hashed by the Auth service and never committed to source control.
 */
@Injectable()
export class DemoCredentialBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoCredentialBootstrap.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const password = this.config.get<string>('DEMO_CLIENT_PASSWORD');
    if (!password) {
      return;
    }

    const email = this.config.get<string>(
      'DEMO_CLIENT_EMAIL',
      'joanna@example.test',
    ).toLowerCase();

    const rounds = Number(this.config.get('BCRYPT_ROUNDS', 12));
    const passwordHash = await bcrypt.hash(password, rounds);

    const result = await this.db.query(
      `UPDATE identity.clients
       SET password_hash = $1
       WHERE lower(email) = lower($2)
         AND active = true`,
      [passwordHash, email],
    );

    if (result.rowCount !== 1) {
      throw new Error(
        `Demo client bootstrap expected one active client for ${email}; found ${result.rowCount ?? 0}`,
      );
    }

    this.logger.log(`Demo client credential initialized for ${email}`);
  }
}
