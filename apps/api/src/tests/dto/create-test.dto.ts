import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateTestDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  discountPrice?: number;

  @IsString()
  category: string;

  @IsString()
  sampleType: string;

  @IsString()
  preparationInstructions: string;

  @IsArray()
  @IsString({ each: true })
  parameters: string[];

  @IsNumber()
  turnaroundHours: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
