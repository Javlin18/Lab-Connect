import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { AppointmentsService } from "./appointments.service";
import { AssignAppointmentDto } from "./dto/assign-appointment.dto";
import { CompleteAppointmentDto } from "./dto/complete-appointment.dto";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { ListAppointmentsDto } from "./dto/list-appointments.dto";
import { UpdateAppointmentStatusDto } from "./dto/update-appointment-status.dto";

@ApiTags("Appointments")
@ApiBearerAuth()
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles("admin", "patient")
  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.create(dto, user);
  }

  @Roles("admin")
  @Get()
  findAll(@Query() query: ListAppointmentsDto) {
    return this.appointmentsService.findAll(query);
  }

  @Roles("patient")
  @Get("mine")
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findMine(user.sub);
  }

  @Roles("employee")
  @Get("assigned")
  findAssigned(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findAssigned(user.sub);
  }

  @Roles("employee")
  @Get("available")
  findAvailable(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findAvailableForEmployee(user.sub);
  }

  @Roles("admin", "employee", "patient")
  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findOne(id, user);
  }

  @Roles("admin")
  @Put(":id/assign")
  assign(@Param("id") id: string, @Body() dto: AssignAppointmentDto) {
    return this.appointmentsService.assign(id, dto);
  }

  @Roles("employee")
  @Put(":id/accept")
  accept(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.accept(id, user.sub);
  }

  @Roles("employee")
  @Put(":id/claim")
  claim(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.claim(id, user.sub);
  }

  @Roles("employee")
  @Put(":id/status")
  updateStatus(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAppointmentStatusDto
  ) {
    return this.appointmentsService.updateStatus(id, user.sub, dto);
  }

  @Roles("admin")
  @Put(":id/complete")
  complete(@Param("id") id: string, @Body() dto: CompleteAppointmentDto) {
    return this.appointmentsService.complete(id, dto);
  }
}
