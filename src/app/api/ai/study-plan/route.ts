import { NextRequest } from "next/server";

import { generateGeminiJson } from "@/lib/ai/gemini";
import {
  studyPlanGeminiSchema,
  studyPlanRequestSchema,
  studyPlanResponseSchema,
  type StudyPlanRequest,
  type StudyPlanResponse,
} from "@/lib/ai/schemas";
import { error, success } from "@/lib/api/response";
import { enforceAiRateLimit, readJson } from "@/app/api/ai/_helpers";

function buildFallbackPlan(input: StudyPlanRequest): StudyPlanResponse {
  const workload =
    input.intensity === "sprint"
      ? "3 lessons + 35 questions"
      : input.intensity === "steady"
        ? "1 concept block + 12 questions"
        : "2 lessons + 20 questions";

  return {
    summary: `${input.exam} ${input.intensity} plan generated from your exam date, subjects, and daily exam time.`,
    days: Array.from({ length: 7 }, (_, index) => {
      const subject = input.subjects[index % input.subjects.length];

      return {
        day: index === 0 ? "Today" : `Day ${index + 1}`,
        title: subject,
        time: input.dailyExamTime,
        workload,
        exam: index === 6 ? "Weekly mock + mistake review" : `${subject} mini exam`,
        reminder:
          index === 6
            ? "Weekly examination reminder"
            : `Daily ${subject} examination reminder`,
      };
    }),
  };
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = enforceAiRateLimit(request, "study-plan");

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { data, response } = await readJson(request, studyPlanRequestSchema);

  if (response) {
    return response;
  }

  if (!data) {
    return error("Invalid study plan request", "VALIDATION_ERROR", 400);
  }

  const result = await generateGeminiJson({
    context: "ai:study-plan",
    systemInstruction:
      "You are Kinetic AI, a precise Bangladeshi admission prep planner. Return only valid JSON. Create a practical daily and weekly exam calendar. Keep workload realistic and reminders concise.",
    prompt: [
      `Exam: ${data.exam}`,
      `Exam date/time: ${data.examDateTime}`,
      `Daily exam time: ${data.dailyExamTime}`,
      `Subjects: ${data.subjects.join(", ")}`,
      `Intensity: ${data.intensity}`,
      `Current level: ${data.currentLevel}`,
      "Create 7 plan days. Include daily exam items and one weekly mock/review item.",
    ].join("\n"),
    responseSchema: studyPlanGeminiSchema,
    validator: studyPlanResponseSchema,
    fallback: () => buildFallbackPlan(data),
  });

  return success(result);
}
