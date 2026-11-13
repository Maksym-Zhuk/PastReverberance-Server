<<<<<<< Updated upstream
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
=======
import { IsDateString, IsOptional, IsString } from 'class-validator';
>>>>>>> Stashed changes

@InputType()
export class UpdateDailyPhotoInput {
  @Field(() => Int)
  @IsNotEmpty()
  @IsNumber()
  id: number;

<<<<<<< Updated upstream
  @Field()
  @IsNotEmpty()
  @IsString()
  note: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  date: string;
=======
  @IsOptional()
  @IsDateString()
  date?: string;
>>>>>>> Stashed changes
}
