import { Module } from "@nestjs/common";

import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { StorageService } from "./storage.service";

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ReportsController],
  providers: [ReportsService, StorageService]
})
export class ReportsModule {}
