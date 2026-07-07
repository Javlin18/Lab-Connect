import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CallsService } from "./calls.service";

interface AuthenticatedUser {
  sub: string;
  role: string;
}

@ApiTags("Calls")
@ApiBearerAuth()
@Controller("calls")
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  /**
   * Employee initiates a masked call to a patient via Exotel.
   * The employee's phone rings first, then bridges to the patient.
   */
  @Post("connect")
  @Roles("employee", "admin")
  async connectCall(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { appointmentId: string }
  ) {
    const result = await this.callsService.connectCall(body.appointmentId, user.sub);
    return { data: result };
  }

  /**
   * Patient initiates a masked call to an employee via Exotel.
   * The patient's phone rings first, then bridges to the employee.
   */
  @Post("connect-patient")
  @Roles("patient")
  async connectPatientCall(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { appointmentId: string }
  ) {
    const result = await this.callsService.connectPatientCall(body.appointmentId, user.sub);
    return { data: result };
  }

  @Public()
  @Post("incoming-call")
  async incomingCall(@Body() body: Record<string, string>, @Res() res: Response) {
    const fromPhone = body.From ?? body.from ?? "";
    const twiml = await this.callsService.handleIncomingCall(fromPhone);
    res.set("Content-Type", "text/xml");
    res.send(twiml);
  }

  @Public()
  @Post("exotel-status")
  async exotelStatusCallback(@Body() body: Record<string, any>) {
    await this.callsService.handleExotelStatusCallback(body);
    return { success: true };
  }

  @Public()
  @Post("status-callback")
  async statusCallback(@Body() body: Record<string, string>) {
    await this.callsService.handleStatusCallback(
      body.CallSid ?? "",
      body.CallStatus ?? "unknown",
      body.CallDuration ?? "0"
    );
    return { success: true };
  }

  @Roles("admin")
  @Get("logs")
  getLogs() {
    return this.callsService.getLogs();
  }
}
