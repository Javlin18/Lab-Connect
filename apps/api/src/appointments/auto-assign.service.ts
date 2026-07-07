import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AutoAssignService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Determines the shift for a given slot string.
   * Shift 1: 5:00 AM – 11:59 AM  (hour < 12)
   * Shift 2: 12:00 PM – 5:59 PM  (hour >= 12)
   * Slot format examples: "2025-07-04 09:00 AM", "2025-07-04 14:00", "2025-07-04T09:00:00"
   */
  private determineShift(slot: string): "shift_1" | "shift_2" {
    // Try to extract time from common slot formats
    // Format: "YYYY-MM-DD HH:MM AM/PM" or "YYYY-MM-DD HH:MM"
    const timeMatch = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const ampm = timeMatch[3]?.toUpperCase();
      if (ampm === "PM" && hour !== 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
      return hour < 12 ? "shift_1" : "shift_2";
    }

    // Try ISO format "...T14:00:00..."
    const isoMatch = slot.match(/T(\d{2}):/);
    if (isoMatch) {
      const hour = parseInt(isoMatch[1], 10);
      return hour < 12 ? "shift_1" : "shift_2";
    }

    // Default to shift_1 if we can't parse
    return "shift_1";
  }

  /**
   * Finds the most available employee for a given date+slot.
   * Prefers employees whose shift matches the appointment time.
   * Excludes employees who already have an active appointment at the exact same slot.
   * Among the remaining, picks the one with fewest appointments that day.
   * Returns the employee userId (User.id, not Employee.id) or null.
   */
  async findAvailableEmployee(
    slotDate: string,
    slot: string
  ): Promise<string | null> {
    const targetShift = this.determineShift(slot);

    // Get all employees marked as available
    const allEmployees = await this.prisma.employee.findMany({
      where: { isAvailable: true },
      include: { user: true },
    });

    if (allEmployees.length === 0) return null;

    // Find employees who already have an active appointment at the exact same slot
    const busyAtSlot = slot
      ? await this.prisma.appointment.findMany({
          where: {
            slot,
            status: { notIn: ["completed", "cancelled"] },
            employeeId: { not: null },
          },
          select: { employeeId: true },
        })
      : [];

    const busyEmployeeIds = new Set(
      busyAtSlot.map((a) => a.employeeId).filter(Boolean)
    );

    // Filter out employees who are busy at this exact slot
    const notBusy = allEmployees.filter(
      (emp) => !busyEmployeeIds.has(emp.userId)
    );

    // Prefer employees on the matching shift
    const shiftMatched = notBusy.filter((emp) => emp.shift === targetShift);

    // Fallback chain: shift-matched → any not-busy → all available
    const candidates =
      shiftMatched.length > 0
        ? shiftMatched
        : notBusy.length > 0
          ? notBusy
          : allEmployees;

    // Count today's appointments per employee
    const counts = await Promise.all(
      candidates.map(async (emp) => {
        const count = await this.prisma.appointment.count({
          where: {
            employeeId: emp.userId,
            slot: { startsWith: slotDate },
            status: { notIn: ["completed", "cancelled"] },
          },
        });
        return { userId: emp.userId, count };
      })
    );

    // Return employee with fewest appointments
    counts.sort((a, b) => a.count - b.count);
    return counts[0]?.userId ?? null;
  }
}
