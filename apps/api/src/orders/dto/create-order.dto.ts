import { IsIn, IsNumber, IsOptional, IsString } from "class-validator";

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

  @IsOptional()
  @IsIn(["online_prepaid", "pay_on_collection"])
  paymentType?: "online_prepaid" | "pay_on_collection";
}
