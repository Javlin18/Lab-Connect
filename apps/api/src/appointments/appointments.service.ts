import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { toSharedAppointment } from "../common/mappers/entity.mappers";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { AssignAppointmentDto } from "./dto/assign-appointment.dto";
import { CompleteAppointmentDto } from "./dto/complete-appointment.dto";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { ListAppointmentsDto } from "./dto/list-appointments.dto";
import { UpdateAppointmentStatusDto } from "./dto/update-appointment-status.dto";

@Injectable()
export class AppointmentsService {
  private readonly appointmentInclude = {
    patient: {
      select: {
        id: true,
        name: true,
        phone: true
      }
    },
    employee: {
      select: {
        id: true,
        name: true,
        phone: true
      }
    },
    admin: {
      select: {
        id: true,
        name: true,
        phone: true
      }
    },
    testResult: true
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(dto: CreateAppointmentDto, creator: AuthenticatedUser) {
    const patientId = creator.role === "patient" ? creator.sub : dto.patientId;
    const patient = await this.prisma.user.findFirst({
      where: {
        id: patientId,
        role: "patient"
      }
    });

    if (!patient) {
      throw new NotFoundException("Patient not found");
    }

    if (dto.employeeId) {
      await this.ensureEmployeeExists(dto.employeeId);
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId,
        employeeId: dto.employeeId ?? null,
        adminId: creator.sub,
        testTypes: dto.testTypes,
        address: dto.address,
        slot: dto.slot,
        notes: dto.notes ?? "",
        status: dto.employeeId ? "assigned" : "pending"
      },
      include: this.appointmentInclude
    });

    await this.notificationsService.createNotification(
      patientId,
      "Appointment created",
      "A new appointment has been scheduled.",
      "appointment_created"
    );

    if (dto.employeeId) {
      await this.notificationsService.createNotification(
        dto.employeeId,
        "New assignment",
        "A new appointment has been assigned to you.",
        "appointment_assigned"
      );
    }

    return {
      data: toSharedAppointment(appointment),
      message: "Appointment created"
    };
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

    if (user.role === "employee" && appointment.employeeId !== user.sub) {
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

    return {
      data: toSharedAppointment(appointment),
      message: "Appointment assigned"
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
    if (dto.sampleId) {
      notes += `\n[Sample Barcode: ${dto.sampleId}]`;
    }
    if (dto.collectionNotes) {
      notes += `\n[Collection Notes: ${dto.collectionNotes}]`;
    }
    if (dto.collectedAt) {
      notes += `\n[Collected At: ${dto.collectedAt}]`;
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: dto.status,
        notes
      },
      include: this.appointmentInclude
    });

    await this.notificationsService.createNotification(
      appointment.patientId,
      "Appointment updated",
      `Appointment status changed to ${dto.status}.`,
      "appointment_status"
    );

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

    return {
      data: toSharedAppointment(updated),
      message: "Appointment completed"
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
}
