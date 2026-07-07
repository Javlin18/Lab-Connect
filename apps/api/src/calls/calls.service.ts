import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
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

  // ─── Exotel Config ─────────────────────────────────────────
  private get exotelAccountSid() {
    return process.env.EXOTEL_ACCOUNT_SID ?? "";
  }
  private get exotelApiKey() {
    return process.env.EXOTEL_API_KEY ?? "";
  }
  private get exotelApiToken() {
    return process.env.EXOTEL_API_TOKEN ?? "";
  }
  private get exotelCallerId() {
    return process.env.EXOTEL_CALLER_ID ?? "";
  }
  private get exotelSubdomain() {
    return process.env.EXOTEL_SUBDOMAIN ?? "api.exotel.com";
  }

  // ─── Exotel Connect Call ───────────────────────────────────
  /**
   * Initiates a masked call via Exotel.
   * 1. Exotel calls the employee first.
   * 2. Once the employee picks up, Exotel bridges to the patient.
   * Neither party sees the other's real number — only the ExoPhone shows.
   */
  async connectCall(appointmentId: string, employeeUserId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        employee: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!appointment) throw new NotFoundException("Appointment not found");
    if (!appointment.patient?.phone) throw new BadRequestException("Patient phone not available");

    // Get employee phone — first try appointment.employee, then look up by userId
    let employeePhone: string | undefined = appointment.employee?.phone;
    if (!employeePhone) {
      const employee = await this.prisma.user.findUnique({
        where: { id: employeeUserId },
        select: { phone: true },
      });
      employeePhone = employee?.phone ?? undefined;
    }

    if (!employeePhone) throw new BadRequestException("Employee phone not available");

    const accountSid = this.exotelAccountSid;
    const apiKey = this.exotelApiKey;
    const apiToken = this.exotelApiToken;
    const callerId = this.exotelCallerId;
    const subdomain = this.exotelSubdomain;

    if (!accountSid || !apiKey || !apiToken || !callerId) {
      throw new BadRequestException("Exotel is not configured. Please set EXOTEL_* env vars.");
    }

    // Exotel Connect API: POST /v1/Accounts/{sid}/Calls/connect.json
    const url = `https://${subdomain}/v1/Accounts/${accountSid}/Calls/connect.json`;
    const auth = Buffer.from(`${apiKey}:${apiToken}`).toString("base64");

    const formBody = new URLSearchParams({
      From: employeePhone,
      To: appointment.patient.phone,
      CallerId: callerId,
      CallType: "trans",
      StatusCallback: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/calls/exotel-status`,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Exotel connect error:", result);
      throw new BadRequestException(
        result?.RestException?.Message ?? "Failed to initiate call via Exotel"
      );
    }

    // Log the call
    const callSid = result?.Call?.Sid ?? `exotel_${Date.now()}`;
    await this.prisma.callLog.create({
      data: {
        callSid,
        fromPhone: employeePhone,
        toPhone: appointment.patient.phone,
        patientId: appointment.patient.id,
        employeeId: appointment.employee?.id ?? employeeUserId,
        status: "initiated",
      },
    });

    return {
      success: true,
      callSid,
      message: "Call initiated. You will receive a call shortly.",
    };
  }

  // ─── Exotel Connect Patient Call ───────────────────────────
  async connectPatientCall(appointmentId: string, patientUserId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        employee: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!appointment) throw new NotFoundException("Appointment not found");
    if (appointment.patientId !== patientUserId) throw new BadRequestException("Unauthorized");
    if (!appointment.patient?.phone) throw new BadRequestException("Patient phone not available");

    const employeePhone = appointment.employee?.phone;
    if (!employeePhone) throw new BadRequestException("Employee phone not available yet. Try again later.");

    const accountSid = this.exotelAccountSid;
    const apiKey = this.exotelApiKey;
    const apiToken = this.exotelApiToken;
    const callerId = this.exotelCallerId;
    const subdomain = this.exotelSubdomain;

    if (!accountSid || !apiKey || !apiToken || !callerId) {
      throw new BadRequestException("Exotel is not configured.");
    }

    const url = `https://${subdomain}/v1/Accounts/${accountSid}/Calls/connect.json`;
    const auth = Buffer.from(`${apiKey}:${apiToken}`).toString("base64");

    // Call Patient first (From), then bridge to Employee (To)
    const formBody = new URLSearchParams({
      From: appointment.patient.phone,
      To: employeePhone,
      CallerId: callerId,
      CallType: "trans",
      StatusCallback: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/calls/exotel-status`,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Exotel connect error:", result);
      throw new BadRequestException(
        result?.RestException?.Message ?? "Failed to initiate call via Exotel"
      );
    }

    const callSid = result?.Call?.Sid ?? `exotel_${Date.now()}`;
    await this.prisma.callLog.create({
      data: {
        callSid,
        fromPhone: appointment.patient.phone,
        toPhone: employeePhone,
        patientId: appointment.patient.id,
        employeeId: appointment.employee?.id ?? "",
        status: "initiated",
      },
    });

    return {
      success: true,
      callSid,
      message: "Call initiated. You will receive a call shortly.",
    };
  }

  // ─── Exotel Status Callback ────────────────────────────────
  async handleExotelStatusCallback(body: Record<string, any>) {
    const callSid = body.CallSid ?? body.Sid ?? "";
    const status = body.Status ?? body.CallStatus ?? "unknown";
    const duration = body.Duration ?? body.RecordingDuration ?? "0";

    if (callSid) {
      await this.prisma.callLog.upsert({
        where: { callSid },
        update: { status, duration: duration ? parseInt(duration) : null },
        create: {
          callSid,
          fromPhone: body.From ?? "",
          toPhone: body.To ?? "",
          status,
          duration: duration ? parseInt(duration) : null,
        },
      });
    }
  }

  // ─── Twilio Incoming (existing) ────────────────────────────
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
