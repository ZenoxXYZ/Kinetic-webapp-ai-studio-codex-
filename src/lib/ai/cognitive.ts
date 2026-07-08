import {
  answerKinoLocally,
  createSocraticQuestionsLocally,
  evaluateFeynmanLocally,
  evaluateFirstPrinciplesLocally,
  evaluateSocraticLocally,
} from "@/lib/ai/rubric";
import {
  chatGeminiSchema,
  chatResponseSchema,
  type ChatRequest,
  firstPrinciplesGeminiSchema,
  type FirstPrinciplesRequest,
  firstPrinciplesResponseSchema,
  feynmanGeminiSchema,
  type FeynmanRequest,
  feynmanResponseSchema,
  socraticEvaluateGeminiSchema,
  type SocraticEvaluateRequest,
  socraticEvaluateResponseSchema,
  socraticGeminiSchema,
  type SocraticRequest,
  socraticResponseSchema,
} from "@/lib/ai/schemas";
import { generateGeminiJson } from "@/lib/ai/gemini";

const mentorStyle =
  "You are Kino, a rigorous but warm Bangladeshi admission mentor. Use Bangla/Banglish naturally, keep English scientific keywords intact, avoid fluff, and return only valid JSON matching the schema.";

export async function evaluateFeynman(input: FeynmanRequest) {
  return generateGeminiJson({
    context: "ai:feynman",
    systemInstruction:
      `${mentorStyle} Grade whether the student can explain the concept simply enough for a younger learner. Reward examples, mechanism, and causal reasoning. Penalize memorized definitions.`,
    prompt: [
      `Topic: ${input.topicTitle}`,
      `Subject: ${input.subject}`,
      `Canonical explanation: ${input.providedExplanation}`,
      `Student explanation: ${input.userExplanation}`,
    ].join("\n\n"),
    responseSchema: feynmanGeminiSchema,
    validator: feynmanResponseSchema,
    fallback: () => evaluateFeynmanLocally(input),
  });
}

export async function createSocraticChain(input: SocraticRequest) {
  return generateGeminiJson({
    context: "ai:socratic",
    systemInstruction:
      `${mentorStyle} Create exactly five progressive Socratic questions: existence, mechanism, failure state, tradeoff, boundary scenario. Do not answer the questions.`,
    prompt: `Topic: ${input.topic}\nContext: ${input.context}`,
    responseSchema: socraticGeminiSchema,
    validator: socraticResponseSchema,
    fallback: () => createSocraticQuestionsLocally(input),
  });
}

export async function evaluateSocraticAnswer(input: SocraticEvaluateRequest) {
  return generateGeminiJson({
    context: "ai:socratic:evaluate",
    systemInstruction:
      `${mentorStyle} Evaluate the student's defense. Identify logic gaps, score reasoning quality, and provide an ideal answer in Bangla/Banglish.`,
    prompt: `Question: ${input.question}\nStudent answer: ${input.answer}`,
    responseSchema: socraticEvaluateGeminiSchema,
    validator: socraticEvaluateResponseSchema,
    fallback: () => evaluateSocraticLocally(input),
  });
}

export async function evaluateFirstPrinciples(input: FirstPrinciplesRequest) {
  return generateGeminiJson({
    context: "ai:first-principles",
    systemInstruction:
      `${mentorStyle} Check whether the student reconstructed the claim from atomic truths before formulas. Grade passed axioms, missing axioms, and synthesis quality.`,
    prompt: `Topic: ${input.topic}\nClaim: ${input.claim}\nAxioms:\n${input.axioms.map((axiom, index) => `${index + 1}. ${axiom}`).join("\n")}`,
    responseSchema: firstPrinciplesGeminiSchema,
    validator: firstPrinciplesResponseSchema,
    fallback: () => evaluateFirstPrinciplesLocally(input),
  });
}

export async function answerKino(input: ChatRequest) {
  const transcript = input.messages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n\n");

  return generateGeminiJson({
    context: "ai:kino-chat",
    systemInstruction:
      `${mentorStyle} Be concise. Diagnose the student's current workspace state and suggest one next action.`,
    prompt: `Exam type: ${input.examType ?? "unknown"}\nActive topic: ${input.activeTopic ?? "unknown"}\nWorkspace: ${JSON.stringify(input.workspaceState ?? {})}\nMessages:\n${transcript}`,
    responseSchema: chatGeminiSchema,
    validator: chatResponseSchema,
    fallback: () => answerKinoLocally(input),
  });
}
