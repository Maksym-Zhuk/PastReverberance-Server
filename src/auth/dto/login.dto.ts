<<<<<<< Updated upstream
import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

@InputType()
=======
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// Strength rules apply on register only; login just checks credentials.
>>>>>>> Stashed changes
export class LoginInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

<<<<<<< Updated upstream
  @Field()
  @MinLength(8)
  @IsStrongPassword()
=======
>>>>>>> Stashed changes
  @IsNotEmpty()
  @IsString()
  password: string;
}
