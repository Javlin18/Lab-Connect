import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  zone: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
