import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import {
  addListMember,
  authHeader,
  createTestList,
  createTestUser,
  getApp,
} from "./helpers.js";

describe("places authorization (list role matrix)", () => {
  let owner: Awaited<ReturnType<typeof createTestUser>>;
  let viewer: Awaited<ReturnType<typeof createTestUser>>;
  let adder: Awaited<ReturnType<typeof createTestUser>>;
  let editor: Awaited<ReturnType<typeof createTestUser>>;
  let outsider: Awaited<ReturnType<typeof createTestUser>>;
  let listId: string;
  let otherListId: string;

  beforeAll(async () => {
    owner = await createTestUser("owner");
    viewer = await createTestUser("viewer");
    adder = await createTestUser("adder");
    editor = await createTestUser("editor");
    outsider = await createTestUser("outsider");

    const list = await createTestList(owner.id);
    listId = list.id;
    // A list the editor has no relationship to at all, to prove a
    // cross-list move is rejected even for someone who can edit the source list.
    const otherList = await createTestList(outsider.id);
    otherListId = otherList.id;

    await addListMember(listId, viewer.id, "view");
    await addListMember(listId, adder.id, "add");
    await addListMember(listId, editor.id, "edit");
  });

  async function createPlace(
    token: string,
    overrides: Record<string, unknown> = {},
  ) {
    return request(getApp())
      .post("/places")
      .set(authHeader(token))
      .send({
        name: "Test place",
        latitude: 1,
        longitude: 1,
        listId,
        ...overrides,
      });
  }

  it("owner can create, read, update, and delete a place", async () => {
    const created = await createPlace(owner.token);
    expect(created.status).toBe(201);
    const placeId = created.body.place.id;

    const got = await request(getApp())
      .get(`/places/${placeId}`)
      .set(authHeader(owner.token));
    expect(got.status).toBe(200);

    const updated = await request(getApp())
      .patch(`/places/${placeId}`)
      .set(authHeader(owner.token))
      .send({ name: "Renamed" });
    expect(updated.status).toBe(200);
    expect(updated.body.place.name).toBe("Renamed");

    const deleted = await request(getApp())
      .delete(`/places/${placeId}`)
      .set(authHeader(owner.token));
    expect(deleted.status).toBe(204);
  });

  it("a view-role member can read but not create, update, or delete", async () => {
    const created = await createPlace(owner.token);
    const placeId = created.body.place.id;

    const canRead = await request(getApp())
      .get(`/places/${placeId}`)
      .set(authHeader(viewer.token));
    expect(canRead.status).toBe(200);

    const cannotCreate = await createPlace(viewer.token);
    expect(cannotCreate.status).toBe(404);

    const cannotUpdate = await request(getApp())
      .patch(`/places/${placeId}`)
      .set(authHeader(viewer.token))
      .send({ name: "Hacked" });
    expect(cannotUpdate.status).toBe(404);

    const cannotDelete = await request(getApp())
      .delete(`/places/${placeId}`)
      .set(authHeader(viewer.token));
    expect(cannotDelete.status).toBe(404);
  });

  it("an add-role member can create but not update or delete", async () => {
    const canCreate = await createPlace(adder.token);
    expect(canCreate.status).toBe(201);

    const existing = await createPlace(owner.token);
    const placeId = existing.body.place.id;

    const cannotUpdate = await request(getApp())
      .patch(`/places/${placeId}`)
      .set(authHeader(adder.token))
      .send({ name: "Hacked" });
    expect(cannotUpdate.status).toBe(404);

    const cannotDelete = await request(getApp())
      .delete(`/places/${placeId}`)
      .set(authHeader(adder.token));
    expect(cannotDelete.status).toBe(404);
  });

  it("an edit-role member can create, update, and delete", async () => {
    const created = await createPlace(editor.token);
    expect(created.status).toBe(201);
    const placeId = created.body.place.id;

    const updated = await request(getApp())
      .patch(`/places/${placeId}`)
      .set(authHeader(editor.token))
      .send({ name: "Edited" });
    expect(updated.status).toBe(200);

    const deleted = await request(getApp())
      .delete(`/places/${placeId}`)
      .set(authHeader(editor.token));
    expect(deleted.status).toBe(204);
  });

  it("a user with no relationship to the list gets 404 on every verb (no existence leak)", async () => {
    const existing = await createPlace(owner.token);
    const placeId = existing.body.place.id;

    const read = await request(getApp())
      .get(`/places/${placeId}`)
      .set(authHeader(outsider.token));
    expect(read.status).toBe(404);

    const create = await createPlace(outsider.token);
    expect(create.status).toBe(404);

    const update = await request(getApp())
      .patch(`/places/${placeId}`)
      .set(authHeader(outsider.token))
      .send({ name: "Hacked" });
    expect(update.status).toBe(404);

    const del = await request(getApp())
      .delete(`/places/${placeId}`)
      .set(authHeader(outsider.token));
    expect(del.status).toBe(404);
  });

  it("moving a place to a list the user can't add to is rejected", async () => {
    const created = await createPlace(editor.token);
    const placeId = created.body.place.id;

    const move = await request(getApp())
      .patch(`/places/${placeId}`)
      .set(authHeader(editor.token))
      .send({ listId: otherListId });
    expect(move.status).toBe(404);

    const stillThere = await request(getApp())
      .get(`/places/${placeId}`)
      .set(authHeader(editor.token));
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.place.listId).toBe(listId);
  });
});
