import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class UpdateProfileInput {
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
