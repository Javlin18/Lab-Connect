import { IsArray, IsIn, IsNumber, IsOptional, IsString } from "class-validator";
import { EMPLOYEE_STATUS_UPDATES } from "../../common/constants/domain.constants";

export class UpdateAppointmentStatusDto {
  @IsIn(EMPLOYEE_STATUS_UPDATES)
  status: (typeof EMPLOYEE_STATUS_UPDATES)[number];

  @IsString()
  @IsOptional()
  sampleId?: string;

  @IsString()
  @IsOptional()
  collectionNotes?: string;

  @IsString()
  @IsOptional()
  collectedAt?: string;

  @IsArray()
  @IsOptional()
  barcodes?: Array<{ testName: string; barcodeId: string }>;

  @IsString()
  @IsOptional()
  otp?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}
