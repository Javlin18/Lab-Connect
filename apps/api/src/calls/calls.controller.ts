import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CallsService } from "./calls.service";

@ApiTags("Calls")
@ApiBearerAuth()
@Controller("calls")
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Public()
  @Post("incoming-call")
  async incomingCall(@Body() body: Record<string, string>, @Res() res: Response) {
    const fromPhone = body.From ?? body.from ?? "";
    const twiml = await this.callsService.handleIncomingCall(fromPhone);
    res.set("Content-Type", "text/xml");
    res.send(twiml);
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
