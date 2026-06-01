import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { EmployeesService } from "./employees.service";

@ApiTags("Employees")
@ApiBearerAuth()
@Controller("employees")
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Roles("admin")
  @Get()
  findAll() {
    return this.employeesService.findAll();
  }

  @Roles("employee")
  @Get("me")
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.findMine(user.sub);
  }

  @Roles("employee")
  @Put("me/location")
  updateMyLocation(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateLocationDto) {
    return this.employeesService.updateMyLocation(user.sub, dto);
  }

  @Roles("employee")
  @Put(":id/location")
  updateLocation(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLocationDto
  ) {
    return this.employeesService.updateLocation(id, user.sub, dto);
  }

  @Roles("employee", "patient", "admin")
  @Post("fcm-token")
  registerFCMToken(@Body() dto: { token: string }) {
    return {
      success: true,
      message: "FCM token registered",
      data: { token: dto.token }
    };
  }
}
