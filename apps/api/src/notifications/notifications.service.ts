import { Injectable, NotFoundException } from "@nestjs/common";

import { toSharedNotification } from "../common/mappers/entity.mappers";
import { PrismaService } from "../prisma/prisma.service";
import { FirebaseService } from "./firebase.service";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService
  ) {}

  async getMine(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return {
      data: notifications.map(toSharedNotification),
      message: "Notifications fetched"
    };
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        read: true
      }
    });

    return {
      data: toSharedNotification(updated),
      message: "Notification marked as read"
    };
  }

  async createNotification(userId: string, title: string, body: string, type: string) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type
      }
    });

    return toSharedNotification(notification);
  }

  async sendPushNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    return this.firebaseService.send(deviceToken, title, body, data);
  }
}
