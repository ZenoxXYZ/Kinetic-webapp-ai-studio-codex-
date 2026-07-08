import { randomInt } from "node:crypto";
import { z } from "zod";

import { ERROR_CODES, error, success } from "@/lib/api/response";
import { createEmailOTPChallenge } from "@/lib/auth/email-otp";
import {
  setEmailOtpCookie,
  signEmailOtpChallenge,
} from "@/lib/auth/stateless-email-otp";
import { appConfig } from "@/lib/config/app";
import { hasConfiguredDatabase } from "@/lib/config/env";
import { sendEmailOTP } from "@/lib/email/gateway";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  email: z.string().email("Enter a valid email address").max(160),
});

function generateEmailOtp() {
  const max = 10 ** appConfig.auth.otpLength;

  return randomInt(0, max)
    .toString()
    .padStart(appConfig.auth.otpLength, "0");
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    logger.warn("api.auth.email.request", "Invalid JSON body");
    return error("Invalid JSON body", ERROR_CODES.VALIDATION_ERROR, 400);
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn("api.auth.email.request", "Validation failed", {
      issues: parsed.error.issues,
    });

    return error(
      parsed.error.issues[0]?.message ?? "Invalid request body",
      ERROR_CODES.VALIDATION_ERROR,
      400,
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const limit = rateLimit(`email-otp-request:${email}`, 3, 10 * 60);

  if (!limit.success) {
    return error(
      "Too many email OTP requests. Please try again later.",
      ERROR_CODES.RATE_LIMITED,
      429,
    );
  }

  if (!hasConfiguredDatabase) {
    const otp = generateEmailOtp();
    const emailResult = await sendEmailOTP(email, otp);

    if (!emailResult.success) {
      return error(
        "Could not send email OTP. Please check email configuration and try again.",
        ERROR_CODES.INTERNAL_ERROR,
        502,
      );
    }

    const token = await signEmailOtpChallenge(email, otp);
    const response = success({
      expiresAt: new Date(Date.now() + appConfig.auth.otpExpiryMinutes * 60 * 1000),
      devOtp: emailResult.devOtp,
    });

    setEmailOtpCookie(response, token);

    return response;
  }

  const result = await createEmailOTPChallenge(email);

  if (!result.success) {
    if (result.error === "OTP_COOLDOWN") {
      return error(
        "Please wait before requesting another email OTP.",
        ERROR_CODES.RATE_LIMITED,
        429,
      );
    }

    if (result.error === "EMAIL_DELIVERY_FAILED") {
      return error(
        "Could not send email OTP. Please check email configuration and try again.",
        ERROR_CODES.INTERNAL_ERROR,
        502,
      );
    }

    return error("Could not create email OTP challenge.", ERROR_CODES.INTERNAL_ERROR, 500);
  }

  return success({
    expiresAt: result.expiresAt,
    devOtp: result.devOtp,
  });
}
