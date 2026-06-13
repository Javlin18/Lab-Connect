import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── POST /feedback ──────────────────────────────────────────────────────────

  async submit(patientId: string, dto: CreateFeedbackDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: {
        employee: true,
        patient: { select: { id: true, name: true } },
      },
    });

    if (!appointment) throw new NotFoundException("Appointment not found");

    if (appointment.patientId !== patientId)
      throw new ForbiddenException("Not your appointment");

    const eligibleStatuses = ["collected", "processing", "completed"];
    if (!eligibleStatuses.includes(appointment.status))
      throw new BadRequestException(
        "Feedback only allowed after sample collection",
      );

    if (appointment.feedbackSubmitted)
      throw new ConflictException("Feedback already submitted");

    if (!appointment.employeeId)
      throw new BadRequestException("No employee assigned to this appointment");

    const employee = await this.prisma.employee.findUnique({
      where: { userId: appointment.employeeId },
    });

    if (!employee) throw new NotFoundException("Employee profile not found");

    const feedback = await this.prisma.employeeFeedback.create({
      data: {
        appointmentId: dto.appointmentId,
        employeeId: employee.id,
        patientId,
        overallRating: dto.overallRating,
        woreGloves: dto.woreGloves,
        woreMask: dto.woreMask,
        wasPunctual: dto.wasPunctual,
        wasProfessional: dto.wasProfessional,
        comment: dto.comment,
      },
    });

    await this.prisma.appointment.update({
      where: { id: dto.appointmentId },
      data: { feedbackSubmitted: true },
    });

    // Alert admins on low rating or hygiene failure
    const isAlert =
      dto.overallRating <= 2 || !dto.woreGloves || !dto.woreMask;
    if (isAlert) {
      const employeeName = appointment.employee?.name ?? "Employee";
      const patientName = appointment.patient?.name ?? "Patient";
      const glovesStr = dto.woreGloves ? "Yes" : "No";
      const maskStr = dto.woreMask ? "Yes" : "No";
      const commentStr = dto.comment ?? "No comment";

      const alertBody =
        `Low rating alert: ${employeeName} received ${dto.overallRating}★ from ${patientName}. ` +
        `Gloves: ${glovesStr}, Mask: ${maskStr}. Comment: ${commentStr}`;

      const admins = await this.prisma.user.findMany({
        where: { role: "admin" },
      });
      for (const admin of admins) {
        await this.notificationsService.createNotification(
          admin.id,
          "Low Rating Alert",
          alertBody,
          "feedback_alert",
        );
      }
    }

    return { data: feedback, message: "Feedback submitted" };
  }

  // ── GET /feedback/pending ────────────────────────────────────────────────────

  async getPending(patientId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        patientId,
        feedbackSubmitted: false,
        status: { in: ["collected", "processing", "completed"] },
      },
      include: {
        employee: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return {
      data: appointments.map((a) => ({
        appointmentId: a.id,
        slot: a.slot,
        status: a.status,
        employeeName: a.employee?.name ?? null,
      })),
      message: "Pending feedback fetched",
    };
  }

  // ── GET /feedback/employee/:employeeId ───────────────────────────────────────

  async getByEmployee(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!employee) throw new NotFoundException("Employee not found");

    const feedbacks = await this.prisma.employeeFeedback.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });

    const total = feedbacks.length;
    const avgRating =
      total > 0
        ? feedbacks.reduce((s, f) => s + f.overallRating, 0) / total
        : 0;

    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<
      number,
      number
    >;
    let hygieneOk = 0;
    let punctualOk = 0;
    let professionalOk = 0;

    for (const f of feedbacks) {
      ratingBreakdown[f.overallRating] = (ratingBreakdown[f.overallRating] ?? 0) + 1;
      if (f.woreGloves && f.woreMask) hygieneOk++;
      if (f.wasPunctual) punctualOk++;
      if (f.wasProfessional) professionalOk++;
    }

    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    // Get patient first names for last 20
    const recentIds = feedbacks.slice(0, 20).map((f) => f.patientId);
    const patients = await this.prisma.user.findMany({
      where: { id: { in: recentIds } },
      select: { id: true, name: true },
    });
    const patientMap = Object.fromEntries(patients.map((p) => [p.id, p.name]));

    const recentFeedback = feedbacks.slice(0, 20).map((f) => ({
      id: f.id,
      appointmentId: f.appointmentId,
      overallRating: f.overallRating,
      woreGloves: f.woreGloves,
      woreMask: f.woreMask,
      wasPunctual: f.wasPunctual,
      wasProfessional: f.wasProfessional,
      comment: f.comment,
      createdAt: f.createdAt,
      patientFirstName: (patientMap[f.patientId] ?? "").split(" ")[0],
    }));

    return {
      data: {
        employee: { id: employee.id, name: employee.user.name, email: employee.user.email },
        averageRating: parseFloat(avgRating.toFixed(2)),
        totalFeedbackCount: total,
        ratingBreakdown: {
          "5star": ratingBreakdown[5],
          "4star": ratingBreakdown[4],
          "3star": ratingBreakdown[3],
          "2star": ratingBreakdown[2],
          "1star": ratingBreakdown[1],
        },
        hygieneComplianceRate: pct(hygieneOk),
        punctualityRate: pct(punctualOk),
        professionalismRate: pct(professionalOk),
        recentFeedback,
      },
      message: "Employee feedback fetched",
    };
  }

  // ── GET /feedback/all ────────────────────────────────────────────────────────

  async getAll(query: {
    minRating?: number;
    maxRating?: number;
    employeeId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.minRating !== undefined || query.maxRating !== undefined) {
      where.overallRating = {};
      if (query.minRating !== undefined) where.overallRating.gte = +query.minRating;
      if (query.maxRating !== undefined) where.overallRating.lte = +query.maxRating;
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const [total, feedbacks] = await Promise.all([
      this.prisma.employeeFeedback.count({ where }),
      this.prisma.employeeFeedback.findMany({
        where,
        include: {
          employee: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // Resolve patient names
    const patientIds = [...new Set(feedbacks.map((f) => f.patientId))];
    const patients = await this.prisma.user.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, name: true },
    });
    const patientMap = Object.fromEntries(patients.map((p) => [p.id, p.name]));

    return {
      data: feedbacks.map((f) => ({
        ...f,
        patientFirstName: (patientMap[f.patientId] ?? "").split(" ")[0],
        employeeName: f.employee?.user?.name ?? null,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      message: "All feedback fetched",
    };
  }

  // ── GET /feedback/leaderboard ────────────────────────────────────────────────

  async getLeaderboard() {
    const employees = await this.prisma.employee.findMany({
      include: {
        user: { select: { id: true, name: true } },
        feedbacks: { select: { overallRating: true } },
      },
    });

    const ranked = employees
      .map((e) => {
        const total = e.feedbacks.length;
        const avg =
          total > 0
            ? e.feedbacks.reduce((s, f) => s + f.overallRating, 0) / total
            : 0;
        return {
          employeeId: e.id,
          name: e.user.name,
          averageRating: parseFloat(avg.toFixed(2)),
          totalFeedbackCount: total,
        };
      })
      .sort((a, b) => b.averageRating - a.averageRating);

    return { data: ranked, message: "Leaderboard fetched" };
  }

  // ── GET /feedback/alerts ─────────────────────────────────────────────────────

  async getAlerts() {
    const feedbacks = await this.prisma.employeeFeedback.findMany({
      where: {
        OR: [
          { overallRating: { lte: 2 } },
          { woreGloves: false },
          { woreMask: false },
        ],
      },
      include: {
        employee: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const patientIds = [...new Set(feedbacks.map((f) => f.patientId))];
    const patients = await this.prisma.user.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, name: true },
    });
    const patientMap = Object.fromEntries(patients.map((p) => [p.id, p.name]));

    return {
      data: feedbacks.map((f) => ({
        ...f,
        patientFirstName: (patientMap[f.patientId] ?? "").split(" ")[0],
        employeeName: f.employee?.user?.name ?? null,
      })),
      message: "Alert feedback fetched",
    };
  }
}
