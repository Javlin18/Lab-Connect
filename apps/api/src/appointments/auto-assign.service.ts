import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AutoAssignService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds the most available employee for a given date+slot.
   * Returns the employee userId (User.id, not Employee.id) or null.
   */
  async findAvailableEmployee(
    slotDate: string,
    _slot: string
  ): Promise<string | null> {
    // Get all employees
    const allEmployees = await this.prisma.employee.findMany({
      where: { isAvailable: true },
      include: { user: true },
    });

    if (allEmployees.length === 0) return null;

    // Count today's appointments per employee
    const counts = await Promise.all(
      allEmployees.map(async (emp) => {
        const count = await this.prisma.appointment.count({
          where: {
            employeeId: emp.userId,
            slot: { startsWith: slotDate },
            status: { not: "pending" },
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
