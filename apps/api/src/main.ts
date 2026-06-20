import "reflect-metadata";

import { config } from "dotenv";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { join, resolve } from "node:path";

config({
  path: resolve(process.cwd(), "../../.env"),
  override: false
});

// Also try local .env if root one not found
if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), ".env"), override: false });
}

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads/" });
  app.enableCors();
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
