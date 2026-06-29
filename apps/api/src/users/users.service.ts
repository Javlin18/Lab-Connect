import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { hash } from "bcryptjs";

import { toSharedEmployee, toSharedUser } from "../common/mappers/entity.mappers";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { ListUsersDto } from "./dto/list-users.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: ListUsersDto) {
    const users = await this.prisma.user.findMany({
      where: query.role ? { role: query.role } : undefined,
      include: {
        employeeProfile: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return {
      data: users.map((user) => ({
        ...toSharedUser(user),
        employee: user.employeeProfile ? toSharedEmployee(user.employeeProfile) : null
      })),
      message: "Users fetched"
    };
  }

  async createEmployee(dto: CreateEmployeeDto) {
    await this.assertContactAvailable(dto.email, dto.phone);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          role: "employee",
          passwordHash: await hash(dto.password, 12)
        }
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          zone: dto.zone,
          isAvailable: dto.isAvailable ?? true,
          currentLocation: ""
        }
      });

      return { user, employee };
    });

    return {
      data: {
        user: toSharedUser(result.user),
        employee: toSharedEmployee(result.employee)
      },
      message: "Employee created"
    };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: {
        employeeProfile: true
      }
    });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: dto.role,
        ...(dto.password ? { passwordHash: await hash(dto.password, 12) } : {})
      },
      include: {
        employeeProfile: true
      }
    });

    let employee = user.employeeProfile;
    const hasEmployeeFields =
      dto.zone !== undefined ||
      dto.isAvailable !== undefined ||
      dto.currentLocation !== undefined ||
      user.role === "employee";

    if (hasEmployeeFields) {
      employee = await this.prisma.employee.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          zone: dto.zone ?? existing.employeeProfile?.zone ?? "unassigned",
          isAvailable: dto.isAvailable ?? true,
          currentLocation: dto.currentLocation ?? existing.employeeProfile?.currentLocation ?? ""
        },
        update: {
          zone: dto.zone,
          isAvailable: dto.isAvailable,
          currentLocation: dto.currentLocation
        }
      });
    }

    return {
      data: {
        ...toSharedUser(user),
        employee: employee ? toSharedEmployee(employee) : null
      },
      message: "User updated"
    };
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.prisma.user.delete({
      where: { id }
    });

    return {
      data: null,
      message: "User deleted"
    };
  }

  private async assertContactAvailable(email: string, phone: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    });

    if (existing) {
      throw new ConflictException("Email or phone already exists");
    }
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async findByRole(role: "admin" | "employee" | "patient") {
    return this.prisma.user.findMany({ where: { role } });
  }
}
