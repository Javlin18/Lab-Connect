import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";

@Injectable()
export class PaymentsService {
  constructor() {}

  private getPhonePeConfig() {
    const merchantId = process.env.PHONEPE_MERCHANT_ID || "MERCHANTUAT";
    const saltKey = process.env.PHONEPE_SALT_KEY || "key";
    const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
    const env = process.env.PHONEPE_ENV || "UAT";

    const host = env === "PRODUCTION"
      ? "https://api.phonepe.com/apis/hermes"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox";

    return { merchantId, saltKey, saltIndex, host };
  }

  private generateChecksum(base64Payload: string, endpoint: string, saltKey: string, saltIndex: string) {
    const stringToHash = base64Payload + endpoint + saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    return `${sha256}###${saltIndex}`;
  }

  // Step 1: Create PhonePe order (called when patient clicks Pay)
  async createOrder(amount: number, orderId: string, patientPhone: string) {
    const { merchantId, saltKey, saltIndex, host } = this.getPhonePeConfig();

    const payload = {
      merchantId,
      merchantTransactionId: orderId,
      merchantUserId: `MUID-${patientPhone}`,
      amount: Math.round(amount * 100), // in paise
      redirectUrl: `https://labconnect.co.in/checkout/verify`,
      redirectMode: "POST",
      callbackUrl: `https://api.labconnect.co.in/payments/webhook`,
      mobileNumber: patientPhone,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const endpoint = "/pg/v1/pay";
    const checksum = this.generateChecksum(base64Payload, endpoint, saltKey, saltIndex);

    const response = await fetch(`${host}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum
      },
      body: JSON.stringify({ request: base64Payload })
    });

    const data = await response.json();
    if (data.success) {
      return {
        phonepeOrderId: orderId,
        amount,
        redirectUrl: data.data.instrumentResponse.redirectInfo.url,
      };
    } else {
      throw new Error(`PhonePe Payment Initialization Failed: ${data.message}`);
    }
  }

  // Step 2: Verify payment status (called after patient redirected back)
  async verifyPayment(orderId: string) {
    const { merchantId, saltKey, saltIndex, host } = this.getPhonePeConfig();

    const endpoint = `/pg/v1/status/${merchantId}/${orderId}`;
    const stringToHash = endpoint + saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = `${sha256}###${saltIndex}`;

    const response = await fetch(`${host}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchantId
      }
    });

    const data = await response.json();
    if (data.success && data.data.state === "COMPLETED") {
      return {
        isValid: true,
        phonepePaymentId: data.data.transactionId,
        amount: data.data.amount / 100
      };
    }

    return { isValid: false };
  }

  // Step 3: Create payment link for QR code (pay after collection)
  async createPaymentLink(
    amount: number,
    orderId: string,
    patientName: string,
    patientPhone: string
  ) {
    return await this.createOrder(amount, orderId, patientPhone);
  }

  // Step 4: Check payment link status (poll for QR payment)
  async getPaymentLinkStatus(orderId: string) {
    const result = await this.verifyPayment(orderId);
    if (result.isValid) {
      return { status: "paid", amount: result.amount };
    }
    return { status: "pending", amount: 0 };
  }

  // Step 5: Refund a payment
  async refundPayment(paymentId: string, amount?: number) {
    // PhonePe Refund API requires standard POST flow with refund endpoint
    const { merchantId, saltKey, saltIndex, host } = this.getPhonePeConfig();
    const endpoint = "/pg/v1/refund";
    const reqPayload = {
      merchantId,
      merchantUserId: "MUID-REFUND",
      originalTransactionId: paymentId,
      merchantTransactionId: `REF-${paymentId}-${Date.now()}`,
      amount: amount ? Math.round(amount * 100) : undefined,
      callbackUrl: `https://api.labconnect.co.in/payments/webhook`
    };

    const base64Payload = Buffer.from(JSON.stringify(reqPayload)).toString("base64");
    const checksum = this.generateChecksum(base64Payload, endpoint, saltKey, saltIndex);

    const response = await fetch(`${host}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum
      },
      body: JSON.stringify({ request: base64Payload })
    });

    return await response.json();
  }

  // Step 6: Verify PhonePe webhook signature
  verifyWebhookSignature(base64Payload: string, signature: string) {
    const { saltKey } = this.getPhonePeConfig();
    const expectedSignature = crypto
      .createHmac("sha256", saltKey!)
      .update(base64Payload)
      .digest("hex");
    // Phonepe S2S verification actually requires checksum match similar to the payload one, or Hmac if configured that way.
    // Generally PhonePe S2S webhook sends an 'X-VERIFY' header which is hash(base64Req + saltKey) + '###' + saltIndex. Wait, no.
    // X-VERIFY for webhook = SHA256(responseBase64String + saltKey) + "###" + saltIndex.
    return false; // Replaced below
  }

  verifyWebhookPayload(base64Payload: string, headerXVerify: string) {
    const { saltKey } = this.getPhonePeConfig();
    // In webhooks, X-VERIFY format is usually something like: SHA256(base64Payload + saltKey) + "###" + saltIndex
    if (!headerXVerify) return false;
    const parts = headerXVerify.split("###");
    if (parts.length < 2) return false;

    const hashString = base64Payload + saltKey;
    const calculatedHash = crypto.createHash("sha256").update(hashString).digest("hex");
    
    return calculatedHash === parts[0];
  }
}
