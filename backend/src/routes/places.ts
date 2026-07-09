import { and, eq, inArray, desc } from "drizzle-orm";
import { Router, type RequestHandler } from "express";
import { db } from "../db/client.js";
import { images, places, type Place } from "../db/schema.js";
import {
  canCreateInList,
  canModifyPlacesInList,
  getAccessibleListIds,
  getListAccess,
} from "../lib/list-access.js";
import { cleanUpOrphanedImages } from "../lib/images.js";
import type { AuthenticatedRequest } from "../lib/request.js";
import { requireAuth } from "../middleware/require-auth.js";
import { extractOwnImageKey, resolveImageDisplayUrl } from "../lib/s3.js";

const placesRouter = Router();

placesRouter.use(requireAuth);

function normalizeUrlArray(value: unknown): string[] | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const rawValues = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];
  return rawValues
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

/**
 * Image entries may be a genuine external URL (pasted from elsewhere) or a
 * reference to our own private bucket. For the latter we only ever persist the
 * bare object key, and only once we've confirmed the requesting user owns it -
 * otherwise a user could type another user's key and later have it presigned.
 * A value can also be a presigned URL we previously handed out for one of the
 * user's own images (an unmodified edit round-trip), which we unwrap back to
 * its key here.
 */
async function normalizeImageUrls(
  value: unknown,
  userId: string,
): Promise<string[] | null | undefined> {
  const cleaned = normalizeUrlArray(value);

  if (cleaned === undefined || cleaned === null) {
    return cleaned;
  }

  const results: string[] = [];

  for (const entry of cleaned) {
    const ownKey = extractOwnImageKey(entry);

    if (ownKey === null) {
      results.push(entry);
      continue;
    }

    const owned = await db.query.images.findFirst({
      where: and(eq(images.key, ownKey), eq(images.userId, userId)),
    });

    if (owned) {
      results.push(ownKey);
    }
  }

  return results.length ? results : null;
}

async function resolvePlaceImages(place: Place): Promise<Place> {
  if (!place.imageUrls?.length) {
    return place;
  }

  const resolvedImageUrls = await Promise.all(
    place.imageUrls.map((entry) => resolveImageDisplayUrl(entry)),
  );

  return { ...place, imageUrls: resolvedImageUrls };
}

const listPlaces: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const listIds = await getAccessibleListIds(authRequest.authUser.userId);

  if (!listIds.length) {
    response.json({ places: [] });
    return;
  }

  const savedPlaces = await db
    .select()
    .from(places)
    .where(inArray(places.listId, listIds))
    .orderBy(desc(places.createdAt));

  response.json({ places: await Promise.all(savedPlaces.map(resolvePlaceImages)) });
};

const getPlaceById: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const placeId = request.params.id as string;
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

  response.json({ place: await resolvePlaceImages(place) });
};

function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toUpperCase();
  return trimmed.length === 2 ? trimmed : null;
}

const createPlace: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const {
    name,
    latitude,
    longitude,
    description,
    imageUrls,
    socialUrls,
    imageUrl,
    socialLink,
    listId,
    countryCode,
  } = request.body as {
    name?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    description?: unknown;
    imageUrls?: unknown;
    socialUrls?: unknown;
    imageUrl?: unknown;
    socialLink?: unknown;
    listId?: unknown;
    countryCode?: unknown;
  };

  const parsedLatitude =
    typeof latitude === "string" ? Number(latitude) : latitude;
  const parsedLongitude =
    typeof longitude === "string" ? Number(longitude) : longitude;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof parsedLatitude !== "number" ||
    Number.isNaN(parsedLatitude) ||
    typeof parsedLongitude !== "number" ||
    Number.isNaN(parsedLongitude) ||
    typeof listId !== "string" ||
    !listId
  ) {
    response
      .status(400)
      .json({ error: "Name, latitude, longitude, and listId are required" });
    return;
  }

  const access = await getListAccess(authRequest.authUser.userId, listId);

  if (!access || !canCreateInList(access.role)) {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const [createdPlace] = await db
    .insert(places)
    .values({
      userId: authRequest.authUser.userId,
      listId,
      name: name.trim(),
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      description: typeof description === "string" ? description.trim() : null,
      countryCode: normalizeCountryCode(countryCode),
      imageUrls:
        (await normalizeImageUrls(imageUrls ?? imageUrl, authRequest.authUser.userId)) ??
        null,
      socialUrls: normalizeUrlArray(socialUrls ?? socialLink) ?? null,
    })
    .returning();

  response.status(201).json({ place: await resolvePlaceImages(createdPlace) });
};

const updatePlace: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const placeId = request.params.id as string;
  const {
    name,
    latitude,
    longitude,
    description,
    imageUrls,
    socialUrls,
    imageUrl,
    socialLink,
    listId,
    countryCode,
  } = request.body as {
    name?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    description?: unknown;
    imageUrls?: unknown;
    socialUrls?: unknown;
    imageUrl?: unknown;
    socialLink?: unknown;
    listId?: unknown;
    countryCode?: unknown;
  };

  const existingPlace = await db.query.places.findFirst({
    where: eq(places.id, placeId),
  });

  if (!existingPlace || !existingPlace.listId) {
    response.status(404).json({ error: "Place not found" });
    return;
  }

  const access = await getListAccess(authRequest.authUser.userId, existingPlace.listId);

  if (!access || !canModifyPlacesInList(access.role)) {
    response.status(404).json({ error: "Place not found" });
    return;
  }

  let nextListId = existingPlace.listId;

  if (typeof listId === "string" && listId && listId !== existingPlace.listId) {
    const targetAccess = await getListAccess(authRequest.authUser.userId, listId);

    if (!targetAccess || !canCreateInList(targetAccess.role)) {
      response.status(404).json({ error: "List not found" });
      return;
    }

    nextListId = listId;
  }

  const nextImageUrls =
    imageUrls === undefined && imageUrl === undefined
      ? existingPlace.imageUrls
      : await normalizeImageUrls(imageUrls ?? imageUrl, authRequest.authUser.userId);

  const [updatedPlace] = await db
    .update(places)
    .set({
      listId: nextListId,
      name: typeof name === "string" ? name.trim() : existingPlace.name,
      latitude:
        typeof latitude === "string"
          ? Number(latitude)
          : typeof latitude === "number" && !Number.isNaN(latitude)
            ? latitude
            : existingPlace.latitude,
      longitude:
        typeof longitude === "string"
          ? Number(longitude)
          : typeof longitude === "number" && !Number.isNaN(longitude)
            ? longitude
            : existingPlace.longitude,
      description:
        description === undefined
          ? existingPlace.description
          : typeof description === "string"
            ? description.trim()
            : null,
      countryCode:
        countryCode === undefined
          ? existingPlace.countryCode
          : normalizeCountryCode(countryCode),
      imageUrls: nextImageUrls,
      socialUrls:
        socialUrls === undefined && socialLink === undefined
          ? existingPlace.socialUrls
          : normalizeUrlArray(socialUrls ?? socialLink),
    })
    .where(eq(places.id, existingPlace.id))
    .returning();

  response.json({ place: await resolvePlaceImages(updatedPlace) });
};

const deletePlace: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const placeId = request.params.id as string;

  const existingPlace = await db.query.places.findFirst({
    where: eq(places.id, placeId),
  });

  if (!existingPlace || !existingPlace.listId) {
    response.status(404).json({ error: "Place not found" });
    return;
  }

  const access = await getListAccess(authRequest.authUser.userId, existingPlace.listId);

  if (!access || !canModifyPlacesInList(access.role)) {
    response.status(404).json({ error: "Place not found" });
    return;
  }

  await db.delete(places).where(eq(places.id, existingPlace.id));
  await cleanUpOrphanedImages(existingPlace.userId, existingPlace.imageUrls);

  response.status(204).send();
};

placesRouter.get("/", listPlaces);
placesRouter.get("/:id", getPlaceById);
placesRouter.post("/", createPlace);
placesRouter.patch("/:id", updatePlace);
placesRouter.delete("/:id", deletePlace);

export default placesRouter;
