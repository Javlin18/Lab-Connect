import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { toSharedTestResult } from "../common/mappers/entity.mappers";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "./storage.service";

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationsService: NotificationsService
  ) {}

  async upload(appointmentId: string, file: Express.Multer.File | undefined, adminId: string) {
    if (!file) {
      throw new BadRequestException("PDF file required");
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }

    const objectKey = `reports/${appointmentId}-${Date.now()}.pdf`;
    await this.storageService.uploadPdf(objectKey, file.buffer, file.mimetype);

    const result = await this.prisma.testResult.upsert({
      where: {
        appointmentId
      },
      update: {
        reportUrl: objectKey,
        uploadedAt: new Date(),
        uploadedBy: adminId
      },
      create: {
        appointmentId,
        reportUrl: objectKey,
        uploadedBy: adminId
      }
    });

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "processing"
      }
    });

    await this.notificationsService.createNotification(
      appointment.patientId,
      "Report uploaded",
      "Your report is available for download.",
      "report_uploaded"
    );

    return {
      data: toSharedTestResult(result),
      message: "Report uploaded"
    };
  }

  async getByAppointment(appointmentId: string, user: AuthenticatedUser) {
    const result = await this.prisma.testResult.findUnique({
      where: {
        appointmentId
      },
      include: {
        appointment: true
      }
    });

    if (!result) {
      throw new NotFoundException("Report not found");
    }

    if (user.role === "patient" && result.appointment.patientId !== user.sub) {
      throw new ForbiddenException("Forbidden");
    }

    if (user.role !== "admin" && user.role !== "patient") {
      throw new ForbiddenException("Forbidden");
    }

    const downloadUrl = await this.storageService.getDownloadUrl(result.reportUrl);

    return {
      data: {
        report: toSharedTestResult(result),
        downloadUrl
      },
      message: "Report fetched"
    };
  }
}
