import { and, desc, eq } from "drizzle-orm";
import { Router, type RequestHandler } from "express";
import { db } from "../db/client.js";
import { places } from "../db/schema.js";
import type { AuthenticatedRequest } from "../lib/request.js";
import { requireAuth } from "../middleware/require-auth.js";

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

const listPlaces: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const savedPlaces = await db
    .select()
    .from(places)
    .where(eq(places.userId, authRequest.authUser.userId))
    .orderBy(desc(places.createdAt));

  response.json({ places: savedPlaces });
};

const getPlaceById: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const placeId = request.params.id as string;
  const place = await db.query.places.findFirst({
    where: and(
      eq(places.id, placeId),
      eq(places.userId, authRequest.authUser.userId),
    ),
  });

  if (!place) {
    response.status(404).json({ error: "Place not found" });
    return;
  }

  response.json({ place });
};

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
  } = request.body as {
    name?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    description?: unknown;
    imageUrls?: unknown;
    socialUrls?: unknown;
    imageUrl?: unknown;
    socialLink?: unknown;
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
    Number.isNaN(parsedLongitude)
  ) {
    response
      .status(400)
      .json({ error: "Name, latitude, and longitude are required" });
    return;
  }

  const [createdPlace] = await db
    .insert(places)
    .values({
      userId: authRequest.authUser.userId,
      name: name.trim(),
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      description: typeof description === "string" ? description.trim() : null,
      imageUrls: normalizeUrlArray(imageUrls ?? imageUrl) ?? null,
      socialUrls: normalizeUrlArray(socialUrls ?? socialLink) ?? null,
    })
    .returning();

  response.status(201).json({ place: createdPlace });
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
  } = request.body as {
    name?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    description?: unknown;
    imageUrls?: unknown;
    socialUrls?: unknown;
    imageUrl?: unknown;
    socialLink?: unknown;
  };

  const existingPlace = await db.query.places.findFirst({
    where: and(
      eq(places.id, placeId),
      eq(places.userId, authRequest.authUser.userId),
    ),
  });

  if (!existingPlace) {
    response.status(404).json({ error: "Place not found" });
    return;
  }

  const [updatedPlace] = await db
    .update(places)
    .set({
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
      imageUrls:
        imageUrls === undefined && imageUrl === undefined
          ? existingPlace.imageUrls
          : normalizeUrlArray(imageUrls ?? imageUrl),
      socialUrls:
        socialUrls === undefined && socialLink === undefined
          ? existingPlace.socialUrls
          : normalizeUrlArray(socialUrls ?? socialLink),
    })
    .where(eq(places.id, existingPlace.id))
    .returning();

  response.json({ place: updatedPlace });
};

const deletePlace: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const placeId = request.params.id as string;
  const result = await db
    .delete(places)
    .where(
      and(
        eq(places.id, placeId),
        eq(places.userId, authRequest.authUser.userId),
      ),
    )
    .returning({ id: places.id });

  if (!result.length) {
    response.status(404).json({ error: "Place not found" });
    return;
  }

  response.status(204).send();
};

placesRouter.get("/", listPlaces);
placesRouter.get("/:id", getPlaceById);
placesRouter.post("/", createPlace);
placesRouter.patch("/:id", updatePlace);
placesRouter.delete("/:id", deletePlace);

export default placesRouter;
