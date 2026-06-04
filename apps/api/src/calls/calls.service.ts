import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CallsService {
  constructor(private readonly prisma: PrismaService) {}

  private get companyPhone() {
    return process.env.TWILIO_COMPANY_PHONE ?? process.env.TWILIO_PHONE ?? "";
  }

  private get officePhone() {
    return process.env.OFFICE_FALLBACK_PHONE ?? this.companyPhone;
  }

  async handleIncomingCall(fromPhone: string): Promise<string> {
    // Find patient by phone
    const patient = await this.prisma.user.findFirst({
      where: { phone: fromPhone, role: "patient" },
    });

    let employeePhone: string | null = null;
    let patientId: string | undefined;
    let employeeId: string | undefined;

    if (patient) {
      patientId = patient.id;

      // Find active appointment with assigned employee
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          patientId: patient.id,
          status: { in: ["assigned", "accepted", "en_route"] },
          employeeId: { not: null },
        },
        include: {
          employee: { select: { id: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      if (appointment?.employee) {
        employeePhone = appointment.employee.phone;
        employeeId = appointment.employee.id;
      }
    }

    // Log call
    await this.prisma.callLog.create({
      data: {
        callSid: `incoming_${Date.now()}`,
        fromPhone,
        toPhone: employeePhone ?? this.officePhone,
        patientId,
        employeeId,
        status: "initiated",
      },
    });

    if (employeePhone) {
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Please wait while we connect you to your assigned collector.</Say>
  <Dial callerId="${this.companyPhone}">${employeePhone}</Dial>
</Response>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Welcome to LabConnect. Connecting you to our team.</Say>
  <Dial>${this.officePhone}</Dial>
</Response>`;
  }

  async handleStatusCallback(
    callSid: string,
    status: string,
    duration: string
  ): Promise<void> {
    await this.prisma.callLog.upsert({
      where: { callSid },
      update: { status, duration: duration ? parseInt(duration) : null },
      create: {
        callSid,
        fromPhone: "",
        toPhone: "",
        status,
        duration: duration ? parseInt(duration) : null,
      },
    });
  }

  async getLogs() {
    const logs = await this.prisma.callLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // Enrich with patient names
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const patient = log.patientId
          ? await this.prisma.user.findUnique({ where: { id: log.patientId } })
          : null;
        const employee = log.employeeId
          ? await this.prisma.user.findUnique({ where: { id: log.employeeId } })
          : null;
        return {
          ...log,
          patientName: patient?.name ?? null,
          employeeName: employee?.name ?? null,
        };
      })
    );

    return { data: enriched, message: "Call logs fetched" };
  }
}
