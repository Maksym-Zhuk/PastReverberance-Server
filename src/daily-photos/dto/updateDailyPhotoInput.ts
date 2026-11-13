import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateDailyPhotoInput {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
