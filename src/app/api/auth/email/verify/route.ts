import type { NextRequest } from "next/server";
import { z } from "zod";

import { ERROR_CODES, error, success } from "@/lib/api/response";
import { verifyEmailOTPChallenge } from "@/lib/auth/email-otp";
import { setSessionCookie, signToken } from "@/lib/auth/session";
import {
  clearEmailOtpCookie,
  getEmailOtpCookie,
  verifyEmailOtpChallengeToken,
} from "@/lib/auth/stateless-email-otp";
import { hasConfiguredDatabase } from "@/lib/config/env";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const verifySchema = z.object({
  email: z.string().email("Enter a valid email address").max(160),
  otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

const otpErrorStatus = {
  OTP_INVALID: 400,
  OTP_EXPIRED: 410,
  OTP_MAX_ATTEMPTS: 429,
} as const;

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    logger.warn("api.auth.email.verify", "Invalid JSON body");
    return error("Invalid JSON body", ERROR_CODES.VALIDATION_ERROR, 400);
  }

  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    logger.warn("api.auth.email.verify", "Validation failed", {
      issues: parsed.error.issues,
    });

    return error(
      parsed.error.issues[0]?.message ?? "Invalid request body",
      ERROR_CODES.VALIDATION_ERROR,
      400,
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { otp } = parsed.data;
  const limit = rateLimit(`email-otp-verify:${email}`, 10, 15 * 60);

  if (!limit.success) {
    return error(
      "Too many email OTP verification attempts. Please try again later.",
      ERROR_CODES.RATE_LIMITED,
      429,
    );
  }

  if (!hasConfiguredDatabase) {
    const token = getEmailOtpCookie(request);
    const challenge = token ? await verifyEmailOtpChallengeToken(token) : null;

    if (!challenge || challenge.email !== email || challenge.otp !== otp) {
      return error(
        "Email OTP verification failed.",
        ERROR_CODES.OTP_INVALID,
        400,
      );
    }

    const user = {
      id: `email-${email}`,
      phone: null,
      email,
      role: "STUDENT" as const,
      name: "Kinetic Student",
    };

    const sessionToken = await signToken({
      userId: user.id,
      role: user.role,
    });

    const response = success({
      user,
    });

    setSessionCookie(response, sessionToken);
    clearEmailOtpCookie(response);

    return response;
  }

  const verification = await verifyEmailOTPChallenge(email, otp);

  if (!verification.success) {
    return error(
      "Email OTP verification failed.",
      ERROR_CODES[verification.error],
      otpErrorStatus[verification.error],
    );
  }

  if (verification.userId.startsWith("dev-email-")) {
    return error(
      "Database is not ready. Email OTP code is valid, but login needs the database. Run Prisma db push and try again.",
      ERROR_CODES.INTERNAL_ERROR,
      503,
    );
  }

  const user = await db.user.findUnique({
    where: {
      id: verification.userId,
    },
    select: {
      id: true,
      phone: true,
      email: true,
      role: true,
      name: true,
    },
  });

  if (!user) {
    logger.error("api.auth.email.verify", "Verified email user was not found", {
      email,
      userId: verification.userId,
    });

    return error("Email verification failed.", ERROR_CODES.INTERNAL_ERROR, 500);
  }

  const token = await signToken({
    userId: user.id,
    role: user.role,
  });

  const response = success({
    user,
  });

  setSessionCookie(response, token);

  logger.info("api.auth.email.verify", "Email OTP verified and session created", {
    email,
    userId: user.id,
  });

  return response;
}
