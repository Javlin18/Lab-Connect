import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT ?? "587"),
        secure: false, // TLS
        auth: { user, pass },
      });
      this.logger.log(`Email service initialized → ${user}`);
    } else {
      this.logger.warn("SMTP credentials not set — emails will be logged only");
    }
  }

  private from(): string {
    return process.env.SMTP_FROM ?? `Lab Connect <${process.env.SMTP_USER ?? "labconnect.work@gmail.com"}>`;
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.error(`[EMAIL SKIPPED — no SMTP] To: ${to} | Subject: ${subject}`);
      // Skip throwing error so local development works without SMTP
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from(), to, subject, html });
      this.logger.log(`Email sent → ${to} | ${subject}`);
    } catch (err) {
      this.logger.error(`Email failed → ${to} | ${err}`);
      throw err;
    }
  }

  // ── Booking confirmation ────────────────────────────────────────────────────
  async sendBookingConfirmation(opts: {
    to: string;
    patientName: string;
    bookingId: string;
    tests: string[];
    slot: string;
    address: string;
  }) {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;border:1px solid #f0f0f0;border-radius:12px;overflow:hidden">
        <div style="background:#dc2626;padding:24px 28px">
          <h1 style="color:#fff;margin:0;font-size:22px">Lab Connect</h1>
          <p style="color:#fca5a5;margin:4px 0 0;font-size:13px">NABL Accredited Diagnostics</p>
        </div>
        <div style="padding:28px">
          <h2 style="color:#111;margin:0 0 8px">Booking Confirmed</h2>
          <p style="color:#555;font-size:14px">Hi <strong>${opts.patientName}</strong>, your home sample collection has been booked.</p>

          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0">
            <p style="margin:0 0 8px;font-size:12px;color:#ef4444;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Booking Details</p>
            <table style="width:100%;font-size:13px;color:#333">
              <tr><td style="padding:4px 0;color:#888">Booking ID</td><td style="padding:4px 0;font-weight:700">#${opts.bookingId.slice(0, 12)}</td></tr>
              <tr><td style="padding:4px 0;color:#888">Tests</td><td style="padding:4px 0">${opts.tests.join(", ")}</td></tr>
              <tr><td style="padding:4px 0;color:#888">Slot</td><td style="padding:4px 0">${opts.slot}</td></tr>
              <tr><td style="padding:4px 0;color:#888">Address</td><td style="padding:4px 0">${opts.address}</td></tr>
            </table>
          </div>

          <p style="font-size:13px;color:#555">A certified phlebotomist will visit your address at the selected time. Please keep your ID proof ready.</p>

          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f0f0f0;font-size:12px;color:#aaa">
            <p>Need help? Call <strong>1800-200-4567</strong> or email <strong>labconnect.work@gmail.com</strong></p>
          </div>
        </div>
      </div>
    `;
    await this.send(opts.to, "Booking Confirmed — Lab Connect", html);
  }

  // ── Collector assigned ──────────────────────────────────────────────────────
  async sendCollectorAssigned(opts: {
    to: string;
    patientName: string;
    bookingId: string;
    collectorName: string;
    collectorPhone: string;
    slot: string;
  }) {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;border:1px solid #f0f0f0;border-radius:12px;overflow:hidden">
        <div style="background:#dc2626;padding:24px 28px">
          <h1 style="color:#fff;margin:0;font-size:22px">Lab Connect</h1>
        </div>
        <div style="padding:28px">
          <h2 style="color:#111;margin:0 0 8px">Collector Assigned</h2>
          <p style="color:#555;font-size:14px">Hi <strong>${opts.patientName}</strong>, a phlebotomist has been assigned to your booking.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:20px 0">
            <p style="margin:0 0 8px;font-size:12px;color:#16a34a;font-weight:700;text-transform:uppercase">Collector Details</p>
            <table style="width:100%;font-size:13px;color:#333">
              <tr><td style="padding:4px 0;color:#888">Name</td><td><strong>${opts.collectorName}</strong></td></tr>
              <tr><td style="padding:4px 0;color:#888">Phone</td><td><a href="tel:${opts.collectorPhone}" style="color:#dc2626">${opts.collectorPhone}</a></td></tr>
              <tr><td style="padding:4px 0;color:#888">Booking</td><td>#${opts.bookingId.slice(0, 12)}</td></tr>
              <tr><td style="padding:4px 0;color:#888">Slot</td><td>${opts.slot}</td></tr>
            </table>
          </div>
        </div>
      </div>
    `;
    await this.send(opts.to, "Phlebotomist Assigned — Lab Connect", html);
  }

  // ── Sample collected ────────────────────────────────────────────────────────
  async sendSampleCollected(opts: {
    to: string;
    patientName: string;
    bookingId: string;
    tests: string[];
  }) {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;border:1px solid #f0f0f0;border-radius:12px;overflow:hidden">
        <div style="background:#dc2626;padding:24px 28px">
          <h1 style="color:#fff;margin:0;font-size:22px">Lab Connect</h1>
        </div>
        <div style="padding:28px">
          <h2 style="color:#111;margin:0 0 8px">Sample Collected</h2>
          <p style="color:#555;font-size:14px">Hi <strong>${opts.patientName}</strong>, your blood sample has been collected and is on its way to our lab.</p>
          <p style="font-size:13px;color:#555">Tests: <strong>${opts.tests.join(", ")}</strong></p>
          <p style="font-size:13px;color:#555">Your report will be ready in <strong>12–24 hours</strong>. We'll notify you when it's available.</p>
          <p style="font-size:12px;color:#aaa;margin-top:20px">Booking #${opts.bookingId.slice(0, 12)}</p>
        </div>
      </div>
    `;
    await this.send(opts.to, "Sample Collected — Lab Connect", html);
  }

  // ── Report ready ────────────────────────────────────────────────────────────
  async sendReportReady(opts: {
    to: string;
    patientName: string;
    bookingId: string;
    tests: string[];
    downloadUrl?: string;
  }) {
    const downloadBtn = opts.downloadUrl
      ? `<a href="${opts.downloadUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Download Report PDF</a>`
      : "";

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;border:1px solid #f0f0f0;border-radius:12px;overflow:hidden">
        <div style="background:#16a34a;padding:24px 28px">
          <h1 style="color:#fff;margin:0;font-size:22px">Lab Connect</h1>
        </div>
        <div style="padding:28px">
          <h2 style="color:#111;margin:0 0 8px">Your Report is Ready</h2>
          <p style="color:#555;font-size:14px">Hi <strong>${opts.patientName}</strong>, your diagnostic report is ready!</p>
          <p style="font-size:13px;color:#555">Tests completed: <strong>${opts.tests.join(", ")}</strong></p>
          ${downloadBtn}
          <p style="font-size:12px;color:#aaa;margin-top:20px">Booking #${opts.bookingId.slice(0, 12)}</p>
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f0f0f0;font-size:12px;color:#aaa">
            Need help? Call <strong>1800-200-4567</strong>
          </div>
        </div>
      </div>
    `;
    await this.send(opts.to, "Report Ready — Lab Connect", html);
  }

  // ── Password reset OTP ──────────────────────────────────────────────────────
  async sendPasswordResetOTP(opts: {
    to: string;
    name: string;
    otp: string;
  }) {
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;border:1px solid #f0f0f0;border-radius:12px;overflow:hidden">
        <div style="background:#dc2626;padding:24px 28px">
          <h1 style="color:#fff;margin:0;font-size:22px">Lab Connect</h1>
        </div>
        <div style="padding:28px;text-align:center">
          <h2 style="color:#111;margin:0 0 8px">Password Reset OTP</h2>
          <p style="color:#555;font-size:14px">Hi <strong>${opts.name}</strong>, use the OTP below to reset your password.</p>
          <div style="background:#fef2f2;border:2px dashed #fca5a5;border-radius:12px;padding:24px;margin:24px 0">
            <p style="font-size:40px;font-weight:900;letter-spacing:10px;color:#dc2626;margin:0">${opts.otp}</p>
            <p style="font-size:12px;color:#aaa;margin:8px 0 0">Valid for 10 minutes</p>
          </div>
          <p style="font-size:12px;color:#aaa">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `;
    await this.send(opts.to, "Password Reset OTP — Lab Connect", html);
  }

  // ── Welcome email ───────────────────────────────────────────────────────────
  async sendWelcome(opts: { to: string; name: string }) {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;border:1px solid #f0f0f0;border-radius:12px;overflow:hidden">
        <div style="background:#dc2626;padding:24px 28px">
          <h1 style="color:#fff;margin:0;font-size:22px">Welcome to Lab Connect</h1>
        </div>
        <div style="padding:28px">
          <p style="color:#555;font-size:14px">Hi <strong>${opts.name}</strong>, your account has been created successfully.</p>
          <p style="font-size:13px;color:#555">You can now book diagnostic tests and get home sample collection at your doorstep.</p>
          <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/tests" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Book a Test Now</a>
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f0f0f0;font-size:12px;color:#aaa">
            <p>NABL Accredited · Trusted by 5 Crore+ patients</p>
          </div>
        </div>
      </div>
    `;
    await this.send(opts.to, "Welcome to Lab Connect!", html);
  }

  // ── Collection OTP (sent to patient email) ──────────────────────────────────
  async sendCollectionOtp(opts: { to: string; patientName: string; otp: string }) {
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;border:1px solid #f0f0f0;border-radius:12px;overflow:hidden">
        <div style="background:#0F6E56;padding:24px 28px">
          <h1 style="color:#fff;margin:0;font-size:22px">Lab Connect</h1>
          <p style="color:#a7f3d0;margin:4px 0 0;font-size:13px">Sample Collection Verification</p>
        </div>
        <div style="padding:28px;text-align:center">
          <h2 style="color:#111;margin:0 0 8px">Your Collection OTP</h2>
          <p style="color:#555;font-size:14px">Hi <strong>${opts.patientName}</strong>, our phlebotomist is ready to collect your sample. Please share this OTP with them to verify your identity.</p>
          <div style="background:#f0fdf4;border:2px dashed #86efac;border-radius:12px;padding:24px;margin:24px 0">
            <p style="font-size:40px;font-weight:900;letter-spacing:10px;color:#0F6E56;margin:0">${opts.otp}</p>
            <p style="font-size:12px;color:#aaa;margin:8px 0 0">Valid for 5 minutes</p>
          </div>
          <p style="font-size:12px;color:#aaa">If you did not request a home collection, please ignore this email.</p>
        </div>
      </div>
    `;
    await this.send(opts.to, "Collection OTP — Lab Connect", html);
  }
}