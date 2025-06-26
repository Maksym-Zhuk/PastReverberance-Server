import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email?: string;

  @Field({ nullable: true })
  @IsNotEmpty()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsNotEmpty()
  @IsString()
  lastName?: string;

  @Field({ nullable: true })
  @IsNotEmpty()
  @IsString()
  description?: string;
}
