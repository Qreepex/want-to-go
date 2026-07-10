import { and, desc, eq, inArray } from "drizzle-orm";
import { Router, type RequestHandler } from "express";
import { db } from "../db/client.js";
import { places, visits } from "../db/schema.js";
import { getAccessibleListIds, getListAccess } from "../lib/list-access.js";
import type { AuthenticatedRequest } from "../lib/request.js";
import { requireAuth } from "../middleware/require-auth.js";

const visitsRouter = Router();

visitsRouter.use(requireAuth);

function normalizeVisitedAt(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return value.trim();
}

function normalizeNotes(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return value.trim();
}

const listVisits: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const listIds = await getAccessibleListIds(authRequest.authUser.userId);

  if (!listIds.length) {
    response.json({ visits: [] });
    return;
  }

  const rows = await db
    .select({
      id: visits.id,
      placeId: visits.placeId,
      userId: visits.userId,
      visitedAt: visits.visitedAt,
      notes: visits.notes,
      createdAt: visits.createdAt,
      place: {
        id: places.id,
        name: places.name,
        countryCode: places.countryCode,
        latitude: places.latitude,
        longitude: places.longitude,
        imageUrls: places.imageUrls,
      },
    })
    .from(visits)
    .innerJoin(places, eq(visits.placeId, places.id))
    .where(and(eq(visits.userId, authRequest.authUser.userId), inArray(places.listId, listIds)))
    .orderBy(desc(visits.visitedAt));

  response.json({ visits: rows });
};

const createVisit: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const { placeId, visitedAt, notes } = request.body as {
    placeId?: unknown;
    visitedAt?: unknown;
    notes?: unknown;
  };

  const normalizedVisitedAt = normalizeVisitedAt(visitedAt);

  if (typeof placeId !== "string" || !placeId || !normalizedVisitedAt) {
    response.status(400).json({ error: "placeId and visitedAt are required" });
    return;
  }

  const place = await db.query.places.findFirst({
    where: eq(places.id, placeId),
  });

  if (!place || !place.listId) {
    response.status(404).json({ error: "Place not found" });
    return;
  }

  const access = await getListAccess(authRequest.authUser.userId, place.listId);

  if (!access) {
    response.status(404).json({ error: "Place not found" });
    return;
  }

  const [createdVisit] = await db
    .insert(visits)
    .values({
      placeId,
      userId: authRequest.authUser.userId,
      visitedAt: normalizedVisitedAt,
      notes: normalizeNotes(notes) ?? null,
    })
    .returning();

  response.status(201).json({ visit: createdVisit });
};

const updateVisit: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const visitId = request.params.id as string;
  const { visitedAt, notes } = request.body as { visitedAt?: unknown; notes?: unknown };

  const existingVisit = await db.query.visits.findFirst({
    where: eq(visits.id, visitId),
  });

  if (!existingVisit || existingVisit.userId !== authRequest.authUser.userId) {
    response.status(404).json({ error: "Visit not found" });
    return;
  }

  const nextVisitedAt =
    visitedAt === undefined ? existingVisit.visitedAt : normalizeVisitedAt(visitedAt);

  if (!nextVisitedAt) {
    response.status(400).json({ error: "visitedAt is invalid" });
    return;
  }

  const nextNotes = normalizeNotes(notes);

  const [updatedVisit] = await db
    .update(visits)
    .set({
      visitedAt: nextVisitedAt,
      notes: nextNotes === undefined ? existingVisit.notes : nextNotes,
    })
    .where(eq(visits.id, existingVisit.id))
    .returning();

  response.json({ visit: updatedVisit });
};

const deleteVisit: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const visitId = request.params.id as string;

  const existingVisit = await db.query.visits.findFirst({
    where: eq(visits.id, visitId),
  });

  if (!existingVisit || existingVisit.userId !== authRequest.authUser.userId) {
    response.status(404).json({ error: "Visit not found" });
    return;
  }

  await db.delete(visits).where(eq(visits.id, existingVisit.id));

  response.status(204).send();
};

visitsRouter.get("/", listVisits);
visitsRouter.post("/", createVisit);
visitsRouter.patch("/:id", updateVisit);
visitsRouter.delete("/:id", deleteVisit);

export default visitsRouter;
