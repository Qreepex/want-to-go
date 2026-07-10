import { describe, expect, it } from "vitest";
import request from "supertest";
import {
  authHeader,
  createTestList,
  createTestUser,
  getApp,
} from "./helpers.js";

describe("input validation", () => {
  it("rejects an out-of-range latitude when creating a place", async () => {
    const user = await createTestUser("validation-places");
    const list = await createTestList(user.id);

    const res = await request(getApp())
      .post("/places")
      .set(authHeader(user.token))
      .send({
        name: "Somewhere",
        latitude: 999,
        longitude: 1,
        listId: list.id,
      });

    expect(res.status).toBe(400);
  });

  it("rejects an out-of-range longitude when creating a place", async () => {
    const user = await createTestUser("validation-places-lon");
    const list = await createTestList(user.id);

    const res = await request(getApp())
      .post("/places")
      .set(authHeader(user.token))
      .send({
        name: "Somewhere",
        latitude: 1,
        longitude: -999,
        listId: list.id,
      });

    expect(res.status).toBe(400);
  });

  it("rejects an oversized name when creating a place", async () => {
    const user = await createTestUser("validation-name");
    const list = await createTestList(user.id);

    const res = await request(getApp())
      .post("/places")
      .set(authHeader(user.token))
      .send({
        name: "x".repeat(500),
        latitude: 1,
        longitude: 1,
        listId: list.id,
      });

    expect(res.status).toBe(400);
  });

  it("rejects a non-UUID listId when creating a place", async () => {
    const user = await createTestUser("validation-listid");

    const res = await request(getApp())
      .post("/places")
      .set(authHeader(user.token))
      .send({
        name: "Somewhere",
        latitude: 1,
        longitude: 1,
        listId: "not-a-uuid",
      });

    expect(res.status).toBe(400);
  });

  it("rejects a non-UUID :id path param", async () => {
    const user = await createTestUser("validation-id-param");

    const res = await request(getApp())
      .get("/places/not-a-uuid")
      .set(authHeader(user.token));

    expect(res.status).toBe(400);
  });

  it("accepts a well-formed place body", async () => {
    const user = await createTestUser("validation-happy-path");
    const list = await createTestList(user.id);

    const res = await request(getApp())
      .post("/places")
      .set(authHeader(user.token))
      .send({
        name: "Somewhere nice",
        latitude: 48.2,
        longitude: 16.4,
        listId: list.id,
      });

    expect(res.status).toBe(201);
  });

  it("rejects a non-UUID placeId when creating a visit", async () => {
    const user = await createTestUser("validation-visit");

    const res = await request(getApp())
      .post("/visits")
      .set(authHeader(user.token))
      .send({ placeId: "not-a-uuid", visitedAt: "2024-01-01" });

    expect(res.status).toBe(400);
  });

  it("rejects a malformed visitedAt date", async () => {
    const user = await createTestUser("validation-visit-date");
    const list = await createTestList(user.id);
    const place = await request(getApp())
      .post("/places")
      .set(authHeader(user.token))
      .send({ name: "Somewhere", latitude: 1, longitude: 1, listId: list.id });

    const res = await request(getApp())
      .post("/visits")
      .set(authHeader(user.token))
      .send({ placeId: place.body.place.id, visitedAt: "not-a-date" });

    expect(res.status).toBe(400);
  });

  it("rejects an oversized list name", async () => {
    const user = await createTestUser("validation-list-name");

    const res = await request(getApp())
      .post("/lists")
      .set(authHeader(user.token))
      .send({ name: "x".repeat(200) });

    expect(res.status).toBe(400);
  });

  it("rejects an invalid share role", async () => {
    const user = await createTestUser("validation-share-role");
    const list = await createTestList(user.id);

    const res = await request(getApp())
      .post(`/lists/${list.id}/share`)
      .set(authHeader(user.token))
      .send({ role: "admin" });

    expect(res.status).toBe(400);
  });

  it("rejects a malformed share token when joining a list", async () => {
    const user = await createTestUser("validation-join-token");

    const res = await request(getApp())
      .post("/lists/join/not-a-valid-token")
      .set(authHeader(user.token));

    expect(res.status).toBe(400);
  });

  it("rejects an empty geocode search query", async () => {
    const res = await request(getApp()).get("/geo/search").query({ q: "" });
    expect(res.status).toBe(400);
  });

  it("rejects an out-of-range reverse-geocode latitude", async () => {
    const res = await request(getApp())
      .get("/geo/reverse")
      .query({ lat: "999", lon: "1" });
    expect(res.status).toBe(400);
  });
});
