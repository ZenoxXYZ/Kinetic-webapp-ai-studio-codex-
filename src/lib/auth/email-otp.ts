import { AuditAction, OtpPurpose, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

import { appConfig } from "@/lib/config/app";
import { env, isProduction } from "@/lib/config/env";
import { db } from "@/lib/db/client";
import { sendEmailOTP } from "@/lib/email/gateway";
import { logger } from "@/lib/logger";

const OTP_HASH_ROUNDS = 12;

type CreateEmailOTPResult =
  | {
      success: true;
      expiresAt: Date;
      devOtp?: string;
    }
  | {
      success: false;
      expiresAt?: Date;
      error: "OTP_COOLDOWN" | "EMAIL_DELIVERY_FAILED" | "INTERNAL_ERROR";
    };

type VerifyEmailOTPResult =
  | {
      success: true;
      userId: string;
      role: UserRole;
    }
  | {
      success: false;
      error: "OTP_EXPIRED" | "OTP_INVALID" | "OTP_MAX_ATTEMPTS";
    };

type DevEmailChallenge = {
  email: string;
  otp: string;
  expiresAt: Date;
  attemptCount: number;
  createdAt: Date;
};

const storeKey = "__kineticDevEmailOtpStore";

function getDevStore() {
  const globalStore = globalThis as typeof globalThis & {
    [storeKey]?: Map<string, DevEmailChallenge>;
  };

  globalStore[storeKey] ??= new Map();
  return globalStore[storeKey];
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return "****";
  }

  return `${name.slice(0, 2)}****@${domain}`;
};

const withPepper = (otp: string) => `${otp}:${env.JWT_SECRET}`;

function generateOTP() {
  const max = 10 ** appConfig.auth.otpLength;

  return randomInt(0, max)
    .toString()
    .padStart(appConfig.auth.otpLength, "0");
}

async function hashOTP(otp: string) {
  return bcrypt.hash(withPepper(otp), OTP_HASH_ROUNDS);
}

async function verifyOTP(otp: string, hash: string) {
  return bcrypt.compare(withPepper(otp), hash);
}

function isMissingEmailOtpTable(cause: unknown) {
  const message =
    cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "";

  return (
    message.includes("EmailOtpChallenge") ||
    message.includes("does not exist in the current database") ||
    message.includes("Can't reach database server") ||
    message.includes("ECONNREFUSED") ||
    message.includes("P2021") ||
    message.includes("P1001")
  );
}

function canUseDevFallback() {
  return !isProduction && env.EMAIL_USE_MOCK;
}

async function createDevEmailOTPChallenge(email: string): Promise<CreateEmailOTPResult> {
  const store = getDevStore();
  const existing = store.get(email);
  const cooldownStart = Date.now() - appConfig.auth.otpCooldownSeconds * 1000;

  if (existing && existing.createdAt.getTime() >= cooldownStart) {
    return {
      success: false,
      error: "OTP_COOLDOWN",
      expiresAt: existing.expiresAt,
    };
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + appConfig.auth.otpExpiryMinutes * 60 * 1000);
  const emailResult = await sendEmailOTP(email, otp);

  if (!emailResult.success) {
    return {
      success: false,
      error: "EMAIL_DELIVERY_FAILED",
    };
  }

  store.set(email, {
    email,
    otp,
    expiresAt,
    attemptCount: 0,
    createdAt: new Date(),
  });

  logger.warn("auth.email-otp", "Using in-memory email OTP fallback", {
    email: maskEmail(email),
    expiresAt,
  });

  return {
    success: true,
    expiresAt,
    devOtp: emailResult.devOtp,
  };
}

async function verifyDevEmailOTPChallenge(email: string, otp: string): Promise<VerifyEmailOTPResult> {
  const store = getDevStore();
  const challenge = store.get(email);

  if (!challenge) {
    return {
      success: false,
      error: "OTP_INVALID",
    };
  }

  if (challenge.expiresAt.getTime() <= Date.now()) {
    store.delete(email);
    return {
      success: false,
      error: "OTP_EXPIRED",
    };
  }

  if (challenge.attemptCount >= appConfig.auth.maxOtpAttempts) {
    store.delete(email);
    return {
      success: false,
      error: "OTP_MAX_ATTEMPTS",
    };
  }

  if (challenge.otp !== otp) {
    challenge.attemptCount += 1;

    if (challenge.attemptCount >= appConfig.auth.maxOtpAttempts) {
      store.delete(email);
      return {
        success: false,
        error: "OTP_MAX_ATTEMPTS",
      };
    }

    return {
      success: false,
      error: "OTP_INVALID",
    };
  }

  store.delete(email);

  return {
    success: true,
    userId: `dev-email-${email}`,
    role: UserRole.STUDENT,
  };
}

export async function createEmailOTPChallenge(email: string): Promise<CreateEmailOTPResult> {
  const normalizedEmail = normalizeEmail(email);
  const cooldownStart = new Date(
    Date.now() - appConfig.auth.otpCooldownSeconds * 1000,
  );

  try {
    const existingChallenge = await db.emailOtpChallenge.findFirst({
      where: {
        email: normalizedEmail,
        purpose: OtpPurpose.SIGN_IN,
        consumedAt: null,
        createdAt: {
          gte: cooldownStart,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingChallenge) {
      return {
        success: false,
        error: "OTP_COOLDOWN",
        expiresAt: existingChallenge.expiresAt,
      };
    }

    const existingUser = await db.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    const otp = generateOTP();
    const codeHash = await hashOTP(otp);
    const expiresAt = new Date(
      Date.now() + appConfig.auth.otpExpiryMinutes * 60 * 1000,
    );

    const challenge = await db.emailOtpChallenge.create({
      data: {
        userId: existingUser?.id,
        email: normalizedEmail,
        purpose: OtpPurpose.SIGN_IN,
        codeHash,
        expiresAt,
      },
    });

    await db.auditLog.create({
      data: {
        userId: existingUser?.id,
        action: AuditAction.OTP_REQUESTED,
        metadata: {
          email: maskEmail(normalizedEmail),
          channel: "email",
        },
      },
    });

    const emailResult = await sendEmailOTP(normalizedEmail, otp);

    if (!emailResult.success) {
      await db.emailOtpChallenge.delete({
        where: {
          id: challenge.id,
        },
      });

      await db.auditLog.create({
        data: {
          userId: existingUser?.id,
          action: AuditAction.OTP_FAILED,
          metadata: {
            reason: "EMAIL_DELIVERY_FAILED",
            email: maskEmail(normalizedEmail),
            channel: "email",
          },
        },
      });

      return {
        success: false,
        error: "EMAIL_DELIVERY_FAILED",
      };
    }

    return {
      success: true,
      expiresAt,
      devOtp: emailResult.devOtp,
    };
  } catch (cause) {
    if (canUseDevFallback() && isMissingEmailOtpTable(cause)) {
      return createDevEmailOTPChallenge(normalizedEmail);
    }

    logger.error("auth.email-otp", "Email OTP challenge failed", {
      cause,
      email: maskEmail(normalizedEmail),
    });

    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }
}

export async function verifyEmailOTPChallenge(
  email: string,
  otp: string,
): Promise<VerifyEmailOTPResult> {
  const normalizedEmail = normalizeEmail(email);

  try {
    const challenge = await db.emailOtpChallenge.findFirst({
      where: {
        email: normalizedEmail,
        purpose: OtpPurpose.SIGN_IN,
        consumedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!challenge) {
      return {
        success: false,
        error: "OTP_INVALID",
      };
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      await db.emailOtpChallenge.update({
        where: {
          id: challenge.id,
        },
        data: {
          consumedAt: new Date(),
        },
      });

      return {
        success: false,
        error: "OTP_EXPIRED",
      };
    }

    if (challenge.attemptCount >= appConfig.auth.maxOtpAttempts) {
      return {
        success: false,
        error: "OTP_MAX_ATTEMPTS",
      };
    }

    const isValid = await verifyOTP(otp, challenge.codeHash);

    if (!isValid) {
      const nextAttemptCount = challenge.attemptCount + 1;

      await db.emailOtpChallenge.update({
        where: {
          id: challenge.id,
        },
        data: {
          attemptCount: {
            increment: 1,
          },
          consumedAt:
            nextAttemptCount >= appConfig.auth.maxOtpAttempts
              ? new Date()
              : undefined,
        },
      });

      return {
        success: false,
        error:
          nextAttemptCount >= appConfig.auth.maxOtpAttempts
            ? "OTP_MAX_ATTEMPTS"
            : "OTP_INVALID",
      };
    }

    const user = await db.$transaction(async (transaction) => {
      const verifiedUser = await transaction.user.upsert({
        where: {
          email: normalizedEmail,
        },
        update: {
          lastLoginAt: new Date(),
        },
        create: {
          email: normalizedEmail,
          role: UserRole.STUDENT,
          lastLoginAt: new Date(),
        },
      });

      if (verifiedUser.role === UserRole.STUDENT) {
        await transaction.studentProfile.upsert({
          where: {
            userId: verifiedUser.id,
          },
          update: {},
          create: {
            userId: verifiedUser.id,
          },
        });
      }

      await transaction.emailOtpChallenge.update({
        where: {
          id: challenge.id,
        },
        data: {
          userId: verifiedUser.id,
          consumedAt: new Date(),
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: verifiedUser.id,
          action: AuditAction.OTP_VERIFIED,
          metadata: {
            email: maskEmail(normalizedEmail),
            channel: "email",
          },
        },
      });

      return verifiedUser;
    });

    return {
      success: true,
      userId: user.id,
      role: user.role,
    };
  } catch (cause) {
    if (canUseDevFallback() && isMissingEmailOtpTable(cause)) {
      return verifyDevEmailOTPChallenge(normalizedEmail, otp);
    }

    logger.error("auth.email-otp", "Email OTP verification failed", {
      cause,
      email: maskEmail(normalizedEmail),
    });

    return {
      success: false,
      error: "OTP_INVALID",
    };
  }
}
