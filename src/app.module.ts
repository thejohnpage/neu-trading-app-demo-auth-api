import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { DatabaseService } from './database/database.service';
import { HealthController } from './health.controller';
import { DemoCredentialBootstrap } from './auth/demo-credential.bootstrap';
import { AdminCredentialBootstrap } from './auth/admin-credential.bootstrap';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true }),
  ],
  controllers: [AuthController, HealthController],
  providers: [DatabaseService, AuthService, DemoCredentialBootstrap, AdminCredentialBootstrap],
})
export class AppModule {}
