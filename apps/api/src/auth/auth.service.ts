import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly twilioService: TwilioService,
    private readonly emailService: EmailService
  ) {}

  async registerPatient(dto: RegisterDto) {
    await this.ensureUniqueContact(dto.email, dto.phone);

    // Require email OTP verification before registration
    if (!(await this.isEmailVerified(dto.email))) {
      throw new BadRequestException("Email not verified. Please verify your email with OTP first.");
    }

    const hashedPassword = await hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: "patient",
        passwordHash: hashedPassword
      }
    });

    // Send welcome email (non-blocking)
    this.emailService.sendWelcome({ to: dto.email, name: dto.name }).catch((err) => {
      new Logger("AuthService").error(`Failed to send welcome email to ${dto.email}:`, err);
    });

    // Clear used OTP
    await this.prisma.emailOtp.deleteMany({ where: { email: dto.email } });

    return {
      data: toSharedUser(user),
      message: "Patient registered"
    };
  }

  async registerEmployee(dto: RegisterEmployeeDto) {
    await this.ensureUniqueContact(dto.email, dto.phone);

    const hashedPassword = await hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          role: "employee",
          passwordHash: hashedPassword
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
    const orConditions = [];
    if (dto.email) orConditions.push({ email: dto.email });
    if (dto.phone) orConditions.push({ phone: dto.phone });

    const user = await this.prisma.user.findFirst({
      where: {
        OR: orConditions
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
      const hashedRandomPass = await hash(randomPass, 12);
      user = await this.prisma.user.create({
        data: {
          name:         name ?? email.split("@")[0],
          email,
          phone:        `google_${Date.now()}`, // placeholder — can update later
          role:         "patient",
          passwordHash: hashedRandomPass,
        },
      });

      // Send welcome email
      this.emailService.sendWelcome({ to: email, name: user.name }).catch((err) => {
        new Logger("AuthService").error(`Failed to send welcome email to ${email}:`, err);
      });
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

  // ── Email OTP: Send ─────────────────────────────────────────────────────────────────
  async sendEmailOtp(email: string) {
    const otp = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert: replace any existing OTP for this email
    await this.prisma.emailOtp.upsert({
      where: { email },
      create: { email, code: otp, expiresAt, verified: false },
      update: { code: otp, expiresAt, verified: false },
    });

    // Await the email sending so it throws an error if SMTP fails
    try {
      await this.emailService.sendPasswordResetOTP({
        to:   email,
        name: "User",
        otp,
      });
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${email}:`, err);
      throw new BadRequestException("Failed to send OTP email. Please check SMTP configuration or email address.");
    }

    this.logger.debug(`\n=========================================\n[DEV] Generated OTP for ${email}: ${otp}\n=========================================\n`);
    
    const isDev = process.env.NODE_ENV !== "production";
    return { 
      data: { 
        email, 
        ...(isDev ? { devOtp: otp } : {}) 
      }, 
      message: "OTP sent to email" 
    };
  }

  // ── Email OTP: Verify ────────────────────────────────────────────────────────────────
  async verifyEmailOtp(email: string, otp: string) {
    const record = await this.prisma.emailOtp.findUnique({ where: { email } });

    if (!record) {
      throw new BadRequestException("OTP not found. Please request a new OTP.");
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.emailOtp.delete({ where: { email } });
      throw new BadRequestException("OTP expired. Please request a new one.");
    }

    if (record.code !== otp) {
      throw new BadRequestException("Invalid OTP. Please try again.");
    }

    // Mark as verified — allow registration
    await this.prisma.emailOtp.update({
      where: { email },
      data: { verified: true },
    });

    return { data: { email, verified: true }, message: "Email verified successfully" };
  }

  // ── Check if email OTP was verified ─────────────────────────────────────────────────
  private async isEmailVerified(email: string): Promise<boolean> {
    const record = await this.prisma.emailOtp.findUnique({ where: { email } });
    return !!(record?.verified && record.expiresAt > new Date());
  }

  async sendOtp(dto: SendOtpDto) {
    const code = String(randomInt(1000, 10000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Upsert: replace any existing OTP for this phone
    await this.prisma.phoneOtp.upsert({
      where: { phone: dto.phone },
      create: { phone: dto.phone, code, expiresAt },
      update: { code, expiresAt },
    });

    // Look up the patient's email from their phone number
    const user = await this.prisma.user.findFirst({
      where: { phone: dto.phone },
      select: { id: true, role: true, email: true, name: true },
    });

    if (user?.email) {
      try {
        await this.emailService.sendCollectionOtp({
          to: user.email,
          patientName: user.name ?? "Patient",
          otp: code,
        });
      } catch (e: any) {
        this.logger.warn(`Failed to send email OTP to ${user.email}: ${e.message}`);
      }
    } else {
      this.logger.warn(`No email found for phone ${dto.phone}. OTP: ${code}`);
    }

    try {
      await this.twilioService.sendOtp(dto.phone, code);
    } catch (e: any) {
      this.logger.warn(`Failed to send SMS to ${dto.phone}: ${e.message}`);
    }

    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) {
      this.logger.debug(`\n=========================================\n[DEV] Generated OTP for phone ${dto.phone}: ${code}\n=========================================\n`);
    }

    await (this.prisma as any).systemAuditLog.create({
      data: {
        action: "OTP_GENERATED",
        actorId: user?.id ?? null,
        actorRole: user?.role ?? null,
        patientId: user?.role === "patient" ? user.id : null,
        employeeId: user?.role === "employee" ? user.id : null,
        metadata: { channel: "email", purpose: "collection_or_login" }
      }
    });

    return {
      data: {
        phone: dto.phone,
        ...(isDev ? { devOtp: code } : {})
      },
      message: "OTP sent to patient's email"
    };
  }

  async getActiveOtp(phone: string) {
    const record = await this.prisma.phoneOtp.findUnique({ where: { phone } });
    if (!record) return null;
    if (record.expiresAt < new Date()) {
      await this.prisma.phoneOtp.delete({ where: { phone } });
      return null;
    }
    return {
      code: record.code,
      expiresAt: record.expiresAt.toISOString()
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const record = await this.prisma.phoneOtp.findUnique({ where: { phone: dto.phone } });

    if (!record) {
      throw new BadRequestException("OTP not found");
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.phoneOtp.delete({ where: { phone: dto.phone } });
      throw new BadRequestException("OTP expired");
    }

    if (record.code !== dto.otp) {
      throw new BadRequestException("Invalid OTP");
    }

    await this.prisma.phoneOtp.delete({ where: { phone: dto.phone } });

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
