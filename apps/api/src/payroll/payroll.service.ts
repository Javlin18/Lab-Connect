import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdatePayConfigDto } from "./dto/update-config.dto";
import { CreateExpenseDto } from "./dto/create-expense.dto";

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  // Pay Configs
  async getGlobalConfig() {
    let config = await this.prisma.employeePayConfig.findFirst({
      where: { employeeId: null },
    });
    if (!config) {
      config = await this.prisma.employeePayConfig.create({
        data: {}, // Creates with defaults
      });
    }
    return config;
  }

  async getEmployeeConfig(employeeId: string) {
    const config = await this.prisma.employeePayConfig.findUnique({
      where: { employeeId },
    });
    return config || this.getGlobalConfig();
  }

  async updateEmployeeConfig(employeeId: string, dto: UpdatePayConfigDto) {
    if (employeeId !== "global") {
      const emp = await this.prisma.employee.findUnique({ where: { id: employeeId } });
      if (!emp) throw new NotFoundException("Employee not found");
    }

    const targetEmployeeId = employeeId === "global" ? null : employeeId;
    const existing = await this.prisma.employeePayConfig.findFirst({
      where: { employeeId: targetEmployeeId },
    });

    if (existing) {
      return this.prisma.employeePayConfig.update({
        where: { id: existing.id },
        data: dto,
      });
    } else {
      return this.prisma.employeePayConfig.create({
        data: { employeeId: targetEmployeeId, ...dto },
      });
    }
  }

  // Expense Records
  async getExpenses(month?: string) {
    return this.prisma.employeeExpenseRecord.findMany({
      where: month ? { month } : undefined,
      orderBy: { createdAt: "desc" },
      include: { employee: { include: { user: true } } },
    });
  }

  async createExpense(adminId: string, dto: CreateExpenseDto) {
    return this.prisma.employeeExpenseRecord.create({
      data: {
        ...dto,
        createdBy: adminId,
      },
    });
  }

  async deleteExpense(id: string) {
    return this.prisma.employeeExpenseRecord.delete({ where: { id } });
  }

  // Monthly Summary
  async getMonthlySummary(month: string) {
    const employees = await this.prisma.employee.findMany({
      include: { user: true },
    });
    return Promise.all(employees.map(emp => this.getEmployeeSummary(emp.id, month)));
  }

  async getEmployeeSummary(employeeId: string, month: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee) throw new NotFoundException("Employee not found");

    const config = await this.getEmployeeConfig(employeeId);
    
    // Get all completed and cancelled appointments for the month
    const appointments = await this.prisma.appointment.findMany({
      where: {
        employeeId: employee.userId,
        slot: { startsWith: month }, // assuming month is 'YYYY-MM'
        status: { in: ["completed", "cancelled"] },
      },
    });

    const completedSamples = appointments.filter(a => a.status === "completed").length;
    const cancellations = appointments.filter(a => a.status === "cancelled").length;
    // Get absence count from Attendance records
    const absences = await this.prisma.attendance.count({
      where: {
        employeeId: employee.id,
        date: { startsWith: month },
        status: "absent",
      },
    });
    const presentRecords = await this.prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        date: { startsWith: month },
        status: "present",
        checkInAt: { not: null },
      },
    });

    let lateArrivals = 0;
    for (const record of presentRecords) {
      if (record.checkInAt) {
        const checkInIst = new Date(record.checkInAt.getTime() + 330 * 60 * 1000);
        const h = checkInIst.getUTCHours();
        const m = checkInIst.getUTCMinutes();
        
        if (employee.shift === "shift_1") {
          if (h > 5 || (h === 5 && m > 15)) {
            lateArrivals++;
          }
        } else if (employee.shift === "shift_2") {
          if (h > 12 || (h === 12 && m > 15)) {
            lateArrivals++;
          }
        }
      }
    }

    const expenses = await this.prisma.employeeExpenseRecord.findMany({
      where: { employeeId, month },
    });

    let manualBonuses = 0;
    let manualDeductions = 0;
    let manualReimbursements = 0;

    for (const exp of expenses) {
      if (exp.type === "bonus") manualBonuses += exp.amount;
      else if (exp.type === "deduction") manualDeductions += exp.amount;
      else if (exp.type === "reimbursement") manualReimbursements += exp.amount;
    }

    const incentives = completedSamples * config.incentivePerSample;
    const cancellationDeductions = cancellations * config.cancellationDeduction;
    const absentDeductions = absences * config.absentDeduction;
    const lateArrivalDeductions = lateArrivals * config.lateArrivalDeduction;
    
    let starBonus = 0;
    if (completedSamples >= 120) starBonus = config.starBonus120;
    else if (completedSamples >= 80) starBonus = config.starBonus80;
    else if (completedSamples >= 40) starBonus = config.starBonus40;
    
    let referralBonus = 0;
    if (completedSamples >= 100) referralBonus = config.referralBonus;

    const netPay = Math.max(0, 
      incentives + 
      starBonus + 
      referralBonus + 
      manualBonuses + 
      manualReimbursements - 
      cancellationDeductions - 
      absentDeductions - 
      lateArrivalDeductions - 
      manualDeductions
    );

    return {
      employeeId,
      employeeName: employee.user.name,
      employeeZone: employee.zone,
      month,
      completedSamples,
      cancellations,
      incentives,
      starBonus,
      referralBonus,
      cancellationDeductions,
      absentDeductions,
      lateArrivalDeductions,
      manualBonuses,
      manualDeductions,
      manualReimbursements,
      netPay,
    };
  }

  async getEmployeeSummaryByUserId(userId: string, month: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (!employee) throw new NotFoundException("Employee profile not found");
    return this.getEmployeeSummary(employee.id, month);
  }

  async getCompletedOrdersCount(userId: string) {
    return this.prisma.appointment.count({
      where: {
        employeeId: userId,
        status: "completed",
      },
    });
  }
}
