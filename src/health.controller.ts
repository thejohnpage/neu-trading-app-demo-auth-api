import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from './database/database.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @ApiOperation({ summary: 'Check authentication service and database health' })
  @Get()
  async health() {
    await this.db.ping();
    return { status: 'UP', service: 'neu-trading-app-demo-auth-api' };
  }
}
