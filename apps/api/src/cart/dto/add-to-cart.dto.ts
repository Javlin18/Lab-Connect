import { IsOptional, IsString } from "class-validator";

export class AddToCartDto {
  @IsString()
  @IsOptional()
  testId?: string;

  @IsString()
  @IsOptional()
  packageId?: string;
}
