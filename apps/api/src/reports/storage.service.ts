import { Injectable, Logger } from "@nestjs/common";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = process.env.S3_BUCKET;
  private readonly uploadsDir = join(process.cwd(), "uploads");

  constructor() {
    if (!existsSync(this.uploadsDir)) {
      mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async uploadPdf(key: string, body: Buffer, contentType: string) {
    if (this.bucket && process.env.S3_REGION) {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const client = new S3Client({
        region: process.env.S3_REGION,
        credentials:
          process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY
            ? {
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET_KEY,
              }
            : undefined,
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      });
      await client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
      return key;
    }

    // Local fallback
    const filePath = join(this.uploadsDir, key.replace(/\//g, "_"));
    writeFileSync(filePath, body);
    this.logger.warn(`S3 not configured. Saved locally: ${filePath}`);
    return key;
  }

  async getDownloadUrl(key: string) {
    if (this.bucket && process.env.S3_REGION) {
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
      const client = new S3Client({
        region: process.env.S3_REGION,
        credentials:
          process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY
            ? {
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET_KEY,
              }
            : undefined,
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      });
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: 60 * 10 }
      );
    }

    // Local fallback — return a local file path
    return `/uploads/${key.replace(/\//g, "_")}`;
  }
}
