import { env } from "@/lib/config/env";
import { logger } from "@/lib/logger";

export type EmailSendResult = {
  success: boolean;
  devOtp?: string;
  messageId?: string;
};

function getMessageId(body: unknown) {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const record = body as Record<string, unknown>;
  const candidate = record.id ?? record.messageId;

  if (typeof candidate === "string" || typeof candidate === "number") {
    return String(candidate);
  }

  return undefined;
}

export async function sendEmailOTP(email: string, otp: string): Promise<EmailSendResult> {
  if (env.EMAIL_USE_MOCK) {
    logger.info("email.mock", "Mock email OTP generated", {
      email,
      otp,
    });

    return {
      success: true,
      devOtp: otp,
      messageId: `mock-email-${Date.now()}`,
    };
  }

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    logger.error("email.gateway", "Email provider is not fully configured");
    return { success: false };
  }

  const subject = "Your Kinetic Academy verification code";
  const text = [
    `Your Kinetic Academy verification code is ${otp}.`,
    "It expires in 5 minutes.",
    "If you did not request this code, you can ignore this email.",
  ].join("\n\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: email,
        subject,
        text,
      }),
    });

    const responseText = await response.text();
    let responseBody: unknown;

    if (responseText) {
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = { raw: responseText };
      }
    }

    if (!response.ok) {
      logger.error("email.gateway", "Email provider request failed", {
        status: response.status,
        body: responseBody,
      });

      return { success: false };
    }

    const messageId = getMessageId(responseBody);

    logger.info("email.gateway", "OTP sent through email provider", {
      email,
      messageId,
    });

    return {
      success: true,
      messageId,
    };
  } catch (cause) {
    logger.error("email.gateway", "Email provider request errored", {
      cause,
    });

    return { success: false };
  }
}
