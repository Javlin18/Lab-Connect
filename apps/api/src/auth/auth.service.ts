import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcryptjs";
import { randomInt } from "crypto";

import { toSharedEmployee, toSharedUser } from "../common/mappers/entity.mappers";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterEmployeeDto } from "./dto/register-employee.dto";
import { RegisterDto } from "./dto/register.dto";
import { SendOtpDto } from "./dto/send-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { TwilioService } from "./twilio.service";

@Injectable()
export class AuthService {
  private readonly otpStore = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly twilioService: TwilioService
  ) {}

  async registerPatient(dto: RegisterDto) {
    await this.ensureUniqueContact(dto.email, dto.phone);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: "patient",
        passwordHash: dto.password
      }
    });

    return {
      data: toSharedUser(user),
      message: "Patient registered"
    };
  }

  async registerEmployee(dto: RegisterEmployeeDto) {
    await this.ensureUniqueContact(dto.email, dto.phone);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          role: "employee",
          passwordHash: dto.password
        }
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          zone: dto.zone?.trim() || "unassigned",
          isAvailable: true,
          currentLocation: ""
        }
      });

      return { employee, user };
    });

    return {
      data: {
        employee: toSharedEmployee(result.employee),
        user: toSharedUser(result.user)
      },
      message: "Employee registered"
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }]
      }
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await this.verifyPassword(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return {
      data: {
        accessToken,
        user: toSharedUser(user)
      },
      message: "Login successful"
    };
  }

  async sendOtp(dto: SendOtpDto) {
    const code = String(randomInt(100000, 1000000));
    this.otpStore.set(dto.phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    await this.twilioService.sendOtp(dto.phone, code);

    return {
      data: {
        phone: dto.phone
      },
      message: "OTP sent"
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const record = this.otpStore.get(dto.phone);

    if (!record) {
      throw new BadRequestException("OTP not found");
    }

    if (record.expiresAt < Date.now()) {
      this.otpStore.delete(dto.phone);
      throw new BadRequestException("OTP expired");
    }

    if (record.code !== dto.otp) {
      throw new BadRequestException("Invalid OTP");
    }

    this.otpStore.delete(dto.phone);

    return {
      data: {
        verified: true
      },
      message: "OTP verified"
    };
  }

  private async ensureUniqueContact(email: string, phone: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    });

    if (existing) {
      throw new ConflictException("Email or phone already exists");
    }
  }

  private isBcryptHash(value: string) {
    return /^\$2[aby]\$\d{2}\$/.test(value);
  }

  private async verifyPassword(input: string, stored: string) {
    if (this.isBcryptHash(stored)) {
      return compare(input, stored);
    }

    return input === stored;
  }
}
