import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import "../env.js";

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) {
    return client;
  }

  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are required",
    );
  }

  const endpoint = process.env.S3_ENDPOINT;

  client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  });

  return client;
}

function getBucketName(): string {
  const bucket = process.env.S3_BUCKET_NAME;

  if (!bucket) {
    throw new Error("S3_BUCKET_NAME environment variable is not set");
  }

  return bucket;
}

export async function uploadImageToS3(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteImageFromS3(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: getBucketName(), Key: key }),
  );
}

const PRESIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getPresignedImageUrl(key: string): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: getBucketName(), Key: key }),
    { expiresIn: PRESIGNED_URL_TTL_SECONDS },
  );
}

/** Images stored outside our bucket (e.g. a pasted Instagram link) pass through unchanged. */
export async function resolveImageDisplayUrl(value: string): Promise<string> {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return getPresignedImageUrl(value);
}

/**
 * Recovers our own storage key from a value the client sent back, which may be
 * either the bare key or a presigned URL we previously handed out for it (e.g. an
 * unmodified edit round-trip). Returns null when the value is a genuine external URL.
 */
export function extractOwnImageKey(value: string): string | null {
  if (!/^https?:\/\//i.test(value)) {
    return value;
  }

  try {
    const parsed = new URL(value);
    const bucket = process.env.S3_BUCKET_NAME;
    const endpoint = process.env.S3_ENDPOINT;

    if (bucket && endpoint) {
      const prefix = `/${bucket}/`;
      if (
        parsed.host === new URL(endpoint).host &&
        parsed.pathname.startsWith(prefix)
      ) {
        return decodeURIComponent(parsed.pathname.slice(prefix.length));
      }
    }

    if (bucket && process.env.AWS_REGION) {
      const virtualHost = `${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`;
      if (parsed.host === virtualHost) {
        return decodeURIComponent(parsed.pathname.slice(1));
      }
    }
  } catch {
    return null;
  }

  return null;
}
