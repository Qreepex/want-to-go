import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { db } from "../src/db/client.js";
import { listMembers, lists, users } from "../src/db/schema.js";
import { signAuthToken } from "../src/lib/auth.js";

type ShareableRole = "view" | "add" | "edit";

export function getApp() {
  return createApp();
}

export async function createTestUser(usernamePrefix = "user") {
  const id = randomUUID();
  const username = `${usernamePrefix}-${id.slice(0, 8)}`;
  const [user] = await db.insert(users).values({ id, username }).returning();
  const token = signAuthToken({ userId: user.id, username: user.username });
  return { ...user, token };
}

export async function createTestList(ownerId: string, name = "Test list") {
  const [list] = await db.insert(lists).values({ ownerId, name }).returning();
  return list;
}

export async function addListMember(
  listId: string,
  userId: string,
  role: ShareableRole,
) {
  await db.insert(listMembers).values({ listId, userId, role });
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
