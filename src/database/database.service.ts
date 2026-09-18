import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    this.pool = new Pool({
      host: config.get('DB_HOST', 'localhost'),
      port: Number(config.get('DB_PORT', 5432)),
      database: config.get('DB_NAME', 'trading_demo'),
      user: config.get('DB_USER', 'trading_demo'),
      password: config.get('DB_PASSWORD'),
      connectionTimeoutMillis: 5000,
    });
  }

  query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
    return this.pool.query<T>(text, values);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
