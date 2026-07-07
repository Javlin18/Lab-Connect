import { IsDateString, IsOptional, IsString } from "class-validator";

export class MarkAbsentDto {
  @IsString()
  employeeId: string;

  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  note?: string;
}
