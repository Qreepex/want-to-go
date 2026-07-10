import { and, desc, eq, inArray } from "drizzle-orm";
import { Router, type RequestHandler } from "express";
import type { z } from "zod";
import { db } from "../db/client.js";
import { places, visits } from "../db/schema.js";
import { getAccessibleListIds, getListAccess } from "../lib/list-access.js";
import type { AuthenticatedRequest } from "../lib/request.js";
import { requireAuth } from "../middleware/require-auth.js";
import { validate } from "../middleware/validate.js";
import {
  createVisitBodySchema,
  updateVisitBodySchema,
  uuidParamSchema,
} from "../lib/validation-schemas.js";

const visitsRouter = Router();

visitsRouter.use(requireAuth);

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
    .where(
      and(
        eq(visits.userId, authRequest.authUser.userId),
        inArray(places.listId, listIds),
      ),
    )
    .orderBy(desc(visits.visitedAt));

  response.json({ visits: rows });
};

const createVisit: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const { placeId, visitedAt, notes } = request.body as z.infer<
    typeof createVisitBodySchema
  >;

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
      visitedAt,
      notes: notes ?? null,
    })
    .returning();

  response.status(201).json({ visit: createdVisit });
};

const updateVisit: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const visitId = request.params.id as string;
  const { visitedAt, notes } = request.body as z.infer<
    typeof updateVisitBodySchema
  >;

  const existingVisit = await db.query.visits.findFirst({
    where: eq(visits.id, visitId),
  });

  if (!existingVisit || existingVisit.userId !== authRequest.authUser.userId) {
    response.status(404).json({ error: "Visit not found" });
    return;
  }

  const [updatedVisit] = await db
    .update(visits)
    .set({
      visitedAt: visitedAt ?? existingVisit.visitedAt,
      notes: notes === undefined ? existingVisit.notes : notes,
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
visitsRouter.post("/", validate({ body: createVisitBodySchema }), createVisit);
visitsRouter.patch(
  "/:id",
  validate({ params: uuidParamSchema, body: updateVisitBodySchema }),
  updateVisit,
);
visitsRouter.delete("/:id", validate({ params: uuidParamSchema }), deleteVisit);

export default visitsRouter;
