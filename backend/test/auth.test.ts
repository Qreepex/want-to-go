import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { getApp, createTestUser, authHeader } from "./helpers.js";

function base64url(input: object | string): string {
  const json = typeof input === "string" ? input : JSON.stringify(input);
  return Buffer.from(json).toString("base64url");
}

describe("requireAuth", () => {
  it("rejects requests with no Authorization header", async () => {
    const res = await request(getApp()).get("/places");
    expect(res.status).toBe(401);
  });

  it("rejects a non-Bearer Authorization header", async () => {
    const res = await request(getApp())
      .get("/places")
      .set("Authorization", "Basic abc123");
    expect(res.status).toBe(401);
  });

  it("rejects an empty Bearer token", async () => {
    const res = await request(getApp())
      .get("/places")
      .set("Authorization", "Bearer ");
    expect(res.status).toBe(401);
  });

  it("rejects a malformed JWT", async () => {
    const res = await request(getApp())
      .get("/places")
      .set("Authorization", "Bearer not-a-real-jwt");
    expect(res.status).toBe(401);
  });

  it("rejects an expired JWT", async () => {
    const expired = jwt.sign(
      { userId: "some-user", username: "someone" },
      process.env.JWT_SECRET as string,
      { expiresIn: "-10s" },
    );
    const res = await request(getApp()).get("/places").set(authHeader(expired));
    expect(res.status).toBe(401);
  });

  it("rejects a JWT signed with the wrong secret", async () => {
    const forged = jwt.sign(
      { userId: "some-user", username: "someone" },
      "not-the-real-secret",
    );
    const res = await request(getApp()).get("/places").set(authHeader(forged));
    expect(res.status).toBe(401);
  });

  it("rejects an unsigned alg=none token (algorithm confusion)", async () => {
    const header = base64url({ alg: "none", typ: "JWT" });
    const payload = base64url({ userId: "some-user", username: "someone" });
    const unsignedToken = `${header}.${payload}.`;

    const res = await request(getApp())
      .get("/places")
      .set("Authorization", `Bearer ${unsignedToken}`);
    expect(res.status).toBe(401);
  });

  it("accepts a validly signed token and attaches the user", async () => {
    const user = await createTestUser();
    const res = await request(getApp())
      .get("/places")
      .set(authHeader(user.token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ places: [] });
  });

  it("leaves /stats/all reachable without a token (intentionally public)", async () => {
    const res = await request(getApp()).get("/stats/all");
    expect(res.status).toBe(200);
  });

  it("leaves /geo/* reachable without a token (intentionally public)", async () => {
    // No auth header at all; a validation 400 (rather than 401) proves the
    // route isn't gated by requireAuth.
    const search = await request(getApp()).get("/geo/search");
    expect(search.status).toBe(400);

    const reverse = await request(getApp()).get("/geo/reverse");
    expect(reverse.status).toBe(400);
  });
});
