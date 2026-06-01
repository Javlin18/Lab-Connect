import { Global, Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { FirebaseService } from "./firebase.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, FirebaseService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
