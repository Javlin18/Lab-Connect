import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

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
<<<<<<< HEAD
    private readonly autoAssignService: AutoAssignService
=======
    private readonly emailService: EmailService
>>>>>>> 289d031 (auth)
  ) {}

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

<<<<<<< HEAD
    return { data: toSharedAppointment(appointment), message: "Appointment created" };
=======
    // Send booking confirmation email (non-blocking)
    if (appointment.patient && (appointment.patient as any).email) {
      this.emailService.sendBookingConfirmation({
        to:          (appointment.patient as any).email,
        patientName: appointment.patient.name,
        bookingId:   appointment.id,
        tests:       appointment.testTypes,
        slot:        appointment.slot,
        address:     appointment.address,
      }).catch(() => {});
    }

    return {
      data: toSharedAppointment(appointment),
      message: "Appointment created"
    };
>>>>>>> 289d031 (auth)
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
      data: appointments.map(toSharedAppointment),
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
      data: appointments.map(toSharedAppointment),
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
      data: appointments.map(toSharedAppointment),
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
      data: appointments.map(toSharedAppointment),
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
      data: toSharedAppointment(appointment),
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
      data: toSharedAppointment(appointment!),
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
      await this.prisma.employee.update({
        where: { userId: employeeId },
        data: { isAvailable: true }
      });
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
      data: toSharedAppointment(updated),
      message: "Appointment status updated"
    };
  }

  async complete(id: string, dto: CompleteAppointmentDto) {
    await this.ensureAppointmentExists(id);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: "completed",
        notes: dto.notes
      },
      include: this.appointmentInclude
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
}
