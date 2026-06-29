import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { EmailModule } from "../email/email.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { TwilioService } from "./twilio.service";

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    EmailModule,
    JwtModule.register({
      secret: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret === "change_me" || secret === "dev-secret") {
          throw new Error("JWT_SECRET must be set to a strong random value in the environment.");
        }
        return secret;
      })(),
      signOptions: {
        expiresIn: "7d"
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TwilioService],
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
