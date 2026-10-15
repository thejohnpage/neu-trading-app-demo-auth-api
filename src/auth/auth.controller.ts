import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { RefreshDto } from './refresh.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @ApiOperation({ summary: 'Authenticate a client or administrator and issue tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Post('login')
  login(@Body() request: LoginDto) {
    return this.auth.login(request.email, request.password, request.type);
  }

  @ApiOperation({ summary: 'Refresh an authentication session' })
  @Post('refresh')
  refresh(@Body() request: RefreshDto) {
    return this.auth.refresh(request.refreshToken);
  }

  @ApiOperation({ summary: 'Revoke a refresh session' })
  @Post('logout')
  logout(@Body() request: RefreshDto) {
    return this.auth.logout(request.refreshToken);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Validate a bearer access token for the trading API' })
  @ApiUnauthorizedResponse({ description: 'Bearer token missing or invalid' })
  @Get('validate')
  validate(@Headers('authorization') authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }
    return this.auth.validateAccess(authorization.substring(7));
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the authenticated subject' })
  @ApiUnauthorizedResponse({ description: 'Bearer token missing or invalid' })
  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }
    return this.auth.me(authorization.substring(7));
  }
}
