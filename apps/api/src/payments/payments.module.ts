import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { OrdersModule } from "../orders/orders.module";
import { UsersModule } from "../users/users.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [PrismaModule, OrdersModule, UsersModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService]
})
export class PaymentsModule {}
