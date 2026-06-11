import { Module } from "@nestjs/common";

import { EmailModule } from "../email/email.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";
import { AutoAssignService } from "./auto-assign.service";

@Module({
  imports: [PrismaModule, NotificationsModule, EmailModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AutoAssignService],
  exports: [AppointmentsService, AutoAssignService]
})
export class AppointmentsModule {}
