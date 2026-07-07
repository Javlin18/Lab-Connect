import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class UpdatePayConfigDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  incentivePerSample?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  cancellationDeduction?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  absentDeduction?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  lateArrivalDeduction?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  starBonus40?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  starBonus80?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  starBonus120?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  referralBonus?: number;
}
