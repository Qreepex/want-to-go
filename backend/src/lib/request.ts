import type { Request } from "express";
import type { AuthTokenPayload } from "./types.js";

export interface AuthenticatedRequest extends Request {
  authUser: AuthTokenPayload;
}
