import { z } from "zod";

export const feynmanRequestSchema = z.object({
  topicTitle: z.string().min(2).max(120),
  providedExplanation: z.string().min(20).max(2000),
  userExplanation: z.string().min(20).max(2500),
  subject: z.string().min(2).max(80),
});

export const feynmanResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  missingConcepts: z.array(z.string()).max(8),
  misconceptions: z.array(z.string()).max(8),
  feedbackBangla: z.string().min(1),
  status: z.enum(["GOOD", "PARTIAL", "POOR"]),
});

export const socraticRequestSchema = z.object({
  topic: z.string().min(2).max(120),
  context: z.string().min(10).max(2000),
});

export const socraticResponseSchema = z.object({
  questions: z.array(z.string().min(8)).length(5),
});

export const socraticEvaluateRequestSchema = z.object({
  question: z.string().min(8).max(800),
  answer: z.string().min(10).max(2000),
});

export const socraticEvaluateResponseSchema = z.object({
  logicGaps: z.array(z.string()).max(8),
  defenseScore: z.number().int().min(0).max(100),
  feedbackBangla: z.string().min(1),
  idealAnswerBangla: z.string().min(1),
});

export const firstPrinciplesRequestSchema = z.object({
  topic: z.string().min(2).max(120),
  claim: z.string().min(10).max(1000),
  axioms: z.array(z.string().min(3).max(300)).min(1).max(5),
});

export const firstPrinciplesResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  passedAxioms: z.array(z.string()).max(5),
  missingAxioms: z.array(z.string()).max(5),
  synthesisFeedback: z.string().min(1),
  status: z.enum(["PASSED", "PARTIAL", "FAILED"]),
});

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(3000),
      }),
    )
    .min(1)
    .max(12),
  examType: z.string().min(2).max(40).optional(),
  activeTopic: z.string().min(2).max(120).optional(),
  workspaceState: z
    .object({
      mode: z.string().max(80).optional(),
      energy: z.number().int().min(0).max(100).optional(),
      streak: z.number().int().min(0).optional(),
    })
    .optional(),
});

export const chatResponseSchema = z.object({
  reply: z.string().min(1),
  suggestedAction: z.string().min(1).optional(),
});

export const studyPlanRequestSchema = z.object({
  exam: z.string().min(2).max(80),
  examDateTime: z.string().min(10).max(40),
  dailyExamTime: z.string().regex(/^\d{2}:\d{2}$/),
  subjects: z.array(z.string().min(2).max(80)).min(1).max(8),
  intensity: z.enum(["steady", "balanced", "sprint"]),
  currentLevel: z.string().min(2).max(80).default("balanced"),
});

export const studyPlanDaySchema = z.object({
  day: z.string().min(1).max(40),
  title: z.string().min(2).max(120),
  time: z.string().min(4).max(20),
  workload: z.string().min(2).max(160),
  exam: z.string().min(2).max(160),
  reminder: z.string().min(2).max(160),
});

export const studyPlanResponseSchema = z.object({
  summary: z.string().min(1).max(300),
  days: z.array(studyPlanDaySchema).min(1).max(14),
});

export const dailyExamRequestSchema = z.object({
  topic: z.string().min(2).max(160),
  examType: z.string().min(2).max(80).default("IBA"),
  count: z.number().int().min(3).max(8).default(5),
  difficulty: z.enum(["easy", "balanced", "hard"]).default("balanced"),
});

export const dailyExamQuestionSchema = z.object({
  prompt: z.string().min(8).max(500),
  options: z.array(z.string().min(1).max(180)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(8).max(900),
  deeper: z.string().min(8).max(900),
  subject: z.string().min(2).max(120),
  source: z.string().min(2).max(120),
  difficulty: z.enum(["green", "orange", "red"]),
});

export const dailyExamResponseSchema = z.object({
  title: z.string().min(2).max(160),
  questions: z.array(dailyExamQuestionSchema).min(3).max(8),
});

export type FeynmanRequest = z.infer<typeof feynmanRequestSchema>;
export type FeynmanResponse = z.infer<typeof feynmanResponseSchema>;
export type SocraticRequest = z.infer<typeof socraticRequestSchema>;
export type SocraticResponse = z.infer<typeof socraticResponseSchema>;
export type SocraticEvaluateRequest = z.infer<typeof socraticEvaluateRequestSchema>;
export type SocraticEvaluateResponse = z.infer<typeof socraticEvaluateResponseSchema>;
export type FirstPrinciplesRequest = z.infer<typeof firstPrinciplesRequestSchema>;
export type FirstPrinciplesResponse = z.infer<typeof firstPrinciplesResponseSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type StudyPlanRequest = z.infer<typeof studyPlanRequestSchema>;
export type StudyPlanResponse = z.infer<typeof studyPlanResponseSchema>;
export type DailyExamRequest = z.infer<typeof dailyExamRequestSchema>;
export type DailyExamResponse = z.infer<typeof dailyExamResponseSchema>;

export const feynmanGeminiSchema = {
  type: "OBJECT",
  properties: {
    score: { type: "INTEGER" },
    missingConcepts: { type: "ARRAY", items: { type: "STRING" } },
    misconceptions: { type: "ARRAY", items: { type: "STRING" } },
    feedbackBangla: { type: "STRING" },
    status: { type: "STRING", enum: ["GOOD", "PARTIAL", "POOR"] },
  },
  required: ["score", "missingConcepts", "misconceptions", "feedbackBangla", "status"],
};

export const socraticGeminiSchema = {
  type: "OBJECT",
  properties: {
    questions: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["questions"],
};

export const socraticEvaluateGeminiSchema = {
  type: "OBJECT",
  properties: {
    logicGaps: { type: "ARRAY", items: { type: "STRING" } },
    defenseScore: { type: "INTEGER" },
    feedbackBangla: { type: "STRING" },
    idealAnswerBangla: { type: "STRING" },
  },
  required: ["logicGaps", "defenseScore", "feedbackBangla", "idealAnswerBangla"],
};

export const firstPrinciplesGeminiSchema = {
  type: "OBJECT",
  properties: {
    score: { type: "INTEGER" },
    passedAxioms: { type: "ARRAY", items: { type: "STRING" } },
    missingAxioms: { type: "ARRAY", items: { type: "STRING" } },
    synthesisFeedback: { type: "STRING" },
    status: { type: "STRING", enum: ["PASSED", "PARTIAL", "FAILED"] },
  },
  required: ["score", "passedAxioms", "missingAxioms", "synthesisFeedback", "status"],
};

export const chatGeminiSchema = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    suggestedAction: { type: "STRING" },
  },
  required: ["reply"],
};


export const studyPlanGeminiSchema = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    days: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          day: { type: "STRING" },
          title: { type: "STRING" },
          time: { type: "STRING" },
          workload: { type: "STRING" },
          exam: { type: "STRING" },
          reminder: { type: "STRING" },
        },
        required: ["day", "title", "time", "workload", "exam", "reminder"],
      },
    },
  },
  required: ["summary", "days"],
};

export const dailyExamGeminiSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          prompt: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" } },
          correctIndex: { type: "INTEGER" },
          explanation: { type: "STRING" },
          deeper: { type: "STRING" },
          subject: { type: "STRING" },
          source: { type: "STRING" },
          difficulty: { type: "STRING", enum: ["green", "orange", "red"] },
        },
        required: [
          "prompt",
          "options",
          "correctIndex",
          "explanation",
          "deeper",
          "subject",
          "source",
          "difficulty",
        ],
      },
    },
  },
  required: ["title", "questions"],
};
