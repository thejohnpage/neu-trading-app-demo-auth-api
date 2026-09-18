import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { RefreshDto } from './refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() request: LoginDto) {
    return this.auth.login(request.email, request.password, request.type);
  }

  @Post('refresh')
  refresh(@Body() request: RefreshDto) {
    return this.auth.refresh(request.refreshToken);
  }

  @Post('logout')
  logout(@Body() request: RefreshDto) {
    return this.auth.logout(request.refreshToken);
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Bearer token required');
    return this.auth.me(authorization.substring(7));
  }
}
