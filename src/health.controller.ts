import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

/** Operational health endpoint for the authentication service. */
@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async health() {
    await this.db.ping();
    return { status: 'UP', service: 'neu-trading-app-demo-auth-api' };
  }
}
