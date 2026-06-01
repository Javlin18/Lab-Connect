import { Injectable, Logger } from "@nestjs/common";
import Twilio from "twilio";

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private readonly client =
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
      ? Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      : null;

  async sendOtp(phone: string, code: string) {
    if (!this.client || !process.env.TWILIO_PHONE) {
      this.logger.warn(`Twilio not configured. OTP for ${phone}: ${code}`);
      return;
    }

    await this.client.messages.create({
      body: `Labconnect OTP: ${code}`,
      from: process.env.TWILIO_PHONE,
      to: phone
    });
  }
}
