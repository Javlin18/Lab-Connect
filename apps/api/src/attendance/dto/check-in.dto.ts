import { IsOptional, IsString } from "class-validator";

export class CheckInDto {
  @IsString()
  selfieUrl: string; // base64 data-url

  @IsOptional()
  @IsString()
  note?: string;
}
