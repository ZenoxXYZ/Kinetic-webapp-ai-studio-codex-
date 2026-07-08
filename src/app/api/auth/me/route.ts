import { ERROR_CODES, error, success } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/rbac";
import { hasConfiguredDatabase } from "@/lib/config/env";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/logger";

export const GET = withAuth(async (_request, _context, session) => {
  if (session.userId.startsWith("phone-")) {
    return success({
      user: {
        id: session.userId,
        phone: session.userId.replace(/^phone-/, ""),
        email: null,
        name: "Kinetic Student",
        role: session.role,
        avatarUrl: null,
        createdAt: new Date().toISOString(),
        studentProfile: null,
        xp: {
          total: 0,
          thisWeek: 0,
          level: 1,
        },
        onboardingRequired: false,
      },
    });
  }

  if (session.userId.startsWith("email-")) {
    return success({
      user: {
        id: session.userId,
        phone: null,
        email: session.userId.replace(/^email-/, ""),
        name: "Kinetic Student",
        role: session.role,
        avatarUrl: null,
        createdAt: new Date().toISOString(),
        studentProfile: null,
        xp: {
          total: 0,
          thisWeek: 0,
          level: 1,
        },
        onboardingRequired: false,
      },
    });
  }

  if (!hasConfiguredDatabase) {
    return error("User database is not configured", ERROR_CODES.NOT_CONFIGURED, 501);
  }

  try {
    const user = await db.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      logger.warn("api.auth.me", "Session user was not found", {
        userId: session.userId,
      });

      return error("User not found", ERROR_CODES.NOT_FOUND, 404);
    }

    logger.debug("api.auth.me", "Current user fetched", {
      userId: user.id,
    });

    return success({
      user,
    });
  } catch (cause) {
    logger.error("api.auth.me", "Unexpected current user lookup error", {
      cause,
      userId: session.userId,
    });

    return error("Unexpected current user lookup error", ERROR_CODES.INTERNAL_ERROR, 500);
  }
});
