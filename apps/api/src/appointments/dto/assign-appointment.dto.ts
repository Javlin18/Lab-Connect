import { IsString } from "class-validator";

export class AssignAppointmentDto {
  @IsString()
  employeeId: string;
}
