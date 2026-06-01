import { IsString, MinLength, ValidateIf } from "class-validator";

export class LoginDto {
  @ValidateIf((value: LoginDto) => !value.phone)
  @IsString()
  email?: string;

  @ValidateIf((value: LoginDto) => !value.email)
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password: string;
}
