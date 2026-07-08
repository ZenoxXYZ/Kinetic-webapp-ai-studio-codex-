import { NextRequest } from "next/server";

import { enforceAiRateLimit, readJson } from "@/app/api/ai/_helpers";
import { generateGeminiJson } from "@/lib/ai/gemini";
import {
  dailyExamGeminiSchema,
  dailyExamRequestSchema,
  dailyExamResponseSchema,
  type DailyExamRequest,
  type DailyExamResponse,
} from "@/lib/ai/schemas";
import { error, success } from "@/lib/api/response";

function buildFallbackExam(input: DailyExamRequest): DailyExamResponse {
  const subjects = [
    input.topic,
    "English RC",
    "Quantitative",
    "Analytical",
    "General Knowledge",
    "Mistake Review",
    "Speed Practice",
    "Concept Check",
  ];

  return {
    title: `${input.examType} ${input.topic} AI Exam`,
    questions: Array.from({ length: input.count }, (_, index) => {
      const subject = subjects[index % subjects.length];
      const difficulty = input.difficulty === "hard" ? "red" : input.difficulty === "easy" ? "green" : "orange";

      return {
        prompt: `Practice checkpoint ${index + 1}: Which option best fits ${subject}?`,
        options: [
          `${subject} core rule`,
          `${subject} unrelated detail`,
          `${subject} common trap`,
          `${subject} incomplete answer`,
        ],
        correctIndex: 0,
        explanation: `The correct answer focuses on the core rule for ${subject}, which is what this checkpoint is testing.`,
        deeper: `Review the mistake pattern, then solve two similar questions before moving to the next topic.`,
        subject,
        source: `${input.examType} AI Practice`,
        difficulty,
      };
    }),
  };
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = enforceAiRateLimit(request, "daily-exam");

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { data, response } = await readJson(request, dailyExamRequestSchema);

  if (response) {
    return response;
  }

  if (!data) {
    return error("Invalid daily exam request", "VALIDATION_ERROR", 400);
  }

  const result = await generateGeminiJson({
    context: "ai:daily-exam",
    systemInstruction:
      "You are Kinetic AI, an admission-test question writer for Bangladeshi students. Return only valid JSON. Generate original MCQ practice questions with exactly four options and one correct index. Explanations must be concise and useful.",
    prompt: [
      `Exam type: ${data.examType}`,
      `Topic: ${data.topic}`,
      `Question count: ${data.count}`,
      `Difficulty: ${data.difficulty}`,
      "Create original admission-style MCQs. Use green/orange/red difficulty labels. Avoid copyrighted past-paper wording.",
    ].join("\n"),
    responseSchema: dailyExamGeminiSchema,
    validator: dailyExamResponseSchema,
    fallback: () => buildFallbackExam(data),
  });

  return success(result);
}
