import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { toSharedEmployee, toSharedUser } from "../common/mappers/entity.mappers";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateLocationDto } from "./dto/update-location.dto";

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const employees = await this.prisma.employee.findMany({
      include: {
        user: true
      },
      orderBy: {
        user: {
          createdAt: "desc"
        }
      }
    });

    return {
      data: employees.map((employee) => ({
        employee: toSharedEmployee(employee),
        user: toSharedUser(employee.user)
      })),
      message: "Employees fetched"
    };
  }

  async findMine(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        userId
      },
      include: {
        user: true
      }
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    return {
      data: {
        employee: toSharedEmployee(employee),
        user: toSharedUser(employee.user)
      },
      message: "Employee fetched"
    };
  }

  async updateMyLocation(userId: string, dto: UpdateLocationDto) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        userId
      }
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    return this.updateLocation(employee.id, userId, dto);
  }

  async updateLocation(id: string, userId: string, dto: UpdateLocationDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id }
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    if (employee.userId !== userId) {
      throw new ForbiddenException("Forbidden");
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        currentLocation: `${dto.latitude},${dto.longitude}`,
        isAvailable: dto.isAvailable
      }
    });

    return {
      data: toSharedEmployee(updated),
      message: "Location updated"
    };
  }
}
