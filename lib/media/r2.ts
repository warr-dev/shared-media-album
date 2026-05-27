import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getR2Env } from "@/lib/config/env";

export function createR2Client() {
  const env = getR2Env();

  return new S3Client({
    region: "auto",
    endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    }
  });
}

export async function createSignedPutUrl({
  objectKey,
  contentType,
  expiresIn = 900
}: {
  objectKey: string;
  contentType: string;
  expiresIn?: number;
}) {
  const env = getR2Env();
  const command = new PutObjectCommand({
    Bucket: env.CLOUDFLARE_R2_BUCKET,
    Key: objectKey,
    ContentType: contentType
  });

  return getSignedUrl(createR2Client(), command, { expiresIn });
}
