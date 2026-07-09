import { relations } from "drizzle-orm";
import {
  doublePrecision,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const listMemberRoleEnum = pgEnum("list_member_role", [
  "view",
  "add",
  "edit",
]);

export const lists = pgTable("lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  shareToken: text("share_token").unique(),
  shareRole: listMemberRoleEnum("share_role"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const listMembers = pgTable(
  "list_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: listMemberRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.listId, table.userId)],
);

export const places = pgTable("places", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  listId: uuid("list_id").references(() => lists.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  description: text("description"),
  countryCode: text("country_code"),
  imageUrls: text("image_urls").array(),
  socialUrls: text("social_urls").array(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const images = pgTable("images", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  places: many(places),
  images: many(images),
  lists: many(lists),
  listMemberships: many(listMembers),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
  owner: one(users, {
    fields: [lists.ownerId],
    references: [users.id],
  }),
  places: many(places),
  members: many(listMembers),
}));

export const listMembersRelations = relations(listMembers, ({ one }) => ({
  list: one(lists, {
    fields: [listMembers.listId],
    references: [lists.id],
  }),
  user: one(users, {
    fields: [listMembers.userId],
    references: [users.id],
  }),
}));

export const placesRelations = relations(places, ({ one }) => ({
  user: one(users, {
    fields: [places.userId],
    references: [users.id],
  }),
  list: one(lists, {
    fields: [places.listId],
    references: [lists.id],
  }),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  user: one(users, {
    fields: [images.userId],
    references: [users.id],
  }),
}));

export type Place = typeof places.$inferSelect;
export type List = typeof lists.$inferSelect;
export type ListMember = typeof listMembers.$inferSelect;
