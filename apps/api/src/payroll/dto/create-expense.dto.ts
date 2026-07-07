import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateExpenseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn(["bonus", "deduction", "reimbursement"])
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  month: string; // YYYY-MM format expected
}
