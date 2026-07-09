import { and, eq, isNull } from "drizzle-orm";
import { db, pool } from "../db/client.js";
import { lists, places, users } from "../db/schema.js";

async function main() {
  const allUsers = await db.select().from(users);

  for (const user of allUsers) {
    let defaultList = await db.query.lists.findFirst({
      where: eq(lists.ownerId, user.id),
    });

    if (!defaultList) {
      [defaultList] = await db
        .insert(lists)
        .values({ ownerId: user.id, name: "My list" })
        .returning();
      console.log(`Created default list for ${user.username} (${user.id})`);
    }

    const updated = await db
      .update(places)
      .set({ listId: defaultList.id })
      .where(and(eq(places.userId, user.id), isNull(places.listId)))
      .returning({ id: places.id });

    if (updated.length) {
      console.log(`Backfilled ${updated.length} place(s) for ${user.username}`);
    }
  }

  console.log("Backfill complete.");
}

main()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
