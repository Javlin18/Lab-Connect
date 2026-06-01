import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterEmployeeDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  zone?: string;
}
