import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateProfileInput {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
