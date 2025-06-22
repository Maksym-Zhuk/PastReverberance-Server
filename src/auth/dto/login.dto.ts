import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email!: string;

  @Field()
  @MinLength(8)
  @IsStrongPassword()
  @IsNotEmpty()
  @IsString()
  password!: string;
}
