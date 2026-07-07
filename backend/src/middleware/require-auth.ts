import type { RequestHandler } from "express";
import { verifyAuthToken } from "../lib/auth.js";
import type { AuthenticatedRequest } from "../lib/request.js";

export const requireAuth: RequestHandler = (request, response, next) => {
  const authRequest = request as AuthenticatedRequest;
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    response.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();

  if (!token) {
    response.status(401).json({ error: "Missing bearer token" });
    return;
  }

  try {
    authRequest.authUser = verifyAuthToken(token);
    next();
  } catch {
    response.status(401).json({ error: "Invalid token" });
  }
};
