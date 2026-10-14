import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'client@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 1, format: 'password' })
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiProperty({ enum: ['CLIENT', 'ADMIN'], example: 'CLIENT' })
  @IsIn(['CLIENT', 'ADMIN'])
  type!: 'CLIENT' | 'ADMIN';
}
