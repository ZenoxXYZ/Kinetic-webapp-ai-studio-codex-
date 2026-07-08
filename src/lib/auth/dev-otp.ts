import { UserRole } from "@prisma/client";
import { randomInt } from "node:crypto";

import { appConfig } from "@/lib/config/app";
import { env, isProduction } from "@/lib/config/env";
import { logger } from "@/lib/logger";
import { sendOTP } from "@/lib/sms/gateway";

type DevOtpChallenge = {
  phone: string;
  otp: string;
  expiresAt: Date;
  attemptCount: number;
  createdAt: Date;
};

type DevOtpStore = Map<string, DevOtpChallenge>;

const storeKey = "__kineticDevOtpStore";

function getStore(): DevOtpStore {
  const globalStore = globalThis as typeof globalThis & {
    [storeKey]?: DevOtpStore;
  };

  globalStore[storeKey] ??= new Map();
  return globalStore[storeKey];
}

function createCode() {
  const max = 10 ** appConfig.auth.otpLength;

  return randomInt(0, max)
    .toString()
    .padStart(appConfig.auth.otpLength, "0");
}

export function canUseDevOtpFallback() {
  return env.SMS_USE_MOCK && !isProduction;
}

export function isDatabaseUnavailable(cause: unknown) {
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

export async function createDevOTPChallenge(phone: string) {
  const store = getStore();
  const existing = store.get(phone);
  const cooldownStart = Date.now() - appConfig.auth.otpCooldownSeconds * 1000;

  if (existing && existing.createdAt.getTime() >= cooldownStart) {
    return {
      success: false as const,
      error: "OTP_COOLDOWN" as const,
      expiresAt: existing.expiresAt,
    };
  }

  const otp = createCode();
  const expiresAt = new Date(Date.now() + appConfig.auth.otpExpiryMinutes * 60 * 1000);
  const smsResult = await sendOTP(phone, otp);

  if (!smsResult.success) {
    return {
      success: false as const,
      error: "SMS_DELIVERY_FAILED" as const,
    };
  }

  store.set(phone, {
    phone,
    otp,
    expiresAt,
    attemptCount: 0,
    createdAt: new Date(),
  });

  logger.warn("auth.dev-otp", "Using in-memory OTP fallback because database is unavailable", {
    phone,
    expiresAt,
  });

  return {
    success: true as const,
    expiresAt,
    devOtp: otp,
  };
}

export function verifyDevOTPChallenge(phone: string, otp: string) {
  const store = getStore();
  const challenge = store.get(phone);

  if (!challenge) {
    return {
      success: false as const,
      error: "OTP_INVALID" as const,
    };
  }

  if (challenge.expiresAt.getTime() <= Date.now()) {
    store.delete(phone);
    return {
      success: false as const,
      error: "OTP_EXPIRED" as const,
    };
  }

  if (challenge.attemptCount >= appConfig.auth.maxOtpAttempts) {
    store.delete(phone);
    return {
      success: false as const,
      error: "OTP_MAX_ATTEMPTS" as const,
    };
  }

  if (challenge.otp !== otp) {
    challenge.attemptCount += 1;

    if (challenge.attemptCount >= appConfig.auth.maxOtpAttempts) {
      store.delete(phone);
      return {
        success: false as const,
        error: "OTP_MAX_ATTEMPTS" as const,
      };
    }

    return {
      success: false as const,
      error: "OTP_INVALID" as const,
    };
  }

  store.delete(phone);

  return {
    success: true as const,
    user: {
      id: `dev-${phone}`,
      phone,
      role: UserRole.STUDENT,
      name: "Local Student",
    },
  };
}
