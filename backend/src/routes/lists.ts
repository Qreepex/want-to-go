import { and, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { Router, type RequestHandler } from "express";
import { db } from "../db/client.js";
import { listMembers, listMemberRoleEnum, lists, places, users } from "../db/schema.js";
import { cleanUpOrphanedImages } from "../lib/images.js";
import { getListAccess, type ListAccessRole } from "../lib/list-access.js";
import type { AuthenticatedRequest } from "../lib/request.js";
import { requireAuth } from "../middleware/require-auth.js";

const listsRouter = Router();

listsRouter.use(requireAuth);

const shareRoles = listMemberRoleEnum.enumValues;

function isShareRole(value: unknown): value is (typeof shareRoles)[number] {
  return typeof value === "string" && (shareRoles as readonly string[]).includes(value);
}

const listLists: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const userId = authRequest.authUser.userId;

  const owned = await db.select().from(lists).where(eq(lists.ownerId, userId));
  const memberships = await db
    .select({ list: lists, role: listMembers.role })
    .from(listMembers)
    .innerJoin(lists, eq(listMembers.listId, lists.id))
    .where(eq(listMembers.userId, userId));

  const ownedPayload = owned.map((list) => ({
    id: list.id,
    name: list.name,
    role: "owner" as ListAccessRole,
    ownerId: list.ownerId,
    shareToken: list.shareToken,
    shareRole: list.shareRole,
    createdAt: list.createdAt,
  }));

  const memberPayload = memberships.map(({ list, role }) => ({
    id: list.id,
    name: list.name,
    role,
    ownerId: list.ownerId,
    shareToken: null,
    shareRole: null,
    createdAt: list.createdAt,
  }));

  response.json({ lists: [...ownedPayload, ...memberPayload] });
};

const createList: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const { name } = request.body as { name?: unknown };

  if (typeof name !== "string" || !name.trim()) {
    response.status(400).json({ error: "Name is required" });
    return;
  }

  const [createdList] = await db
    .insert(lists)
    .values({ ownerId: authRequest.authUser.userId, name: name.trim() })
    .returning();

  response.status(201).json({
    list: {
      id: createdList.id,
      name: createdList.name,
      role: "owner" as ListAccessRole,
      ownerId: createdList.ownerId,
      shareToken: createdList.shareToken,
      shareRole: createdList.shareRole,
      createdAt: createdList.createdAt,
    },
  });
};

const renameList: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const listId = request.params.id as string;
  const { name } = request.body as { name?: unknown };

  if (typeof name !== "string" || !name.trim()) {
    response.status(400).json({ error: "Name is required" });
    return;
  }

  const access = await getListAccess(authRequest.authUser.userId, listId);

  if (!access || access.role !== "owner") {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const [updatedList] = await db
    .update(lists)
    .set({ name: name.trim() })
    .where(eq(lists.id, listId))
    .returning();

  response.json({
    list: {
      id: updatedList.id,
      name: updatedList.name,
      role: "owner" as ListAccessRole,
      ownerId: updatedList.ownerId,
      shareToken: updatedList.shareToken,
      shareRole: updatedList.shareRole,
      createdAt: updatedList.createdAt,
    },
  });
};

const deleteList: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const listId = request.params.id as string;
  const userId = authRequest.authUser.userId;

  const access = await getListAccess(userId, listId);

  if (!access || access.role !== "owner") {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const ownedLists = await db.select({ id: lists.id }).from(lists).where(eq(lists.ownerId, userId));

  if (ownedLists.length <= 1) {
    response.status(400).json({ error: "Cannot delete your only list" });
    return;
  }

  const affectedPlaces = await db
    .select({ userId: places.userId, imageUrls: places.imageUrls })
    .from(places)
    .where(eq(places.listId, listId));

  await db.delete(lists).where(eq(lists.id, listId));

  for (const place of affectedPlaces) {
    await cleanUpOrphanedImages(place.userId, place.imageUrls);
  }

  response.status(204).send();
};

const listMembersHandler: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const listId = request.params.id as string;

  const access = await getListAccess(authRequest.authUser.userId, listId);

  if (!access || access.role !== "owner") {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const members = await db
    .select({
      userId: listMembers.userId,
      username: users.username,
      role: listMembers.role,
      createdAt: listMembers.createdAt,
    })
    .from(listMembers)
    .innerJoin(users, eq(listMembers.userId, users.id))
    .where(eq(listMembers.listId, listId));

  response.json({ members });
};

const removeListMember: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const listId = request.params.id as string;
  const targetUserId = request.params.userId as string;
  const requestingUserId = authRequest.authUser.userId;

  const access = await getListAccess(requestingUserId, listId);

  if (!access) {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const isSelf = requestingUserId === targetUserId;

  if (access.role !== "owner" && !isSelf) {
    response.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  await db
    .delete(listMembers)
    .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, targetUserId)));

  response.status(204).send();
};

const setShareLink: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const listId = request.params.id as string;
  const { role } = request.body as { role?: unknown };

  if (!isShareRole(role)) {
    response.status(400).json({ error: "role must be one of view, add, edit" });
    return;
  }

  const access = await getListAccess(authRequest.authUser.userId, listId);

  if (!access || access.role !== "owner") {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const shareToken = randomBytes(24).toString("hex");

  const [updatedList] = await db
    .update(lists)
    .set({ shareToken, shareRole: role })
    .where(eq(lists.id, listId))
    .returning();

  response.json({
    list: {
      id: updatedList.id,
      name: updatedList.name,
      role: "owner" as ListAccessRole,
      ownerId: updatedList.ownerId,
      shareToken: updatedList.shareToken,
      shareRole: updatedList.shareRole,
      createdAt: updatedList.createdAt,
    },
  });
};

const revokeShareLink: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const listId = request.params.id as string;

  const access = await getListAccess(authRequest.authUser.userId, listId);

  if (!access || access.role !== "owner") {
    response.status(404).json({ error: "List not found" });
    return;
  }

  const [updatedList] = await db
    .update(lists)
    .set({ shareToken: null, shareRole: null })
    .where(eq(lists.id, listId))
    .returning();

  response.json({
    list: {
      id: updatedList.id,
      name: updatedList.name,
      role: "owner" as ListAccessRole,
      ownerId: updatedList.ownerId,
      shareToken: updatedList.shareToken,
      shareRole: updatedList.shareRole,
      createdAt: updatedList.createdAt,
    },
  });
};

const joinList: RequestHandler = async (request, response) => {
  const authRequest = request as AuthenticatedRequest;
  const token = request.params.token as string;
  const userId = authRequest.authUser.userId;

  const list = await db.query.lists.findFirst({
    where: eq(lists.shareToken, token),
  });

  if (!list || !list.shareRole) {
    response.status(404).json({ error: "Invalid or expired invite" });
    return;
  }

  if (list.ownerId === userId) {
    response.json({ listId: list.id, listName: list.name });
    return;
  }

  const existingMembership = await db.query.listMembers.findFirst({
    where: and(eq(listMembers.listId, list.id), eq(listMembers.userId, userId)),
  });

  if (!existingMembership) {
    await db.insert(listMembers).values({
      listId: list.id,
      userId,
      role: list.shareRole,
    });
  }

  response.json({ listId: list.id, listName: list.name });
};

listsRouter.get("/", listLists);
listsRouter.post("/", createList);
listsRouter.post("/join/:token", joinList);
listsRouter.patch("/:id", renameList);
listsRouter.delete("/:id", deleteList);
listsRouter.get("/:id/members", listMembersHandler);
listsRouter.delete("/:id/members/:userId", removeListMember);
listsRouter.post("/:id/share", setShareLink);
listsRouter.delete("/:id/share", revokeShareLink);

export default listsRouter;
