import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { CreateProfileInput } from 'src/users/dto/createProfileInput';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @Field()
  @MinLength(8)
  @IsStrongPassword()
  @IsNotEmpty()
  @IsString()
  password: string;

  @Field(() => CreateProfileInput)
  profile: CreateProfileInput;
}
