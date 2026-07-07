import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { AuthService } from "../auth/auth.service";
import { toSharedAppointment } from "../common/mappers/entity.mappers";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { EmailService } from "../email/email.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { AutoAssignService } from "./auto-assign.service";
import { AssignAppointmentDto } from "./dto/assign-appointment.dto";
import { CompleteAppointmentDto } from "./dto/complete-appointment.dto";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { ListAppointmentsDto } from "./dto/list-appointments.dto";
import { UpdateAppointmentStatusDto } from "./dto/update-appointment-status.dto";

@Injectable()
export class AppointmentsService {
  private readonly appointmentInclude = {
    patient: {
      select: { id: true, name: true, phone: true, email: true }
    },
    employee: {
      select: { id: true, name: true, phone: true }
    },
    admin: {
      select: { id: true, name: true, phone: true }
    },
    testResult: true,
    order: {
      select: {
        id: true,
        totalAmount: true,
        paymentStatus: true,
        paymentType: true,
        razorpayPaymentId: true,
        paidAt: true,
        paymentMethod: true
      }
    }
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly autoAssignService: AutoAssignService,
    private readonly emailService: EmailService,
    private readonly authService: AuthService
  ) {}

  private get maskedContactNumber() {
    return process.env.MASKED_COMPANY_PHONE ?? process.env.TWILIO_COMPANY_PHONE ?? process.env.TWILIO_PHONE ?? process.env.OFFICE_FALLBACK_PHONE ?? "";
  }

  async create(dto: CreateAppointmentDto, creator: AuthenticatedUser) {
    const patientId = creator.role === "patient" ? creator.sub : dto.patientId;
    const patient = await this.prisma.user.findFirst({
      where: { id: patientId, role: "patient" }
    });

    if (!patient) throw new NotFoundException("Patient not found");

    // Auto-assign employee if not explicitly provided
    let assignedEmployeeId = dto.employeeId ?? null;
    if (!assignedEmployeeId) {
      const slotDate = dto.slot.slice(0, 10);
      assignedEmployeeId = await this.autoAssignService.findAvailableEmployee(slotDate, dto.slot);
    } else {
      await this.ensureEmployeeExists(assignedEmployeeId);
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId,
        employeeId: assignedEmployeeId,
        adminId: creator.sub,
        testTypes: dto.testTypes,
        address: dto.address,
        slot: dto.slot,
        notes: dto.notes ?? "",
        status: assignedEmployeeId ? "assigned" : "pending"
      },
      include: this.appointmentInclude
    });

    await this.notificationsService.createNotification(
      patientId,
      "Appointment created",
      "A new appointment has been scheduled.",
      "appointment_created"
    );

    if (assignedEmployeeId) {
      await this.notificationsService.createNotification(
        assignedEmployeeId,
        "New assignment",
        `New appointment: ${patient.name} at ${dto.slot}.`,
        "appointment_assigned"
      );
    } else {
      // Notify all admins that manual assignment is needed
      const admins = await this.prisma.user.findMany({ where: { role: "admin" } });
      for (const admin of admins) {
        await this.notificationsService.createNotification(
          admin.id,
          "Manual assignment needed",
          `No employee available for ${dto.slot}. Please assign manually.`,
          "manual_assign_needed"
        );
      }
    }

    await this.audit("APPOINTMENT_CREATED", {
      actorId: creator.sub,
      actorRole: creator.role,
      appointmentId: appointment.id,
      patientId,
      employeeId: assignedEmployeeId
    });

    return { data: toSharedAppointment(appointment), message: "Appointment created" };
  }

  async findAll(query: ListAppointmentsDto) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: query.status,
        employeeId: query.employeeId,
        slot: query.date
          ? {
              startsWith: query.date
            }
          : undefined
      },
      include: this.appointmentInclude,
      orderBy: {
        createdAt: "desc"
      }
    });

    return {
      data: appointments.map((appointment) => this.presentAppointment(appointment, "admin")),
      message: "Appointments fetched"
    };
  }

  async findMine(patientId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        patientId
      },
      include: this.appointmentInclude,
      orderBy: {
        createdAt: "desc"
      }
    });

    return {
      data: appointments.map((appointment) => this.presentAppointment(appointment, "patient")),
      message: "Patient appointments fetched"
    };
  }

  async findAssigned(employeeId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        employeeId
      },
      include: this.appointmentInclude,
      orderBy: {
        createdAt: "desc"
      }
    });

    return {
      data: appointments.map((appointment) => this.presentAppointment(appointment, "employee")),
      message: "Assigned appointments fetched"
    };
  }

  async findAvailableForEmployee(employeeId: string) {
    const employee = await this.ensureEmployeeProfile(employeeId);

    if (!employee.isAvailable) {
      return {
        data: [],
        message: "Employee is busy"
      };
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        employeeId: null,
        status: "pending"
      },
      include: this.appointmentInclude,
      orderBy: {
        createdAt: "asc"
      }
    });

    return {
      data: appointments.map((appointment) => this.presentAppointment(appointment, "employee")),
      message: "Available appointments fetched"
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: this.appointmentInclude
    });

    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }

    if (user.role === "patient" && appointment.patientId !== user.sub) {
      throw new ForbiddenException("Forbidden");
    }

    if (user.role === "employee" && appointment.employeeId && appointment.employeeId !== user.sub) {
      throw new ForbiddenException("Forbidden");
    }

    return {
      data: this.presentAppointment(appointment, user.role),
      message: "Appointment fetched"
    };
  }

  async assign(id: string, dto: AssignAppointmentDto) {
    await this.ensureEmployeeExists(dto.employeeId);
    await this.ensureAppointmentExists(id);

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        employeeId: dto.employeeId,
        status: "assigned"
      },
      include: this.appointmentInclude
    });

    await this.notificationsService.createNotification(
      dto.employeeId,
      "Appointment assigned",
      "You have a new appointment assignment.",
      "appointment_assigned"
    );

    // Send collector assigned email to patient (non-blocking)
    if (appointment.patient && (appointment.patient as any).email) {
      this.emailService.sendCollectorAssigned({
        to:             (appointment.patient as any).email,
        patientName:    appointment.patient.name,
        bookingId:      appointment.id,
        collectorName:  appointment.employee?.name ?? "Collector",
        collectorPhone: appointment.employee?.phone ?? "",
        slot:           appointment.slot,
      }).catch(() => {});
    }

    return {
      data: toSharedAppointment(appointment),
      message: "Appointment assigned"
    };
  }

  async claim(id: string, employeeId: string) {
    await this.ensureAvailableEmployee(employeeId);

    const result = await this.prisma.appointment.updateMany({
      where: {
        id,
        employeeId: null,
        status: "pending"
      },
      data: {
        employeeId,
        status: "assigned"
      }
    });

    if (result.count === 0) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id }
      });

      if (!appointment) {
        throw new NotFoundException("Appointment not found");
      }

      throw new ConflictException("This booking has already been selected by another employee");
    }

    await this.prisma.employee.update({
      where: { userId: employeeId },
      data: { isAvailable: false }
    });

    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: this.appointmentInclude
    });

    await this.notificationsService.createNotification(
      employeeId,
      "Booking selected",
      "You selected a patient collection booking.",
      "appointment_assigned"
    );

    return {
      data: this.presentAppointment(appointment!, "employee"),
      message: "Appointment selected"
    };
  }

  async accept(id: string, employeeId: string) {
    const appointment = await this.assertEmployeeOwnsAppointment(id, employeeId);

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: "accepted"
      },
      include: this.appointmentInclude
    });

    return {
      data: toSharedAppointment(updated),
      message: "Appointment accepted"
    };
  }

  async updateStatus(id: string, employeeId: string, dto: UpdateAppointmentStatusDto) {
    const appointment = await this.assertEmployeeOwnsAppointment(id, employeeId);

    let notes = appointment.notes;
    if (dto.sampleId) notes += `\n[Sample Barcode: ${dto.sampleId}]`;
    if (dto.collectionNotes) notes += `\n[Collection Notes: ${dto.collectionNotes}]`;
    if (dto.collectedAt) notes += `\n[Collected At: ${dto.collectedAt}]`;

    let collectionOtpSource: string | null = null;
    if (dto.status === "collected") {
      if (appointment.notes.includes("[Collection Pre-Verified]")) {
        collectionOtpSource = appointment.notes.includes("Admin OTP approval") ? "admin" : "patient";
      } else {
        collectionOtpSource = await this.verifyCollectionOtp(appointment, employeeId, dto.otp);
        notes += `\n[Collection Verified]\n[OTP Verification: ${collectionOtpSource === "admin" ? "Admin OTP approval" : "Patient OTP"}]`;
      }
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: dto.status,
        notes,
        barcodes: dto.barcodes ? (dto.barcodes as any) : undefined
      },
      include: this.appointmentInclude
    });

    await this.notificationsService.createNotification(
      appointment.patientId,
      "Appointment updated",
      `Appointment status changed to ${dto.status}.`,
      "appointment_status"
    );

    if (dto.status === "collected") {
      await this.audit("SAMPLE_COLLECTION_COMPLETED", {
        actorId: employeeId,
        actorRole: "employee",
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        employeeId,
        metadata: { otpSource: collectionOtpSource }
      });

      await this.prisma.employee.update({
        where: { userId: employeeId },
        data: { isAvailable: true }
      });

      // Send feedback request notification after 30 min (non-blocking)
      const patientId = appointment.patientId;
      const appointmentId = updated.id;
      const notifService = this.notificationsService;
      setTimeout(() => {
        notifService.createNotification(
          patientId,
          "How was your experience?",
          "Tap to rate your sample collector.",
          "feedback_request"
        ).catch(() => {});
      }, 30 * 60 * 1000);
    }

    // Send sample collected email (non-blocking)
    if (dto.status === "collected" && updated.patient && (updated.patient as any).email) {
      this.emailService.sendSampleCollected({
        to:          (updated.patient as any).email,
        patientName: updated.patient.name,
        bookingId:   updated.id,
        tests:       updated.testTypes,
      }).catch(() => {});
    }

    return {
      data: this.presentAppointment(updated, "employee"),
      message: "Appointment status updated"
    };
  }

  async sendCollectionOtp(id: string, employeeId: string) {
    const appointment = await this.assertEmployeeOwnsAppointment(id, employeeId);
    if (!["accepted", "en_route"].includes(appointment.status)) {
      throw new BadRequestException("Collection OTP can only be sent for an active visit");
    }

    await this.authService.sendOtp({ phone: appointment.patient.phone });
    await this.audit("COLLECTION_OTP_SENT", {
      actorId: employeeId,
      actorRole: "employee",
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      employeeId
    });

    return {
      data: { appointmentId: appointment.id },
      message: "Collection OTP sent to patient"
    };
  }

  async verifyCollectionOtpEndpoint(id: string, employeeId: string, otp: string) {
    const appointment = await this.assertEmployeeOwnsAppointment(id, employeeId);
    if (!["accepted", "en_route"].includes(appointment.status)) {
      throw new BadRequestException("OTP can only be verified for an active visit");
    }

    const source = await this.verifyCollectionOtp(appointment, employeeId, otp);
    const updatedNotes = appointment.notes + `\n[Collection Pre-Verified]\n[OTP Verification: ${source === "admin" ? "Admin OTP approval" : "Patient OTP"}]`;

    await this.prisma.appointment.update({
      where: { id },
      data: { notes: updatedNotes }
    });

    return {
      data: { source },
      message: "OTP Verified Successfully"
    };
  }

  async complete(id: string, dto: CompleteAppointmentDto, user?: AuthenticatedUser) {
    const appointment = await this.ensureAppointmentExists(id);

    if (!appointment.notes.includes("[Collection Verified]")) {
      throw new BadRequestException("Sample collection must be OTP verified before completion");
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: "completed",
        notes: dto.notes
      },
      include: this.appointmentInclude
    });

    await this.audit("APPOINTMENT_COMPLETED", {
      actorId: user?.sub ?? null,
      actorRole: user?.role ?? null,
      appointmentId: updated.id,
      patientId: updated.patientId,
      employeeId: updated.employeeId,
      metadata: { notes: dto.notes ?? null }
    });

    await this.notificationsService.createNotification(
      updated.patientId,
      "Appointment completed",
      "Your report is ready or processing is complete.",
      "appointment_completed"
    );

    // Send report ready email (non-blocking)
    const patient = await this.prisma.user.findUnique({ where: { id: updated.patientId } });
    if (patient?.email) {
      this.emailService.sendReportReady({
        to:          patient.email,
        patientName: patient.name,
        bookingId:   updated.id,
        tests:       updated.testTypes,
      }).catch(() => {});
    }

    return {
      data: toSharedAppointment(updated),
      message: "Appointment completed"
    };
  }

  async cancel(id: string, adminId: string) {
    const appointment = await this.ensureAppointmentExists(id);

    if (["completed", "cancelled", "collected"].includes(appointment.status)) {
      throw new BadRequestException(`Cannot cancel an appointment with status ${appointment.status}`);
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: "cancelled" },
      include: this.appointmentInclude
    });

    if (appointment.employeeId) {
      await this.prisma.employee.update({
        where: { userId: appointment.employeeId },
        data: { isAvailable: true }
      });
      await this.notificationsService.createNotification(
        appointment.employeeId,
        "Appointment cancelled",
        "An appointment assigned to you has been cancelled.",
        "appointment_cancelled"
      );
    }

    await this.notificationsService.createNotification(
      appointment.patientId,
      "Appointment cancelled",
      "Your appointment has been cancelled by the admin.",
      "appointment_cancelled"
    );

    await this.audit("APPOINTMENT_CANCELLED", {
      actorId: adminId,
      actorRole: "admin",
      appointmentId: updated.id,
      patientId: updated.patientId,
      employeeId: updated.employeeId
    });

    return {
      data: toSharedAppointment(updated),
      message: "Appointment cancelled successfully"
    };
  }

  async reassignRequest(
    appointmentId: string,
    employeeId: string,
    reason: string,
    note?: string
  ) {
    const appointment = await this.assertEmployeeOwnsAppointment(appointmentId, employeeId);

    const request = await this.prisma.reassignRequest.create({
      data: {
        appointmentId: appointment.id,
        requestedBy: employeeId,
        reason,
        note
      }
    });

    const admins = await this.prisma.user.findMany({ where: { role: "admin" } });
    for (const admin of admins) {
      await this.notificationsService.createNotification(
        admin.id,
        "Reassignment requested",
        `Employee requested reassignment for appointment ${appointment.id.slice(0, 8)}.`,
        "reassign_request"
      );
    }

    return {
      data: request,
      message: "Reassignment request submitted"
    };
  }

  async resolveReassign(
    requestId: string,
    adminId: string,
    newEmployeeId: string
  ) {
    await this.ensureEmployeeExists(newEmployeeId);

    const request = await this.prisma.reassignRequest.findUnique({
      where: { id: requestId },
      include: { appointment: true }
    });

    if (!request) {
      throw new NotFoundException("Reassignment request not found");
    }

    if (request.status !== "pending") {
      throw new ConflictException("Reassignment request already resolved");
    }

    const appointment = await this.prisma.appointment.update({
      where: { id: request.appointmentId },
      data: {
        employeeId: newEmployeeId,
        status: "assigned"
      },
      include: this.appointmentInclude
    });

    await this.prisma.reassignRequest.update({
      where: { id: requestId },
      data: {
        status: "resolved",
        resolvedBy: adminId,
        newEmployeeId,
        resolvedAt: new Date()
      }
    });

    await this.notificationsService.createNotification(
      newEmployeeId,
      "New assignment",
      "You have a reassigned appointment.",
      "appointment_assigned"
    );

    return {
      data: toSharedAppointment(appointment),
      message: "Reassignment resolved"
    };
  }

  private async ensureEmployeeExists(employeeId: string) {
    const employee = await this.prisma.user.findFirst({
      where: {
        id: employeeId,
        role: "employee"
      }
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }
  }

  private async ensureAppointmentExists(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }

    return appointment;
  }

  private async assertEmployeeOwnsAppointment(id: string, employeeId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: this.appointmentInclude
    });

    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }

    if (appointment.employeeId !== employeeId) {
      throw new ForbiddenException("Not your appointment");
    }

    return appointment;
  }

  private async ensureAvailableEmployee(employeeId: string) {
    const employee = await this.ensureEmployeeProfile(employeeId);

    if (!employee.isAvailable) {
      throw new BadRequestException("Employee is currently busy");
    }

    return employee;
  }

  private async ensureEmployeeProfile(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        userId: employeeId
      },
      include: {
        user: true
      }
    });

    if (!employee || employee.user.role !== "employee") {
      throw new NotFoundException("Employee not found");
    }

    return employee;
  }

  private async verifyCollectionOtp(appointment: any, employeeId: string, otp?: string) {
    const cleanOtp = otp?.trim();
    if (!cleanOtp) {
      throw new BadRequestException("OTP verification is required to complete sample collection");
    }

    const assistance = await (this.prisma as any).otpAssistanceRequest.findFirst({
      where: {
        appointmentId: appointment.id,
        employeeId,
        status: "approved",
        otpShared: cleanOtp
      },
      orderBy: { resolvedAt: "desc" }
    });

    if (assistance) {
      if (assistance.adminOtpExpiresAt && assistance.adminOtpExpiresAt < new Date()) {
        throw new BadRequestException("Admin OTP expired");
      }

      await (this.prisma as any).otpAssistanceRequest.update({
        where: { id: assistance.id },
        data: { status: "verified_by_admin", resolvedAt: new Date() }
      });

      await this.audit("ADMIN_OTP_VERIFIED", {
        actorId: employeeId,
        actorRole: "employee",
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        employeeId,
        metadata: { otpAssistanceRequestId: assistance.id }
      });

      return "admin";
    }

    await this.authService.verifyOtp({ phone: appointment.patient.phone, otp: cleanOtp });
    await this.audit("PATIENT_OTP_VERIFIED", {
      actorId: employeeId,
      actorRole: "employee",
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      employeeId
    });

    return "patient";
  }

  private presentAppointment(appointment: any, viewerRole: AuthenticatedUser["role"]) {
    const shared = toSharedAppointment(appointment);
    const maskedPhone = this.maskedContactNumber;

    if (viewerRole === "employee" && shared.patient) {
      shared.patient = { ...shared.patient, phone: maskedPhone };
    }

    if (viewerRole === "patient" && shared.employee) {
      shared.employee = { ...shared.employee, phone: maskedPhone };
    }

    return shared;
  }

  private async audit(
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
}
