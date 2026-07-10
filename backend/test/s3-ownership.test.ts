import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "../src/db/client.js";
import { images } from "../src/db/schema.js";
import { extractOwnImageKey } from "../src/lib/s3.js";
import {
  authHeader,
  createTestList,
  createTestUser,
  getApp,
} from "./helpers.js";

describe("extractOwnImageKey (pure logic)", () => {
  it("treats a bare (non-URL) string as a candidate key as-is", () => {
    expect(extractOwnImageKey("places/user/abc.jpg")).toBe(
      "places/user/abc.jpg",
    );
  });

  it("extracts the key from a matching virtual-hosted-style bucket URL", () => {
    const bucket = process.env.S3_BUCKET_NAME as string;
    const region = process.env.AWS_REGION as string;
    const url = `https://${bucket}.s3.${region}.amazonaws.com/places/user/abc.jpg`;
    expect(extractOwnImageKey(url)).toBe("places/user/abc.jpg");
  });

  it("returns null for a genuine external URL", () => {
    expect(extractOwnImageKey("https://instagram.com/p/some-photo")).toBeNull();
  });
});

describe("image ownership enforcement in normalizeImageUrls", () => {
  it("drops another user's real image key when referenced in imageUrls", async () => {
    const owner = await createTestUser("image-owner");
    const attacker = await createTestUser("image-attacker");
    const list = await createTestList(attacker.id);

    const ownedKey = `places/${owner.id}/${randomUUID()}.jpg`;
    await db.insert(images).values({ userId: owner.id, key: ownedKey });

    const res = await request(getApp())
      .post("/places")
      .set(authHeader(attacker.token))
      .send({
        name: "Sneaky place",
        latitude: 1,
        longitude: 1,
        listId: list.id,
        imageUrls: [ownedKey],
      });

    expect(res.status).toBe(201);
    expect(res.body.place.imageUrls).toBeNull();
  });

  it("also drops a foreign key when it's pasted back as a bucket URL", async () => {
    const owner = await createTestUser("image-owner-url");
    const attacker = await createTestUser("image-attacker-url");
    const list = await createTestList(attacker.id);

    const ownedKey = `places/${owner.id}/${randomUUID()}.jpg`;
    await db.insert(images).values({ userId: owner.id, key: ownedKey });

    const bucket = process.env.S3_BUCKET_NAME as string;
    const region = process.env.AWS_REGION as string;
    const foreignUrl = `https://${bucket}.s3.${region}.amazonaws.com/${ownedKey}`;

    const res = await request(getApp())
      .post("/places")
      .set(authHeader(attacker.token))
      .send({
        name: "Sneaky place via URL",
        latitude: 1,
        longitude: 1,
        listId: list.id,
        imageUrls: [foreignUrl],
      });

    expect(res.status).toBe(201);
    expect(res.body.place.imageUrls).toBeNull();
  });

  it("accepts and resolves a user's own image key", async () => {
    const owner = await createTestUser("image-owner-self");
    const list = await createTestList(owner.id);
    const ownedKey = `places/${owner.id}/${randomUUID()}.jpg`;
    await db.insert(images).values({ userId: owner.id, key: ownedKey });

    const res = await request(getApp())
      .post("/places")
      .set(authHeader(owner.token))
      .send({
        name: "My place",
        latitude: 1,
        longitude: 1,
        listId: list.id,
        imageUrls: [ownedKey],
      });

    expect(res.status).toBe(201);
    expect(res.body.place.imageUrls).toHaveLength(1);
    expect(res.body.place.imageUrls[0]).toMatch(/^https?:\/\//);
  });
});
