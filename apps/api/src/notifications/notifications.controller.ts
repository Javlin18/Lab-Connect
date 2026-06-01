import { Controller, Get, Param, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("mine")
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getMine(user.sub);
  }

  @Put(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markRead(id, user.sub);
  }
}
