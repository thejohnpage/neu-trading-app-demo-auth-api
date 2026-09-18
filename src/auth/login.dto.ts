import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  @IsIn(['CLIENT', 'ADMIN'])
  type!: 'CLIENT' | 'ADMIN';
}
