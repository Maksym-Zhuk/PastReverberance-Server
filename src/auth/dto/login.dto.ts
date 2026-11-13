import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// Strength rules apply on register only; login just checks credentials.
export class LoginInput {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
