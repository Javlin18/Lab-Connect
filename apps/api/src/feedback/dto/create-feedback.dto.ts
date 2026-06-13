import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateFeedbackDto {
  @IsString()
  appointmentId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  overallRating: number;

  @IsBoolean()
  woreGloves: boolean;

  @IsBoolean()
  woreMask: boolean;

  @IsBoolean()
  wasPunctual: boolean;

  @IsBoolean()
  wasProfessional: boolean;

  @IsOptional()
  @IsString()
  comment?: string;
}
