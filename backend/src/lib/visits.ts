import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { visits, type Visit } from "../db/schema.js";

export async function getPlaceVisits(
  placeId: string,
  userId: string,
): Promise<Visit[]> {
  return db
    .select()
    .from(visits)
    .where(and(eq(visits.placeId, placeId), eq(visits.userId, userId)))
    .orderBy(desc(visits.visitedAt));
}

export async function getVisitsForPlaces(
  placeIds: string[],
  userId: string,
): Promise<Map<string, Visit[]>> {
  const map = new Map<string, Visit[]>();

  if (!placeIds.length) {
    return map;
  }

  const rows = await db
    .select()
    .from(visits)
    .where(and(inArray(visits.placeId, placeIds), eq(visits.userId, userId)))
    .orderBy(desc(visits.visitedAt));

  for (const row of rows) {
    const existing = map.get(row.placeId);

    if (existing) {
      existing.push(row);
    } else {
      map.set(row.placeId, [row]);
    }
  }

  return map;
}
