import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { placeTags } from "../db/schema.js";

export function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }

    const tag = entry.trim().toLowerCase();

    if (tag) {
      seen.add(tag);
    }
  }

  return [...seen];
}

export async function getPlaceTags(placeId: string): Promise<string[]> {
  const rows = await db
    .select({ tag: placeTags.tag })
    .from(placeTags)
    .where(eq(placeTags.placeId, placeId));

  return rows.map((row) => row.tag);
}

export async function getTagsForPlaces(
  placeIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();

  if (!placeIds.length) {
    return map;
  }

  const rows = await db
    .select({ placeId: placeTags.placeId, tag: placeTags.tag })
    .from(placeTags)
    .where(inArray(placeTags.placeId, placeIds));

  for (const row of rows) {
    const existing = map.get(row.placeId);

    if (existing) {
      existing.push(row.tag);
    } else {
      map.set(row.placeId, [row.tag]);
    }
  }

  return map;
}

export async function setPlaceTags(
  placeId: string,
  tags: string[],
): Promise<void> {
  await db.delete(placeTags).where(eq(placeTags.placeId, placeId));

  if (tags.length) {
    await db.insert(placeTags).values(tags.map((tag) => ({ placeId, tag })));
  }
}
