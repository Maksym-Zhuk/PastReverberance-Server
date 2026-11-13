import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateProfileInput } from 'src/users/dto/createProfileInput';

export class RegisterInput {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @MinLength(8)
  @IsStrongPassword()
  @IsNotEmpty()
  @IsString()
  password: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateProfileInput)
  profile: CreateProfileInput;
}
