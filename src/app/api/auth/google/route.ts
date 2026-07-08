import { UserRole } from "@prisma/client";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ERROR_CODES, error, success } from "@/lib/api/response";
import { setSessionCookie, signToken } from "@/lib/auth/session";
import { env } from "@/lib/config/env";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/logger";

const googleSchema = z.object({
  code: z.string().min(1),
});

type GoogleTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type GoogleProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

function getAppUrl(request?: Request) {
  if (env.NEXT_PUBLIC_APP_URL !== "http://localhost:3000") {
    return env.NEXT_PUBLIC_APP_URL;
  }

  if (!request) {
    return env.NEXT_PUBLIC_APP_URL;
  }

  const requestUrl = new URL(request.url);
  return requestUrl.origin;
}

function getRedirectUri(request?: Request) {
  return env.GOOGLE_REDIRECT_URI ?? `${getAppUrl(request)}/api/auth/google`;
}

function getGoogleOAuthUrl(request?: Request) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", getRedirectUri(request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");

  return url;
}

async function exchangeCodeForProfile(code: string, request?: Request) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID ?? "",
      client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: getRedirectUri(request),
      grant_type: "authorization_code",
    }),
  });

  const tokenBody = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokenBody.access_token) {
    logger.warn("api.auth.google", "Google token exchange failed", {
      status: tokenResponse.status,
      error: tokenBody.error,
      description: tokenBody.error_description,
    });

    return null;
  }

  const profileResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokenBody.access_token}`,
      },
    },
  );

  const profile = (await profileResponse.json()) as GoogleProfile;

  if (!profileResponse.ok || !profile.sub || !profile.email) {
    logger.warn("api.auth.google", "Google profile fetch failed", {
      status: profileResponse.status,
    });

    return null;
  }

  return {
    profile,
    accessTokenHash: hashToken(tokenBody.access_token),
  };
}

async function createGoogleSessionResponse(code: string, request?: Request) {
  const googleResult = await exchangeCodeForProfile(code, request);

  if (!googleResult) {
    return error("Google authentication failed", ERROR_CODES.UNAUTHORIZED, 401);
  }

  const { profile, accessTokenHash } = googleResult;

  const user = await db.$transaction(async (transaction) => {
    const authenticatedUser = await transaction.user.upsert({
      where: {
        email: profile.email,
      },
      update: {
        name: profile.name,
        avatarUrl: profile.picture,
        lastLoginAt: new Date(),
      },
      create: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
        role: UserRole.STUDENT,
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        name: true,
      },
    });

    await transaction.authAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: profile.sub ?? "",
        },
      },
      update: {
        userId: authenticatedUser.id,
        email: profile.email,
        accessTokenHash,
      },
      create: {
        userId: authenticatedUser.id,
        provider: "google",
        providerAccountId: profile.sub ?? "",
        email: profile.email,
        accessTokenHash,
      },
    });

    if (authenticatedUser.role === UserRole.STUDENT) {
      await transaction.studentProfile.upsert({
        where: {
          userId: authenticatedUser.id,
        },
        update: {},
        create: {
          userId: authenticatedUser.id,
        },
      });
    }

    return authenticatedUser;
  });

  const token = await signToken({
    userId: user.id,
    role: user.role,
  });

  const response = success({
    user,
  });

  setSessionCookie(response, token);

  logger.info("api.auth.google", "Google auth session created", {
    userId: user.id,
    email: user.email,
  });

  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");
  const appUrl = new URL(getAppUrl(request));

  if (oauthError) {
    logger.warn("api.auth.google", "Google OAuth cancelled or failed", {
      error: oauthError,
    });
    appUrl.searchParams.set("authError", "google_cancelled");
    return NextResponse.redirect(appUrl);
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    logger.warn("api.auth.google", "Google auth requested but not configured");
    appUrl.searchParams.set("authError", "google_not_configured");
    return NextResponse.redirect(appUrl);
  }

  if (!code) {
    return NextResponse.redirect(getGoogleOAuthUrl(request));
  }

  try {
    const response = await createGoogleSessionResponse(code, request);

    if (!response.ok) {
      appUrl.searchParams.set("authError", "google_failed");
      return NextResponse.redirect(appUrl);
    }

    appUrl.searchParams.set("auth", "google_success");
    const redirect = NextResponse.redirect(appUrl);

    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });

    return redirect;
  } catch (cause) {
    logger.error("api.auth.google", "Unexpected Google redirect auth error", {
      cause,
    });
    appUrl.searchParams.set("authError", "google_failed");
    return NextResponse.redirect(appUrl);
  }
}

export async function POST(request: Request) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    logger.warn("api.auth.google", "Google auth requested but not configured");
    return error("Google auth not configured", ERROR_CODES.NOT_CONFIGURED, 501);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    logger.warn("api.auth.google", "Invalid JSON body");
    return error("Invalid JSON body", ERROR_CODES.VALIDATION_ERROR, 400);
  }

  const parsed = googleSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn("api.auth.google", "Validation failed", {
      issues: parsed.error.issues,
    });

    return error(
      parsed.error.issues[0]?.message ?? "Invalid request body",
      ERROR_CODES.VALIDATION_ERROR,
      400,
    );
  }

  try {
    return await createGoogleSessionResponse(parsed.data.code, request);
  } catch (cause) {
    logger.error("api.auth.google", "Unexpected Google auth error", {
      cause,
    });

    return error("Unexpected Google auth error", ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
