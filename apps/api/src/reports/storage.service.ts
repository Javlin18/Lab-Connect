import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class StorageService {
  private readonly bucket = process.env.S3_BUCKET;
  private client: S3Client | null = null;

  async uploadPdf(key: string, body: Buffer, contentType: string) {
    const client = this.getClient();

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType
      })
    );

    return key;
  }

  async getDownloadUrl(key: string) {
    const client = this.getClient();

    return getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      }),
      {
        expiresIn: 60 * 10
      }
    );
  }

  private getClient() {
    if (!this.bucket) {
      throw new InternalServerErrorException("S3 bucket not configured");
    }

    if (!process.env.S3_REGION) {
      throw new InternalServerErrorException("S3 region not configured");
    }

    if (!this.client) {
      this.client = new S3Client({
        region: process.env.S3_REGION,
        credentials:
          process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY
            ? {
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET_KEY
              }
            : undefined,
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true"
      });
    }

    return this.client;
  }
}
