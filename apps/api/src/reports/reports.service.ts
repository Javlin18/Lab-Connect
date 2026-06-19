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

  async upload(appointmentId: string, file: Express.Multer.File | undefined, uploaderId: string) {
    if (!file) throw new BadRequestException("Report file required");

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId }
    });
    if (!appointment) throw new NotFoundException("Appointment not found");

    const uploader = await this.prisma.user.findUnique({ where: { id: uploaderId } });
    if (uploader?.role !== "admin") {
      throw new ForbiddenException("Only admin users can upload medical reports");
    }

    const extension = file.mimetype === "application/pdf" ? "pdf" : file.mimetype.split("/")[1] || "bin";
    const objectKey = `reports/${appointmentId}-${Date.now()}.${extension}`;
    await this.storageService.uploadPdf(objectKey, file.buffer, file.mimetype);

    const result = await this.prisma.testResult.upsert({
      where: { appointmentId },
      update: { reportUrl: objectKey, uploadedAt: new Date(), uploadedBy: uploaderId },
      create: { appointmentId, reportUrl: objectKey, uploadedBy: uploaderId }
    });

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "processing" }
    });

    await (this.prisma as any).systemAuditLog.create({
      data: {
        action: "REPORT_UPLOADED",
        actorId: uploaderId,
        actorRole: "admin",
        appointmentId,
        patientId: appointment.patientId,
        employeeId: appointment.employeeId,
        metadata: {
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size
        }
      }
    });

    // Notify patient
    await this.notificationsService.createNotification(
      appointment.patientId,
      "Report Ready",
      "Your test report is ready! Open the app to download it.",
      "report_uploaded"
    );

    // Notify admins
    const admins = await this.prisma.user.findMany({ where: { role: "admin" } });
    for (const admin of admins) {
      await this.notificationsService.createNotification(
        admin.id,
        "Report uploaded",
        `Report uploaded for appointment #${appointmentId.slice(0, 8)}.`,
        "report_uploaded_admin"
      );
    }

    return { data: toSharedTestResult(result), message: "Report uploaded" };
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

    if (!["admin", "patient"].includes(user.role)) {
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
