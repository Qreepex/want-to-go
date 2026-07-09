import { eq } from "drizzle-orm";
import { Router } from "express";
import { createHash, randomBytes } from "node:crypto";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import "../env.js";
import { signAuthToken, verifyAuthToken } from "../lib/auth.js";
import { ensureDefaultList } from "../lib/list-access.js";

const issuerDiscoveryPath = "/.well-known/openid-configuration";

async function getOidcConfiguration() {
  const issuerUrl = process.env.AUTHENTIK_ISSUER_URL;

  if (!issuerUrl) {
    throw new Error("AUTHENTIK_ISSUER_URL is required");
  }

  const discoveryResponse = await fetch(issuerUrl + issuerDiscoveryPath);

  if (!discoveryResponse.ok) {
    throw new Error("Unable to discover OIDC configuration");
  }

  return (await discoveryResponse.json()) as {
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint: string;
  };
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const digest = createHash("sha256").update(verifier).digest();
  return base64UrlEncode(digest);
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

function buildUsernameCandidates(
  baseUsername: string,
  subject: string,
): string[] {
  const normalizedBase = baseUsername.trim() || subject;
  const subjectSuffix = subject.slice(0, 8);

  return [
    normalizedBase,
    `${normalizedBase}-${subjectSuffix}`,
    `${normalizedBase}-${subjectSuffix}-${randomBytes(2).toString("hex")}`,
  ];
}

async function ensureUser(subject: string, preferredUsername: string) {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, subject),
  });

  if (existingUser) {
    if (existingUser.username !== preferredUsername) {
      const [updatedUser] = await db
        .update(users)
        .set({ username: preferredUsername })
        .where(eq(users.id, subject))
        .returning({
          id: users.id,
          username: users.username,
          createdAt: users.createdAt,
        });

      return updatedUser ?? existingUser;
    }

    return existingUser;
  }

  const usernameCandidates = buildUsernameCandidates(
    preferredUsername,
    subject,
  );

  for (const usernameCandidate of usernameCandidates) {
    try {
      const [createdUser] = await db
        .insert(users)
        .values({
          id: subject,
          username: usernameCandidate,
        })
        .returning({
          id: users.id,
          username: users.username,
          createdAt: users.createdAt,
        });

      if (createdUser) {
        return createdUser;
      }
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }
    }
  }

  throw new Error("Unable to provision OAuth user");
}

const authRouter = Router();

authRouter.get("/login", async (_request, response) => {
  const oidcConfig = await getOidcConfiguration();
  const clientId = getRequiredEnv("AUTHENTIK_CLIENT_ID");
  const redirectUri = getRequiredEnv("AUTHENTIK_REDIRECT_URI");
  const state = randomBytes(24).toString("hex");
  const codeVerifier = base64UrlEncode(randomBytes(32));
  const codeChallenge = await createCodeChallenge(codeVerifier);

  response.cookie("want-to-go-oauth-state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60 * 1000,
  });
  response.cookie("want-to-go-oauth-verifier", codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60 * 1000,
  });

  const authorizationUrl = new URL(oidcConfig.authorization_endpoint);
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");

  response.redirect(authorizationUrl.toString());
});

authRouter.get("/callback", async (request, response) => {
  const { code, state } = request.query as { code?: string; state?: string };
  const storedState = request.cookies["want-to-go-oauth-state"];
  const codeVerifier = request.cookies["want-to-go-oauth-verifier"];

  if (
    !code ||
    !state ||
    !storedState ||
    !codeVerifier ||
    state !== storedState
  ) {
    response.status(400).json({ error: "Invalid OAuth callback" });
    return;
  }

  const oidcConfig = await getOidcConfiguration();
  const tokenResponse = await fetch(oidcConfig.token_endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: getRequiredEnv("AUTHENTIK_CLIENT_ID"),
      client_secret: getRequiredEnv("AUTHENTIK_CLIENT_SECRET"),
      redirect_uri: getRequiredEnv("AUTHENTIK_REDIRECT_URI"),
      code,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    response.status(502).json({ error: "OAuth token exchange failed" });
    return;
  }

  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string;
  };

  if (!tokenPayload.access_token) {
    response.status(502).json({ error: "OAuth token exchange failed" });
    return;
  }

  const userInfoResponse = await fetch(oidcConfig.userinfo_endpoint, {
    headers: {
      authorization: `Bearer ${tokenPayload.access_token}`,
    },
  });

  if (!userInfoResponse.ok) {
    response.status(502).json({ error: "Unable to fetch user profile" });
    return;
  }

  const userInfo = (await userInfoResponse.json()) as {
    sub?: string;
    preferred_username?: string;
    name?: string;
  };

  if (!userInfo.sub) {
    response
      .status(502)
      .json({ error: "OAuth profile did not include a subject" });
    return;
  }

  const preferredUsername =
    userInfo.preferred_username ?? userInfo.name ?? userInfo.sub;
  const savedUser = await ensureUser(userInfo.sub, preferredUsername);
  await ensureDefaultList(savedUser.id);

  const token = signAuthToken({
    userId: savedUser.id,
    username: savedUser.username,
  });

  response.clearCookie("want-to-go-oauth-state", { path: "/" });
  response.clearCookie("want-to-go-oauth-verifier", { path: "/" });
  response.redirect(
    `${getRequiredEnv("FRONTEND_URL")}/auth/callback#token=${encodeURIComponent(token)}`,
  );
});

authRouter.get("/me", async (request, response) => {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    response.status(401).json({ error: "Missing bearer token" });
    return;
  }

  try {
    const token = authorizationHeader.slice("Bearer ".length);
    const authUser = verifyAuthToken(token);
    const user = await db.query.users.findFirst({
      where: eq(users.id, authUser.userId),
    });

    if (!user) {
      response.status(401).json({ error: "Invalid token" });
      return;
    }

    response.json({ user });
  } catch {
    response.status(401).json({ error: "Invalid token" });
  }
});

export default authRouter;
