import { IsEmail, IsOptional, IsString } from "class-validator";

export class GoogleLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  googleId?: string;
}
