import { Module } from "@nestjs/common";

import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { OtpAssistanceController } from "./otp-assistance.controller";
import { OtpAssistanceService } from "./otp-assistance.service";

@Module({
  imports: [NotificationsModule, PrismaModule],
  controllers: [OtpAssistanceController],
  providers: [OtpAssistanceService]
})
export class OtpAssistanceModule {}
