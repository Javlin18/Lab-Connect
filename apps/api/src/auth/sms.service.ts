import { Injectable, Logger } from "@nestjs/common";

/**
 * Fast2SMS SMS Service
 * Replaces Twilio for OTP delivery.
 * Docs: https://docs.fast2sms.com
 *
 * Required env vars:
 *   FAST2SMS_API_KEY   — Your Fast2SMS API key (from https://www.fast2sms.com/dashboard)
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey = process.env.FAST2SMS_API_KEY ?? "";

  async sendOtp(phone: string, code: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn(`Fast2SMS not configured (FAST2SMS_API_KEY missing). OTP for ${phone}: ${code}`);
      return;
    }

    // Strip country code if present (+91 or 91)
    const cleanPhone = phone.replace(/^\+?91/, "").replace(/\D/g, "");

    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",          // OTP route (DLT not required for OTP route)
          variables_values: code, // OTP value — Fast2SMS injects into default OTP template
          numbers: cleanPhone,
          flash: "0",
        }),
      });

      const result = await response.json();

      if (!result.return) {
        this.logger.warn(`Fast2SMS failed for ${phone}: ${JSON.stringify(result.message ?? result)}`);
      } else {
        this.logger.log(`OTP SMS sent to ${cleanPhone} via Fast2SMS (request_id: ${result.request_id})`);
      }
    } catch (err: any) {
      this.logger.warn(`Fast2SMS exception for ${phone}: ${err.message}`);
    }
  }
}
