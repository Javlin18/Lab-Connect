import { IsIn, IsOptional, IsString } from "class-validator";

import { APPOINTMENT_STATUSES } from "../../common/constants/domain.constants";

export class ListAppointmentsDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsIn(APPOINTMENT_STATUSES)
  status?: (typeof APPOINTMENT_STATUSES)[number];

  @IsOptional()
  @IsString()
  employeeId?: string;
}
