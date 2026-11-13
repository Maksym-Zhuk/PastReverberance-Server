import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProfileInput {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  description?: string;
}
