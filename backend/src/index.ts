import { createApp } from "./app.js";
import { assertDatabaseReady } from "./db/client.js";
import "./env.js";

async function start() {
  try {
    await assertDatabaseReady();
  } catch (error) {
    console.error("Database connection failed during startup");
    console.error(error);
    process.exit(1);
  }

  const app = createApp();
  const port = Number(process.env.PORT ?? 3001);

  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

void start();
