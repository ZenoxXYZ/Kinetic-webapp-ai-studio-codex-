import { NextRequest } from "next/server";

import { enforceAiRateLimit, readJson } from "@/app/api/ai/_helpers";
import { generateGeminiImageJson } from "@/lib/ai/gemini";
import {
  photoGradeGeminiSchema,
  photoGradeRequestSchema,
  photoGradeResponseSchema,
  type PhotoGradeRequest,
  type PhotoGradeResponse,
} from "@/lib/ai/schemas";
import { error, success } from "@/lib/api/response";

function cleanBase64(value: string) {
  return value.replace(/^data:image\/(?:jpeg|png|webp);base64,/, "").trim();
}

function estimateBytes(base64: string) {
  return Math.ceil((base64.length * 3) / 4);
}

function buildFallbackGrade(input: PhotoGradeRequest): PhotoGradeResponse {
  return {
    score: 0,
    correct: [],
    wrong: [
      "Kinetic AI could not grade the handwriting automatically right now.",
      "Please retake a bright, uncropped photo and submit again.",
    ],
    explanation: `I could not reliably inspect the uploaded work against this rubric: ${input.rubric.slice(
      0,
      180,
    )}${input.rubric.length > 180 ? "..." : ""}`,
  };
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = enforceAiRateLimit(request, "photo-grade");

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { data, response } = await readJson(request, photoGradeRequestSchema);

  if (response) {
    return response;
  }

  if (!data) {
    return error("Invalid photo grading request", "VALIDATION_ERROR", 400);
  }

  const imageBase64 = cleanBase64(data.imageBase64);

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)) {
    return error("Image must be a valid base64 encoded JPEG, PNG, or WebP file.", "VALIDATION_ERROR", 400);
  }

  if (estimateBytes(imageBase64) > 6 * 1024 * 1024) {
    return error("Image is too large. Please upload an image under 6MB.", "VALIDATION_ERROR", 400);
  }

  const result = await generateGeminiImageJson({
    context: "ai:photo-grade",
    systemInstruction:
      "You are Kinetic AI, a strict but encouraging admission-prep evaluator. Grade the student's handwritten work from the image against the provided question or rubric. Return only valid JSON.",
    prompt: [
      "Grade this handwritten answer image.",
      `Question or rubric: ${data.rubric}`,
      "Return a score from 0 to 100.",
      "List what the student got correct.",
      "List what is wrong, missing, or unclear.",
      "Write one concise paragraph explaining how the student can improve.",
      "If the image is unreadable, give a low score and explain exactly what should be re-uploaded.",
    ].join("\n"),
    imageBase64,
    mimeType: data.mimeType,
    responseSchema: photoGradeGeminiSchema,
    validator: photoGradeResponseSchema,
    fallback: () => buildFallbackGrade(data),
  });

  return success(result);
}
