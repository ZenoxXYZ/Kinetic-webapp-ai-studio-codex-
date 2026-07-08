import { jwtVerify, SignJWT } from "jose";
import type { NextRequest, NextResponse } from "next/server";

import { appConfig } from "@/lib/config/app";
import { env, isProduction } from "@/lib/config/env";

export const EMAIL_OTP_COOKIE_NAME = "kinetic_email_otp";
const EMAIL_OTP_MAX_AGE_SECONDS = appConfig.auth.otpExpiryMinutes * 60;

type EmailOtpPayload = {
  email: string;
  otp: string;
  purpose: "email-sign-in";
};

const getSecret = () => new TextEncoder().encode(env.JWT_SECRET);

export async function signEmailOtpChallenge(email: string, otp: string) {
  return new SignJWT({
    email,
    otp,
    purpose: "email-sign-in",
  } satisfies EmailOtpPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EMAIL_OTP_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyEmailOtpChallengeToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (
      payload.purpose !== "email-sign-in" ||
      typeof payload.email !== "string" ||
      typeof payload.otp !== "string"
    ) {
      return null;
    }

    return {
      email: payload.email,
      otp: payload.otp,
    };
  } catch {
    return null;
  }
}

export function setEmailOtpCookie(response: NextResponse, token: string) {
  response.cookies.set(EMAIL_OTP_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: EMAIL_OTP_MAX_AGE_SECONDS,
  });

  return response;
}

export function clearEmailOtpCookie(response: NextResponse) {
  response.cookies.set(EMAIL_OTP_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export function getEmailOtpCookie(request: NextRequest) {
  return request.cookies.get(EMAIL_OTP_COOKIE_NAME)?.value;
}
