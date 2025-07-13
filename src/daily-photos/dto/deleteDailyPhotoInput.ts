import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber } from 'class-validator';

@InputType()
export class DeleteDailyPhotoInput {
  @Field(() => Int)
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
