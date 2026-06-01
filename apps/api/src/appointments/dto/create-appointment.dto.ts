import { ArrayMinSize, IsArray, IsOptional, IsString } from "class-validator";

export class CreateAppointmentDto {
  @IsString()
  patientId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  testTypes: string[];

  @IsString()
  address: string;

  @IsString()
  slot: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
