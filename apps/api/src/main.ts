import "reflect-metadata";

import { config } from "dotenv";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { join, resolve } from "node:path";

config({
  path: resolve(process.cwd(), "../../.env"),
  override: false
});

// Always load local .env with override so API-specific secrets win
config({ path: resolve(process.cwd(), ".env"), override: true });

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads/" });

  // Security headers
  app.use(helmet());

  // CORS — restrict to known origins
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:4000",
    process.env.WEB_URL,
    process.env.NEXTAUTH_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
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

  await app.listen(Number(process.env.PORT ?? 4000), "0.0.0.0");
}

bootstrap();
