import { Injectable, Logger } from "@nestjs/common";
import * as admin from "firebase-admin";

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);

  private get app(): admin.app.App | null {
    if (!process.env.FIREBASE_PROJECT_ID) {
      return null;
    }

    if (admin.apps.length > 0) {
      return admin.apps[0];
    }

    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!clientEmail || !privateKey) {
      this.logger.warn("Firebase Admin SDK not fully configured");
      return null;
    }

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail,
        privateKey
      })
    });
  }

  async send(deviceToken: string, title: string, body: string, data?: Record<string, string>) {
    const app = this.app;

    if (!app) {
      return false;
    }

    await app.messaging().send({
      token: deviceToken,
      notification: {
        title,
        body
      },
      data
    });

    return true;
  }
}
