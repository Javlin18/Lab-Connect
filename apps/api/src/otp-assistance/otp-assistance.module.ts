import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { OtpAssistanceController } from "./otp-assistance.controller";
import { OtpAssistanceService } from "./otp-assistance.service";

@Module({
  imports: [AuthModule, NotificationsModule, PrismaModule],
  controllers: [OtpAssistanceController],
  providers: [OtpAssistanceService]
})
export class OtpAssistanceModule {}
