import { IsBoolean, IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class UpdateLocationDto {
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
