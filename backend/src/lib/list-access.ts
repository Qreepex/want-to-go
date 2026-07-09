import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { lists, listMembers, type List } from "../db/schema.js";

export type ListAccessRole = "owner" | "view" | "add" | "edit";

export async function getListAccess(
  userId: string,
  listId: string,
): Promise<{ list: List; role: ListAccessRole } | null> {
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, listId),
  });

  if (!list) {
    return null;
  }

  if (list.ownerId === userId) {
    return { list, role: "owner" };
  }

  const membership = await db.query.listMembers.findFirst({
    where: and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)),
  });

  if (!membership) {
    return null;
  }

  return { list, role: membership.role };
}

export async function getAccessibleListIds(userId: string): Promise<string[]> {
  const owned = await db
    .select({ id: lists.id })
    .from(lists)
    .where(eq(lists.ownerId, userId));
  const memberOf = await db
    .select({ id: listMembers.listId })
    .from(listMembers)
    .where(eq(listMembers.userId, userId));

  return [...new Set([...owned.map((row) => row.id), ...memberOf.map((row) => row.id)])];
}

export function canCreateInList(role: ListAccessRole): boolean {
  return role === "owner" || role === "add" || role === "edit";
}

export function canModifyPlacesInList(role: ListAccessRole): boolean {
  return role === "owner" || role === "edit";
}

export async function ensureDefaultList(userId: string): Promise<void> {
  const existing = await db.query.lists.findFirst({
    where: eq(lists.ownerId, userId),
  });

  if (existing) {
    return;
  }

  await db.insert(lists).values({ ownerId: userId, name: "My list" });
}
