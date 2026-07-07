import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { AttendanceService } from "./attendance.service";
import { CheckInDto } from "./dto/check-in.dto";
import { MarkAbsentDto } from "./dto/mark-absent.dto";

@ApiTags("Attendance")
@ApiBearerAuth()
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ── Employee routes ───────────────────────────────────────────────────────

  /** Mark self as present by submitting a selfie */
  @Roles("employee")
  @Post("checkin")
  checkIn(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(user.sub, dto);
  }

  /** Get own today's attendance status */
  @Roles("employee")
  @Get("today")
  getTodayStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.attendanceService.getTodayStatus(user.sub);
  }

  /** Get own attendance history, optionally filtered by month (YYYY-MM) */
  @Roles("employee")
  @Get("me")
  getMyAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Query("month") month?: string
  ) {
    return this.attendanceService.getMyAttendance(user.sub, month);
  }

  // ── Admin routes ──────────────────────────────────────────────────────────

  /** Get all attendance records filtered by date (YYYY-MM-DD) or month (YYYY-MM) */
  @Roles("admin")
  @Get()
  getAllAttendance(
    @Query("date") date?: string,
    @Query("month") month?: string
  ) {
    return this.attendanceService.getAllAttendance(date, month);
  }

  /** Mark an employee as absent for a given date and auto-reassign their appointments */
  @Roles("admin")
  @Post("mark-absent")
  markAbsent(@Body() dto: MarkAbsentDto) {
    return this.attendanceService.markAbsent(dto);
  }

  /** Monthly attendance summary per employee */
  @Roles("admin")
  @Get("summary")
  getMonthlySummary(@Query("month") month?: string) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    return this.attendanceService.getMonthlySummary(targetMonth);
  }
}
