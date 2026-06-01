import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class CreatePackageDto {
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

  @IsArray()
  @IsString({ each: true })
  testIds: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
