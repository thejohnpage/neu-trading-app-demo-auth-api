import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Opaque refresh-session token', format: 'password' })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
