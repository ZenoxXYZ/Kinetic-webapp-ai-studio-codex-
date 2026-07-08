import { UserRole } from "@prisma/client";
import { z } from "zod";

import { ERROR_CODES, error, success } from "@/lib/api/response";
import { setSessionCookie, signToken } from "@/lib/auth/session";
import { hasConfiguredDatabase } from "@/lib/config/env";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const signInSchema = z.object({
  phone: z
    .string()
    .regex(/^01\d{9}$/, "Phone must be an 11-digit Bangladeshi number starting with 01"),
});

async function createStatelessPhoneSession(phone: string) {
  const user = {
    id: `phone-${phone}`,
    phone,
    email: null,
    role: UserRole.STUDENT,
    name: "Kinetic Student",
  };

  const token = await signToken({
    userId: user.id,
    role: user.role,
  });

  const response = success({
    user,
  });

  setSessionCookie(response, token);

  return response;
}

function isDatabaseUnavailable(cause: unknown) {
  const message =
    cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "";

  return (
    message.includes("Can't reach database server") ||
    message.includes("does not exist in the current database") ||
    message.includes("ECONNREFUSED") ||
    message.includes("P2021") ||
    message.includes("P1001")
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    logger.warn("api.auth.phone.sign-in", "Invalid JSON body");
    return error("Invalid JSON body", ERROR_CODES.VALIDATION_ERROR, 400);
  }

  const parsed = signInSchema.safeParse(body);

  if (!parsed.success) {
    return error(
      parsed.error.issues[0]?.message ?? "Invalid request body",
      ERROR_CODES.VALIDATION_ERROR,
      400,
    );
  }

  const { phone } = parsed.data;
  const limit = rateLimit(`phone-sign-in:${phone}`, 10, 10 * 60);

  if (!limit.success) {
    return error(
      "Too many sign-in attempts. Please try again later.",
      ERROR_CODES.RATE_LIMITED,
      429,
    );
  }

  if (!hasConfiguredDatabase) {
    logger.warn("api.auth.phone.sign-in", "Phone sign-in used stateless fallback because DATABASE_URL is not configured", {
      phone,
    });

    return createStatelessPhoneSession(phone);
  }

  try {
    const user = await db.$transaction(async (transaction) => {
      const signedInUser = await transaction.user.upsert({
        where: {
          phone,
        },
        update: {
          lastLoginAt: new Date(),
        },
        create: {
          phone,
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

      if (signedInUser.role === UserRole.STUDENT) {
        await transaction.studentProfile.upsert({
          where: {
            userId: signedInUser.id,
          },
          update: {},
          create: {
            userId: signedInUser.id,
          },
        });
      }

      return signedInUser;
    });

    const token = await signToken({
      userId: user.id,
      role: user.role,
    });

    const response = success({
      user,
    });

    setSessionCookie(response, token);

    logger.info("api.auth.phone.sign-in", "Phone sign-in session created", {
      phone,
      userId: user.id,
    });

    return response;
  } catch (cause) {
    if (isDatabaseUnavailable(cause)) {
      logger.warn("api.auth.phone.sign-in", "Phone sign-in used stateless fallback", {
        phone,
      });

      return createStatelessPhoneSession(phone);
    }

    logger.error("api.auth.phone.sign-in", "Unexpected phone sign-in error", {
      cause,
      phone,
    });

    return error("Could not sign in with phone number.", ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
