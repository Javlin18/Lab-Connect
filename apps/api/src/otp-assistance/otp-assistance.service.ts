import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomInt } from "crypto";

import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

const requestInclude = {
  appointment: {
    include: {
      order: { select: { id: true } },
      patient: { select: { id: true, name: true, phone: true } },
      employee: { select: { id: true, name: true, phone: true } }
    }
  },
  employee: { select: { id: true, name: true, phone: true } },
  patient: { select: { id: true, name: true, phone: true } },
  bookingOwner: { select: { id: true, name: true, phone: true } },
  admin: { select: { id: true, name: true } },
  auditLogs: { orderBy: { createdAt: "desc" } }
} as const;

@Injectable()
export class OtpAssistanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(user: AuthenticatedUser, appointmentId: string, reason: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        order: { select: { id: true } },
        patient: { select: { id: true, name: true, phone: true } },
        employee: { select: { id: true, name: true, phone: true } }
      }
    });

    if (!appointment) throw new NotFoundException("Appointment not found");
    if (appointment.employeeId !== user.sub) throw new ForbiddenException("Not your appointment");

    const open = await (this.prisma as any).otpAssistanceRequest.findFirst({
      where: { appointmentId, status: { in: ["pending", "approved"] } },
      include: requestInclude
    });
    if (open) return { data: this.toDto(open), message: "OTP assistance request already open" };

    const cleanReason = reason?.trim() || "Booking owner unavailable to share OTP";
    const adminOtp = this.generateOtp();
    const adminOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const request = await (this.prisma as any).otpAssistanceRequest.create({
      data: {
        appointmentId,
        orderId: appointment.order?.id ?? null,
        employeeId: user.sub,
        patientId: appointment.patientId,
        bookingOwnerId: appointment.patientId,
        reason: cleanReason,
        collectionLocation: appointment.address,
        adminOtp,
        adminOtpExpiresAt,
        auditLogs: {
          create: {
            appointmentId,
            orderId: appointment.order?.id ?? null,
            action: "OTP_ASSISTANCE_REQUESTED",
            reason: cleanReason,
            actorId: user.sub,
            actorName: appointment.employee?.name ?? "Employee",
            actorRole: "employee",
            employeeName: appointment.employee?.name ?? null
          }
        }
      },
      include: requestInclude
    });

    await this.auditSystem("ADMIN_OTP_GENERATED", {
      actorId: user.sub,
      actorRole: "employee",
      appointmentId,
      patientId: appointment.patientId,
      employeeId: user.sub,
      metadata: { otpAssistanceRequestId: request.id }
    });
    await this.appendTimeline(appointmentId, "OTP Assistance Requested", cleanReason);
    const admins = await this.prisma.user.findMany({ where: { role: "admin" } });
    await Promise.all(
      admins.map((admin) =>
        this.notificationsService.createNotification(
          admin.id,
          "OTP Assistance Request",
          `${appointment.employee?.name ?? "Employee"} requested OTP help for ${appointment.patient?.name ?? "patient"} at ${appointment.address}. Admin OTP: ${adminOtp}`,
          `otp_assistance:${request.id}`
        )
      )
    );

    return { data: this.toDto(request), message: "OTP assistance request created" };
  }

  async list(user: AuthenticatedUser, appointmentId?: string) {
    const where: any = {};
    if (appointmentId) where.appointmentId = appointmentId;
    if (user.role === "employee") where.employeeId = user.sub;

    const requests = await (this.prisma as any).otpAssistanceRequest.findMany({
      where,
      include: requestInclude,
      orderBy: { requestedAt: "desc" },
      take: 100
    });

    return { data: requests.map((request: any) => this.toDto(request)), message: "OTP assistance requests fetched" };
  }

  async viewOtp(user: AuthenticatedUser, id: string) {
    const request = await this.getRequest(id);
    const otp = await this.ensureAdminOtp(request);
    await this.audit(request, user, "VIEW_OTP", "Admin viewed OTP");
    return { data: { otp: otp.code, expiresAt: otp.expiresAt.toISOString() }, message: "OTP fetched" };
  }

  async resendOtp(user: AuthenticatedUser, id: string, reason?: string) {
    const request = await this.getRequest(id);
    const adminOtp = this.generateOtp();
    const adminOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const updated = await (this.prisma as any).otpAssistanceRequest.update({
      where: { id },
      data: { adminOtp, adminOtpExpiresAt, otpShared: null, status: "pending" },
      include: requestInclude
    });
    await this.audit(request, user, "RESEND_ADMIN_OTP", reason ?? "Admin regenerated OTP");
    await this.auditSystem("ADMIN_OTP_GENERATED", {
      actorId: user.sub,
      actorRole: user.role,
      appointmentId: request.appointmentId,
      patientId: request.patientId,
      employeeId: request.employeeId,
      metadata: { otpAssistanceRequestId: request.id, regenerated: true }
    });
    await this.appendTimeline(request.appointmentId, "Admin OTP Generated", "Admin regenerated collection OTP");
    return { data: this.toDto(updated), message: "Admin OTP regenerated" };
  }

  async shareOtp(user: AuthenticatedUser, id: string, reason?: string) {
    const request = await this.getRequest(id);
    const otp = await this.ensureAdminOtp(request);

    const updated = await (this.prisma as any).otpAssistanceRequest.update({
      where: { id },
      data: { otpShared: otp.code, status: "approved", resolvedBy: user.sub, resolvedAt: new Date(), adminReason: reason ?? null },
      include: requestInclude
    });
    await this.audit(updated, user, "SHARE_OTP", reason ?? "Admin shared OTP with employee");
    await this.auditSystem("ADMIN_OTP_APPROVED", {
      actorId: user.sub,
      actorRole: "admin",
      appointmentId: request.appointmentId,
      patientId: request.patientId,
      employeeId: request.employeeId,
      metadata: { otpAssistanceRequestId: request.id }
    });
    await this.appendTimeline(request.appointmentId, "Admin Approved Verification", "OTP shared with employee");
    await this.notifyEmployee(updated, `Admin shared OTP ${otp.code} for booking #${request.appointmentId.slice(0, 8)}.`);
    return { data: this.toDto(updated), message: "OTP shared with employee" };
  }

  async approve(user: AuthenticatedUser, id: string, reason?: string) {
    const request = await this.getRequest(id);
    const otp = await this.ensureAdminOtp(request);
    const updated = await (this.prisma as any).otpAssistanceRequest.update({
      where: { id },
      data: { otpShared: otp.code, status: "approved", resolvedBy: user.sub, resolvedAt: new Date(), adminReason: reason ?? null },
      include: requestInclude
    });
    await this.audit(updated, user, "APPROVE_VERIFICATION", reason ?? "Admin approved OTP assistance");
    await this.auditSystem("ADMIN_OTP_APPROVED", {
      actorId: user.sub,
      actorRole: "admin",
      appointmentId: request.appointmentId,
      patientId: request.patientId,
      employeeId: request.employeeId,
      metadata: { otpAssistanceRequestId: request.id }
    });
    await this.appendTimeline(request.appointmentId, "Admin Approved Verification", reason ?? "Admin approved verification assistance");
    await this.notifyEmployee(updated, `Admin approved your OTP assistance request. Use OTP ${otp.code} to complete collection.`);
    return { data: this.toDto(updated), message: "Verification assistance approved" };
  }

  async forceVerify(user: AuthenticatedUser, id: string, reason?: string) {
    const request = await this.getRequest(id);
    const otp = await this.ensureAdminOtp(request);
    const updated = await (this.prisma as any).otpAssistanceRequest.update({
      where: { id },
      data: { otpShared: otp.code, status: "approved", resolvedBy: user.sub, resolvedAt: new Date(), adminReason: reason ?? null },
      include: requestInclude
    });
    await this.audit(updated, user, "ADMIN_OTP_APPROVED", reason ?? "Admin approved OTP assistance");
    await this.auditSystem("ADMIN_OTP_APPROVED", {
      actorId: user.sub,
      actorRole: "admin",
      appointmentId: request.appointmentId,
      patientId: request.patientId,
      employeeId: request.employeeId,
      metadata: { otpAssistanceRequestId: request.id, forceVerifyConvertedToOtp: true }
    });
    await this.appendTimeline(request.appointmentId, "Admin OTP Approved", reason ?? "Admin approved OTP assistance");
    await this.notifyEmployee(updated, `Admin approved collection OTP ${otp.code}. Enter it to complete the collection.`);
    return { data: this.toDto(updated), message: "Admin OTP approved. Employee must enter OTP to complete collection." };
  }

  async reject(user: AuthenticatedUser, id: string, reason?: string) {
    const request = await this.getRequest(id);
    const updated = await (this.prisma as any).otpAssistanceRequest.update({
      where: { id },
      data: { status: "rejected", resolvedBy: user.sub, resolvedAt: new Date(), adminReason: reason ?? null },
      include: requestInclude
    });
    await this.audit(updated, user, "REJECT_REQUEST", reason ?? "Admin rejected OTP assistance request");
    await this.notifyEmployee(updated, `Admin rejected OTP assistance request${reason ? `: ${reason}` : "."}`);
    return { data: this.toDto(updated), message: "OTP assistance request rejected" };
  }

  private async getRequest(id: string) {
    const request = await (this.prisma as any).otpAssistanceRequest.findUnique({ where: { id }, include: requestInclude });
    if (!request) throw new NotFoundException("OTP assistance request not found");
    return request;
  }

  private generateOtp() {
    return String(randomInt(1000, 10000));
  }

  private async ensureAdminOtp(request: any) {
    if (request.adminOtp && request.adminOtpExpiresAt && request.adminOtpExpiresAt > new Date()) {
      return { code: request.adminOtp, expiresAt: request.adminOtpExpiresAt };
    }

    const adminOtp = this.generateOtp();
    const adminOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await (this.prisma as any).otpAssistanceRequest.update({
      where: { id: request.id },
      data: { adminOtp, adminOtpExpiresAt, otpShared: null, status: "pending" }
    });
    await this.auditSystem("ADMIN_OTP_GENERATED", {
      appointmentId: request.appointmentId,
      patientId: request.patientId,
      employeeId: request.employeeId,
      metadata: { otpAssistanceRequestId: request.id, regenerated: true }
    });
    return { code: adminOtp, expiresAt: adminOtpExpiresAt };
  }

  private async audit(request: any, user: AuthenticatedUser, action: string, reason?: string) {
    const actor = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { name: true } });
    await (this.prisma as any).otpAssistanceAuditLog.create({
      data: {
        requestId: request.id,
        appointmentId: request.appointmentId,
        orderId: request.orderId,
        action,
        reason,
        actorId: user.sub,
        actorName: actor?.name ?? user.email,
        actorRole: user.role,
        employeeName: request.employee?.name ?? request.appointment?.employee?.name ?? null
      }
    });
  }

  private async appendTimeline(appointmentId: string, title: string, detail?: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id: appointmentId }, select: { notes: true } });
    const timestamp = new Date().toISOString();
    const entry = `[Timeline: ${title} at ${timestamp}${detail ? ` - ${detail}` : ""}]`;
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { notes: `${appointment?.notes ?? ""}\n${entry}` }
    });
  }

  private async auditSystem(
    action: string,
    input: {
      actorId?: string | null;
      actorRole?: "admin" | "employee" | "patient" | null;
      appointmentId?: string | null;
      patientId?: string | null;
      employeeId?: string | null;
      metadata?: Record<string, unknown>;
    }
  ) {
    await (this.prisma as any).systemAuditLog.create({
      data: {
        action,
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        appointmentId: input.appointmentId ?? null,
        patientId: input.patientId ?? null,
        employeeId: input.employeeId ?? null,
        metadata: input.metadata ?? undefined
      }
    });
  }

  private async notifyEmployee(request: any, body: string) {
    await this.notificationsService.createNotification(request.employeeId, "OTP Assistance Update", body, `otp_assistance:${request.id}`);
  }

  private toDto(request: any) {
    return {
      id: request.id,
      appointmentId: request.appointmentId,
      orderId: request.orderId ?? request.appointment?.order?.id ?? null,
      bookingId: request.appointmentId,
      patientName: request.patient?.name ?? request.appointment?.patient?.name ?? "Patient",
      bookingOwnerName: request.bookingOwner?.name ?? request.patient?.name ?? "Booking Owner",
      employeeName: request.employee?.name ?? request.appointment?.employee?.name ?? "Employee",
      collectionLocation: request.collectionLocation,
      reason: request.reason,
      status: request.status,
      requestedAt: request.requestedAt,
      resolvedAt: request.resolvedAt,
      adminName: request.admin?.name ?? null,
      adminReason: request.adminReason ?? null,
      otpShared: request.otpShared ?? null,
      auditLogs: request.auditLogs ?? []
    };
  }
}
