import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.js";
import geocodeRouter from "./routes/geocode.js";
import placesRouter from "./routes/places.js";
import statsRouter from "./routes/stats.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.use("/auth", authRouter);
  app.use("/geo", geocodeRouter);
  app.use("/places", placesRouter);
  app.use("/stats", statsRouter);

  return app;
}
