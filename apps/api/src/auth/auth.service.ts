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
import { EmailService } from "../email/email.service";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterEmployeeDto } from "./dto/register-employee.dto";
import { RegisterDto } from "./dto/register.dto";
import { SendOtpDto } from "./dto/send-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { TwilioService } from "./twilio.service";

@Injectable()
export class AuthService {
  private readonly otpStore      = new Map<string, { code: string; expiresAt: number }>();
  private readonly emailOtpStore = new Map<string, { code: string; expiresAt: number; verified: boolean }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly twilioService: TwilioService,
    private readonly emailService: EmailService
  ) {}

  async registerPatient(dto: RegisterDto) {
    await this.ensureUniqueContact(dto.email, dto.phone);

    // Require email OTP verification before registration
    if (!this.isEmailVerified(dto.email)) {
      throw new BadRequestException("Email not verified. Please verify your email with OTP first.");
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: "patient",
        passwordHash: dto.password
      }
    });

    // Send welcome email (non-blocking)
    this.emailService.sendWelcome({ to: dto.email, name: dto.name }).catch(() => {});

    // Clear used OTP
    this.emailOtpStore.delete(dto.email);

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

  // ── Google OAuth Login / Auto-Register ──────────────────────────────────────
  async googleLogin(email: string, name?: string) {
    // Find existing user
    let user = await this.prisma.user.findFirst({ where: { email } });

    if (!user) {
      // Auto-register as patient
      const randomPass = Math.random().toString(36).slice(-12);
      user = await this.prisma.user.create({
        data: {
          name:         name ?? email.split("@")[0],
          email,
          phone:        `google_${Date.now()}`, // placeholder — can update later
          role:         "patient",
          passwordHash: randomPass,
        },
      });

      // Send welcome email
      this.emailService.sendWelcome({ to: email, name: user.name }).catch(() => {});
    }

    const accessToken = await this.jwtService.signAsync({
      sub:   user.id,
      email: user.email,
      role:  user.role,
    });

    return {
      data: { accessToken, user: toSharedUser(user) },
      message: "Google login successful",
      success: true,
    };
  }

  // ── Email OTP: Send ─────────────────────────────────────────────────────────
  async sendEmailOtp(email: string) {
    const otp = String(randomInt(100000, 999999));
    this.emailOtpStore.set(email, {
      code:      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      verified:  false,
    });

    await this.emailService.sendPasswordResetOTP({
      to:   email,
      name: "User",
      otp,
    });

    return { data: { email }, message: "OTP sent to email" };
  }

  // ── Email OTP: Verify ────────────────────────────────────────────────────────
  async verifyEmailOtp(email: string, otp: string) {
    const record = this.emailOtpStore.get(email);

    if (!record) {
      throw new BadRequestException("OTP not found. Please request a new OTP.");
    }

    if (record.expiresAt < Date.now()) {
      this.emailOtpStore.delete(email);
      throw new BadRequestException("OTP expired. Please request a new one.");
    }

    if (record.code !== otp) {
      throw new BadRequestException("Invalid OTP. Please try again.");
    }

    // Mark as verified — allow registration
    this.emailOtpStore.set(email, { ...record, verified: true });

    return { data: { email, verified: true }, message: "Email verified successfully" };
  }

  // ── Check if email OTP was verified ─────────────────────────────────────────
  private isEmailVerified(email: string): boolean {
    const record = this.emailOtpStore.get(email);
    return !!(record?.verified && record.expiresAt > Date.now());
  }

  async sendOtp(dto: SendOtpDto) {
    const code = String(randomInt(1000, 10000));
    this.otpStore.set(dto.phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    await this.twilioService.sendOtp(dto.phone, code);

    const user = await this.prisma.user.findFirst({ where: { phone: dto.phone }, select: { id: true, role: true } });
    await (this.prisma as any).systemAuditLog.create({
      data: {
        action: "OTP_GENERATED",
        actorId: user?.id ?? null,
        actorRole: user?.role ?? null,
        patientId: user?.role === "patient" ? user.id : null,
        employeeId: user?.role === "employee" ? user.id : null,
        metadata: { channel: "sms", purpose: "collection_or_login" }
      }
    });

    return {
      data: {
        phone: dto.phone
      },
      message: "OTP sent"
    };
  }

  getActiveOtp(phone: string) {
    const record = this.otpStore.get(phone);
    if (!record) return null;
    if (record.expiresAt < Date.now()) {
      this.otpStore.delete(phone);
      return null;
    }
    return {
      code: record.code,
      expiresAt: new Date(record.expiresAt).toISOString()
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

    const user = await this.prisma.user.findFirst({ where: { phone: dto.phone }, select: { id: true, role: true } });
    await (this.prisma as any).systemAuditLog.create({
      data: {
        action: "OTP_VERIFIED",
        actorId: user?.id ?? null,
        actorRole: user?.role ?? null,
        patientId: user?.role === "patient" ? user.id : null,
        employeeId: user?.role === "employee" ? user.id : null,
        metadata: { channel: "sms" }
      }
    });

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
