import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateOrderDto {
  @IsString()
  patientName: string;

  @IsNumber()
  patientAge: number;

  @IsString()
  patientGender: string;

  @IsString()
  patientPhone: string;

  @IsString()
  address: string;

  @IsString()
  pincode: string;

  @IsString()
  slot: string;
}
