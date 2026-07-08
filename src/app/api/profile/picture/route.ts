import { NextRequest } from "next/server";
import { z } from "zod";

import { ERROR_CODES, error, success } from "@/lib/api/response";
import { saveProfilePicture } from "@/lib/profile/picture-store";
import { rateLimit } from "@/lib/rate-limit";

const profilePictureSchema = z.object({
  studentId: z.string().min(2).max(160),
  imageBase64: z
    .string()
    .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/, "Image must be a compressed JPEG data URL")
    .max(900_000, "Image is too large. Please choose a smaller image."),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";
  const limit = rateLimit(`profile-picture:${ip}`, 12, 60);

  if (!limit.success) {
    return error(
      `Too many profile picture updates. Try again after ${limit.resetAt.toISOString()}.`,
      ERROR_CODES.RATE_LIMITED,
      429,
    );
  }

  try {
    const body = await request.json();
    const parsed = profilePictureSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((issue) => issue.message).join("; "),
        ERROR_CODES.VALIDATION_ERROR,
        400,
      );
    }

    await saveProfilePicture(parsed.data.studentId, parsed.data.imageBase64);

    return success({
      studentId: parsed.data.studentId,
      imageBase64: parsed.data.imageBase64,
    });
  } catch {
    return error("Could not save profile picture.", ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
