import { NextRequest } from "next/server";

import { ERROR_CODES, error, success } from "@/lib/api/response";
import { getProfilePicture } from "@/lib/profile/picture-store";

type Params = {
  params: Promise<{
    studentId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  const { studentId } = await params;

  if (!studentId || studentId.length > 160) {
    return error("Invalid student ID.", ERROR_CODES.VALIDATION_ERROR, 400);
  }

  try {
    const imageBase64 = await getProfilePicture(decodeURIComponent(studentId));

    return success({
      studentId,
      imageBase64,
    });
  } catch {
    return error("Could not load profile picture.", ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
