import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { OtpAssistanceService } from "./otp-assistance.service";

@ApiTags("OTP Assistance")
@ApiBearerAuth()
@Controller("otp-assistance")
export class OtpAssistanceController {
  constructor(private readonly otpAssistanceService: OtpAssistanceService) {}

  @Roles("employee")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: { appointmentId: string; reason: string }) {
    return this.otpAssistanceService.create(user, body.appointmentId, body.reason);
  }

  @Roles("employee", "admin")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query("appointmentId") appointmentId?: string) {
    return this.otpAssistanceService.list(user, appointmentId);
  }

  @Roles("admin")
  @Get(":id/otp")
  viewOtp(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.otpAssistanceService.viewOtp(user, id);
  }

  @Roles("admin")
  @Put(":id/resend-otp")
  resendOtp(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: { reason?: string }) {
    return this.otpAssistanceService.resendOtp(user, id, body?.reason);
  }

  @Roles("admin")
  @Put(":id/share-otp")
  shareOtp(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: { reason?: string }) {
    return this.otpAssistanceService.shareOtp(user, id, body?.reason);
  }

  @Roles("admin")
  @Put(":id/approve")
  approve(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: { reason?: string }) {
    return this.otpAssistanceService.approve(user, id, body?.reason);
  }

  @Roles("admin")
  @Put(":id/force-verify")
  forceVerify(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: { reason?: string }) {
    return this.otpAssistanceService.forceVerify(user, id, body?.reason);
  }

  @Roles("admin")
  @Put(":id/reject")
  reject(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: { reason?: string }) {
    return this.otpAssistanceService.reject(user, id, body?.reason);
  }
}
