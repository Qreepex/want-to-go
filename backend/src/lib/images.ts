import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { images, places } from "../db/schema.js";
import { deleteImageFromS3 } from "./s3.js";

/**
 * Deletes any of the given user's own images (bucket object + ownership row)
 * that aren't referenced by another one of their places anymore. Called after
 * a place is removed so its uploaded images don't linger in the bucket.
 *
 * `userId` must be the place's creator (its `userId` column), not whoever
 * triggered the deletion — a shared-list collaborator can delete a place they
 * don't own, but orphan-checking still has to run against the original
 * uploader's other places.
 */
export async function cleanUpOrphanedImages(
  userId: string,
  imageUrls: string[] | null,
): Promise<void> {
  if (!imageUrls?.length) {
    return;
  }

  const ownedImages = await db
    .select({ key: images.key })
    .from(images)
    .where(and(eq(images.userId, userId), inArray(images.key, imageUrls)));

  for (const { key } of ownedImages) {
    const stillReferenced = await db.query.places.findFirst({
      where: and(
        eq(places.userId, userId),
        sql`${places.imageUrls} @> ARRAY[${key}]::text[]`,
      ),
    });

    if (stillReferenced) {
      continue;
    }

    try {
      await deleteImageFromS3(key);
    } catch (error) {
      console.error(`Failed to delete S3 object for key ${key}:`, error);
      continue;
    }

    await db.delete(images).where(eq(images.key, key));
  }
}
