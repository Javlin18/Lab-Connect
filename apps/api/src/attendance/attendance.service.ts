import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AutoAssignService } from "../appointments/auto-assign.service";
import { PrismaService } from "../prisma/prisma.service";
import { CheckInDto } from "./dto/check-in.dto";
import { MarkAbsentDto } from "./dto/mark-absent.dto";

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoAssign: AutoAssignService
  ) {}

  /** Today's date string in YYYY-MM-DD (IST-aware via toLocaleDateString won't work server-side, use UTC offset) */
  private today(): string {
    const d = new Date();
    // Use IST offset (+5:30 = 330 min)
    const ist = new Date(d.getTime() + 330 * 60 * 1000);
    return ist.toISOString().slice(0, 10);
  }

  // ── Employee: Check In ────────────────────────────────────────────────────

  async checkIn(userId: string, dto: CheckInDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (!employee) throw new NotFoundException("Employee profile not found");

    const d = new Date();
    const ist = new Date(d.getTime() + 330 * 60 * 1000);
    const hour = ist.getUTCHours(); // IST hour

    if (employee.shift === "shift_1") {
      if (hour < 4 || hour >= 13) {
        throw new BadRequestException("You can only check in during Shift 1 (5 AM - 12 PM)");
      }
    } else if (employee.shift === "shift_2") {
      if (hour < 11 || hour >= 19) {
        throw new BadRequestException("You can only check in during Shift 2 (12 PM - 6 PM)");
      }
    }

    const date = ist.toISOString().slice(0, 10);

    // Prevent duplicate check-in
    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date } },
    });
    if (existing) {
      if (existing.status === "present") {
        throw new BadRequestException("Already checked in for today");
      }
      // Was marked absent by admin — allow override with selfie
    }

    const record = await this.prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: employee.id, date } },
      create: {
        employeeId: employee.id,
        date,
        status: "present",
        checkInAt: new Date(),
        selfieUrl: dto.selfieUrl,
        note: dto.note,
      },
      update: {
        status: "present",
        checkInAt: new Date(),
        selfieUrl: dto.selfieUrl,
        note: dto.note,
      },
    });

    return { data: record, message: "Attendance marked successfully" };
  }

  // ── Employee: Own History ─────────────────────────────────────────────────

  async getMyAttendance(userId: string, month?: string) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException("Employee profile not found");

    const where: any = { employeeId: employee.id };
    if (month) where.date = { startsWith: month };

    const records = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return { data: records, message: "Attendance fetched" };
  }

  async getTodayStatus(userId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException("Employee profile not found");

    const date = this.today();
    const record = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date } },
    });

    return { data: record ?? null, message: "Today status fetched" };
  }

  // ── Admin: All Attendance ─────────────────────────────────────────────────

  async getAllAttendance(date?: string, month?: string) {
    const where: any = {};
    if (date) where.date = date;
    else if (month) where.date = { startsWith: month };

    const records = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        employee: {
          include: { user: true },
        },
      },
    });

    return { data: records, message: "Attendance records fetched" };
  }

  // ── Admin: Mark Absent + Reassign ─────────────────────────────────────────

  async markAbsent(dto: MarkAbsentDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: { user: true },
    });
    if (!employee) throw new NotFoundException("Employee not found");

    // Upsert absent record
    const record = await this.prisma.attendance.upsert({
      where: {
        employeeId_date: { employeeId: dto.employeeId, date: dto.date },
      },
      create: {
        employeeId: dto.employeeId,
        date: dto.date,
        status: "absent",
        note: dto.note,
      },
      update: {
        status: "absent",
        note: dto.note,
        checkInAt: null,
        selfieUrl: null,
      },
    });

    // Reassign all their appointments on this date
    const reassigned = await this.reassignAppointments(
      employee.userId,
      dto.date
    );

    return {
      data: { attendance: record, reassignedCount: reassigned },
      message: `Marked absent. ${reassigned} appointment(s) reassigned.`,
    };
  }

  private async reassignAppointments(
    employeeUserId: string,
    date: string
  ): Promise<number> {
    // Find pending/assigned appointments for this employee on this date
    const appointments = await this.prisma.appointment.findMany({
      where: {
        employeeId: employeeUserId,
        slot: { startsWith: date },
        status: { in: ["pending", "assigned", "accepted", "en_route"] },
      },
    });

    let reassignedCount = 0;

    for (const appt of appointments) {
      // Find another available employee
      const newEmployeeUserId = await this.autoAssign.findAvailableEmployee(
        date,
        appt.slot
      );

      if (newEmployeeUserId && newEmployeeUserId !== employeeUserId) {
        await this.prisma.appointment.update({
          where: { id: appt.id },
          data: {
            employeeId: newEmployeeUserId,
            status: "assigned",
          },
        });
        reassignedCount++;
      } else {
        // No replacement found — unassign
        await this.prisma.appointment.update({
          where: { id: appt.id },
          data: {
            employeeId: null,
            status: "pending",
          },
        });
      }
    }

    return reassignedCount;
  }

  // ── Admin: Monthly Summary ────────────────────────────────────────────────

  async getMonthlySummary(month: string) {
    const employees = await this.prisma.employee.findMany({
      include: { user: true },
    });

    const summary = await Promise.all(
      employees.map(async (emp) => {
        const records = await this.prisma.attendance.findMany({
          where: { employeeId: emp.id, date: { startsWith: month } },
        });

        const presentDays = records.filter((r) => r.status === "present").length;
        const absentDays = records.filter((r) => r.status === "absent").length;
        const totalMarked = records.length;

        return {
          employeeId: emp.id,
          employeeName: emp.user.name,
          employeeZone: emp.zone,
          presentDays,
          absentDays,
          totalMarked,
        };
      })
    );

    return { data: summary, message: "Monthly summary fetched" };
  }

  // ── Used by Payroll Service ───────────────────────────────────────────────

  async getAbsentCount(employeeId: string, month: string): Promise<number> {
    return this.prisma.attendance.count({
      where: {
        employeeId,
        date: { startsWith: month },
        status: "absent",
      },
    });
  }
}
