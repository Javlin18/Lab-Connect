import "reflect-metadata";

import { config } from "dotenv";
import { ValidationPipe, Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

config({
  path: resolve(process.cwd(), "../../.env"),
  override: false
});

// Always load local .env with override so API-specific secrets win
config({ path: resolve(process.cwd(), ".env"), override: true });

import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  // Validate critical env vars
  if (!process.env.DATABASE_URL) {
    logger.error("DATABASE_URL is not set! The app cannot start without a database.");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    logger.error("JWT_SECRET is not set! The app cannot start without a JWT secret.");
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Ensure uploads dir exists (Render's filesystem is ephemeral)
  const uploadsDir = join(process.cwd(), "uploads");
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, { prefix: "/uploads/" });

  // Security headers
  app.use(helmet());

  // CORS — allow known origins + deployed URLs
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:4000",
    "https://labconnect-web.onrender.com",
    "https://labconnect-web-onrender.com",
    process.env.WEB_URL,
    process.env.NEXTAUTH_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return callback(null, true);
      }
      // In production, still allow but log a warning
      logger.warn(`CORS: Allowing unlisted origin ${origin}`);
      return callback(null, true);
    },
    credentials: true,
  });

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Labconnect API")
    .setDescription("Labconnect backend API")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, swaggerDocument);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  logger.log(`Server running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error("Fatal: Failed to start the application", err);
  process.exit(1);
});
