import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { PayrollService } from "./payroll.service";
import { UpdatePayConfigDto } from "./dto/update-config.dto";
import { CreateExpenseDto } from "./dto/create-expense.dto";

@ApiTags("Payroll")
@ApiBearerAuth()
@Controller("payroll")
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get("me")
  @Roles("employee", "admin")
  async getMyPayrollSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query("month") month: string
  ) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const summary = await this.payrollService.getEmployeeSummaryByUserId(user.sub, targetMonth);
    const completedOrders = await this.payrollService.getCompletedOrdersCount(user.sub);
    return { data: { ...summary, completedOrders } };
  }

  @Get("config")
  @Roles("admin")
  async getGlobalConfig() {
    return { data: await this.payrollService.getGlobalConfig() };
  }

  @Get("config/:employeeId")
  @Roles("admin")
  async getEmployeeConfig(@Param("employeeId") employeeId: string) {
    return { data: await this.payrollService.getEmployeeConfig(employeeId) };
  }

  @Put("config/:employeeId")
  @Roles("admin")
  async updateEmployeeConfig(
    @Param("employeeId") employeeId: string,
    @Body() dto: UpdatePayConfigDto
  ) {
    return { data: await this.payrollService.updateEmployeeConfig(employeeId, dto) };
  }

  @Get("summary")
  @Roles("admin")
  async getMonthlySummary(@Query("month") month: string) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    return { data: await this.payrollService.getMonthlySummary(targetMonth) };
  }

  @Get("summary/:employeeId")
  @Roles("admin")
  async getEmployeeSummary(
    @Param("employeeId") employeeId: string,
    @Query("month") month: string
  ) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    return { data: await this.payrollService.getEmployeeSummary(employeeId, targetMonth) };
  }

  @Get("expenses")
  @Roles("admin")
  async getExpenses(@Query("month") month?: string) {
    return { data: await this.payrollService.getExpenses(month) };
  }

  @Post("expenses")
  @Roles("admin")
  async createExpense(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExpenseDto
  ) {
    return { data: await this.payrollService.createExpense(user.sub, dto) };
  }

  @Delete("expenses/:id")
  @Roles("admin")
  async deleteExpense(@Param("id") id: string) {
    await this.payrollService.deleteExpense(id);
    return { success: true, message: "Expense deleted" };
  }
}

