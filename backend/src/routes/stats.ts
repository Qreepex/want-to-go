import { Router } from "express";
import { db } from "../db/client.js";
import { places, users } from "../db/schema.js";

import { count } from "drizzle-orm/sql/functions/aggregate";

const statsRouter = Router();

const cache = {
  places: 0,
  users: 0,
  lastUpdated: 0,
};

statsRouter.get("/all", async (_request, response) => {
  if (Date.now() - cache.lastUpdated > 60 * 1000) {
    const placesCount = await db
      .select({ count: count() })
      .from(places)
      .execute();
    const usersCount = await db
      .select({ count: count() })
      .from(users)
      .execute();

    cache.places = placesCount[0].count;
    cache.users = usersCount[0].count;
    cache.lastUpdated = Date.now();
  }

  response.json({ users: cache.users, places: cache.places });
});

export default statsRouter;
