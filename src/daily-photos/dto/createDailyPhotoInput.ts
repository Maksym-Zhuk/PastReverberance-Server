import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateDailyPhotoInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  note: string;
}
