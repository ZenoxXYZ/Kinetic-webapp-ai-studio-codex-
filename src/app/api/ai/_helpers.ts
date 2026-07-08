import { NextRequest } from "next/server";
import { z } from "zod";

import { error } from "@/lib/api/response";
import { rateLimit } from "@/lib/rate-limit";

export async function readJson<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
) {
  try {
    const body = await request.json();
    return { data: schema.parse(body), response: null };
  } catch (parseError) {
    const message =
      parseError instanceof z.ZodError
        ? parseError.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ")
        : "Request body must be valid JSON";

    return {
      data: null,
      response: error(message, "VALIDATION_ERROR", 400),
    };
  }
}

export function enforceAiRateLimit(request: NextRequest, route: string) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";
  const limit = rateLimit(`ai:${route}:${ip}`, 20, 60);

  if (!limit.success) {
    return error(
      `Too many AI requests. Try again after ${limit.resetAt.toISOString()}.`,
      "RATE_LIMITED",
      429,
    );
  }

  return null;
}
