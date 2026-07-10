import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import Redis from "ioredis";
import { Pool } from "pg";

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../drizzle",
);

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to determine a free port"));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

function runDocker(args: string[]): void {
  const result = spawnSync("docker", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `docker ${args.join(" ")} failed: ${result.stderr || result.stdout}`,
    );
  }
}

function stopContainerQuietly(name: string): void {
  try {
    spawnSync("docker", ["stop", name], { encoding: "utf8" });
  } catch {
    // best-effort cleanup
  }
}

async function waitForPostgres(connectionString: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    const pool = new Pool({ connectionString });
    try {
      await pool.query("select 1");
      await pool.end();
      return;
    } catch (error) {
      lastError = error;
      await pool.end().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw new Error(
    `Postgres did not become ready in time: ${String(lastError)}`,
  );
}

async function waitForRedis(url: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    const client = new Redis(url, {
      lazyConnect: true,
      retryStrategy: () => null,
    });
    try {
      await client.connect();
      await client.ping();
      client.disconnect();
      return;
    } catch (error) {
      lastError = error;
      client.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw new Error(`Redis did not become ready in time: ${String(lastError)}`);
}

export default async function globalSetup() {
  const suffix = randomBytes(4).toString("hex");
  const pgContainer = `want-to-go-test-pg-${suffix}`;
  const redisContainer = `want-to-go-test-redis-${suffix}`;
  const pgPort = await getFreePort();
  const redisPort = await getFreePort();

  const databaseUrl = `postgres://postgres:test@127.0.0.1:${pgPort}/want_to_go_test`;
  const redisUrl = `redis://127.0.0.1:${redisPort}`;

  runDocker([
    "run",
    "-d",
    "--rm",
    "--name",
    pgContainer,
    "-p",
    `${pgPort}:5432`,
    "-e",
    "POSTGRES_PASSWORD=test",
    "-e",
    "POSTGRES_DB=want_to_go_test",
    "postgres:16",
  ]);

  runDocker([
    "run",
    "-d",
    "--rm",
    "--name",
    redisContainer,
    "-p",
    `${redisPort}:6379`,
    "redis:7.2-alpine",
  ]);

  try {
    await waitForPostgres(databaseUrl);
    await waitForRedis(redisUrl);

    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = databaseUrl;
    process.env.REDIS_URL = redisUrl;
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_ACCESS_KEY_ID = "test-access-key";
    process.env.AWS_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.S3_BUCKET_NAME = "test-bucket";
    process.env.GEOAPIFY_API_KEY = "test-geoapify-key";
    process.env.AUTHENTIK_ISSUER_URL = "https://authentik.test";
    process.env.AUTHENTIK_CLIENT_ID = "test-client-id";
    process.env.AUTHENTIK_CLIENT_SECRET = "test-client-secret";
    process.env.AUTHENTIK_REDIRECT_URI = "http://localhost:3000/auth/callback";
    process.env.FRONTEND_URL = "http://localhost:5173";

    const migrationPool = new Pool({ connectionString: databaseUrl });
    const migrationDb = drizzle(migrationPool);
    await migrate(migrationDb, { migrationsFolder });
    await migrationPool.end();
  } catch (error) {
    stopContainerQuietly(pgContainer);
    stopContainerQuietly(redisContainer);
    throw error;
  }

  return async () => {
    stopContainerQuietly(pgContainer);
    stopContainerQuietly(redisContainer);
  };
}
