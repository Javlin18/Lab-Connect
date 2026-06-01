import { IsOptional, IsString } from "class-validator";

export class VerifyPaymentDto {
  @IsString()
  @IsOptional()
  razorpay_order_id?: string;

  @IsString()
  @IsOptional()
  razorpay_payment_id?: string;

  @IsString()
  @IsOptional()
  razorpay_signature?: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
