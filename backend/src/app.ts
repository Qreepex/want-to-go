import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import { generalRateLimiter } from "./middleware/rate-limit.js";
import authRouter from "./routes/auth.js";
import geocodeRouter from "./routes/geocode.js";
import listsRouter from "./routes/lists.js";
import placesRouter from "./routes/places.js";
import statsRouter from "./routes/stats.js";
import uploadsRouter from "./routes/uploads.js";
import visitsRouter from "./routes/visits.js";

const jsonErrorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  console.error("Unhandled request error:", error);
  response.status(500).json({ error: "Internal server error" });
};

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  // The general limiter's window is deliberately tight for real traffic; the
  // test suite fires far more requests per second than any real client, and
  // shares one Redis instance across every test file, so it's skipped in tests
  // (the dedicated geocode rate limiter, which the tests target directly, still runs).
  if (process.env.NODE_ENV !== "test") {
    app.use(generalRateLimiter);
  }

  app.use("/auth", authRouter);
  app.use("/geo", geocodeRouter);
  app.use("/lists", listsRouter);
  app.use("/places", placesRouter);
  app.use("/stats", statsRouter);
  app.use("/uploads", uploadsRouter);
  app.use("/visits", visitsRouter);

  app.use(jsonErrorHandler);

  return app;
}
