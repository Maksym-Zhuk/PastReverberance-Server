import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateDailyPhotoInput {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
