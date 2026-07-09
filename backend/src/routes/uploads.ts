import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { Router, type ErrorRequestHandler, type RequestHandler } from "express";
import multer, { MulterError } from "multer";
import { db } from "../db/client.js";
import { images } from "../db/schema.js";
import { compressImage } from "../lib/image.js";
import { getPresignedImageUrl, uploadImageToS3 } from "../lib/s3.js";
import type { AuthenticatedRequest } from "../lib/request.js";
import { requireAuth } from "../middleware/require-auth.js";

const uploadsRouter = Router();

uploadsRouter.use(requireAuth);

const MAX_IMAGE_BYTES = 1 * 1024 * 1024;
const MAX_IMAGES_PER_USER = 50;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
});

const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};

const handleUploadErrors: ErrorRequestHandler = (error, _request, response, next) => {
  if (error instanceof MulterError && error.code === "LIMIT_FILE_SIZE") {
    response
      .status(413)
      .json({ error: "Image exceeds the 1MB upload limit" });
    return;
  }

  next(error);
};

const enforceUploadQuota: RequestHandler = async (request, response, next) => {
  const authRequest = request as AuthenticatedRequest;

  const [{ count: imageCount }] = await db
    .select({ count: count() })
    .from(images)
    .where(eq(images.userId, authRequest.authUser.userId));

  if (imageCount >= MAX_IMAGES_PER_USER) {
    response
      .status(403)
      .json({ error: `You can only store up to ${MAX_IMAGES_PER_USER} images` });
    return;
  }

  next();
};

const uploadImage: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const file = request.file;

  if (!file) {
    response.status(400).json({ error: "An image file is required" });
    return;
  }

  const extension = ALLOWED_MIME_EXTENSIONS[file.mimetype];

  if (!extension) {
    response.status(400).json({ error: "Unsupported image type" });
    return;
  }

  const key = `places/${authRequest.authUser.userId}/${randomUUID()}.${extension}`;

  try {
    const compressed = await compressImage(file.buffer, file.mimetype);
    const uploadBuffer =
      compressed.buffer.length < file.buffer.length ? compressed.buffer : file.buffer;

    await uploadImageToS3(key, uploadBuffer, compressed.contentType);
    await db.insert(images).values({ userId: authRequest.authUser.userId, key });
    const url = await getPresignedImageUrl(key);
    response.status(201).json({ url });
  } catch (error) {
    console.error("Failed to upload image to S3:", error);
    response.status(500).json({ error: "Unable to upload image" });
  }
};

uploadsRouter.post(
  "/image",
  enforceUploadQuota,
  upload.single("image"),
  handleUploadErrors,
  uploadImage,
);

export default uploadsRouter;
