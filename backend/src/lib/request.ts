import type { Request } from "express";
import type { AuthTokenPayload } from "./auth.js";

export interface AuthenticatedRequest extends Request {
  authUser: AuthTokenPayload;
}
