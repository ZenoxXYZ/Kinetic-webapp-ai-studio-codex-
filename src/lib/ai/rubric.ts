import type {
  ChatRequest,
  ChatResponse,
  FirstPrinciplesRequest,
  FirstPrinciplesResponse,
  FeynmanRequest,
  FeynmanResponse,
  SocraticEvaluateRequest,
  SocraticEvaluateResponse,
  SocraticRequest,
  SocraticResponse,
} from "@/lib/ai/schemas";

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "are",
  "you",
  "your",
  "about",
  "into",
  "করে",
  "হয়",
  "একটি",
  "তার",
]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function keywordCoverage(reference: string, answer: string) {
  const referenceTokens = Array.from(new Set(tokenize(reference))).slice(0, 18);
  const answerTokens = new Set(tokenize(answer));
  const matched = referenceTokens.filter((token) => answerTokens.has(token));
  const missing = referenceTokens.filter((token) => !answerTokens.has(token)).slice(0, 5);

  return {
    ratio: referenceTokens.length ? matched.length / referenceTokens.length : 0,
    missing,
  };
}

export function evaluateFeynmanLocally(input: FeynmanRequest): FeynmanResponse {
  const coverage = keywordCoverage(input.providedExplanation, input.userExplanation);
  const answerWords = tokenize(input.userExplanation).length;
  const hasExample = /example|ধর|যেমন|like|because|কারণ/i.test(input.userExplanation);
  const simpleLanguage = answerWords >= 18 && answerWords <= 180;
  const score = clampScore(coverage.ratio * 70 + (hasExample ? 16 : 0) + (simpleLanguage ? 14 : 4));
  const status = score >= 80 ? "GOOD" : score >= 50 ? "PARTIAL" : "POOR";

  return {
    score,
    missingConcepts: coverage.missing.map((concept) => `Mention "${concept}" clearly`),
    misconceptions:
      answerWords < 12
        ? ["Explanation is too short to prove real understanding"]
        : hasExample
          ? []
          : ["No concrete everyday example was used"],
    feedbackBangla:
      status === "GOOD"
        ? `দারুণ। তুমি ${input.topicTitle} সহজ ভাষায় explain করেছো এবং মূল idea ধরেছো। এখন একটা exam-style example দিয়ে আরো শক্ত করো।`
        : status === "PARTIAL"
          ? `ভালো শুরু। ${input.topicTitle} নিয়ে basic idea আছে, কিন্তু why/কেন অংশটা আরেকটু পরিষ্কার করতে হবে। একটা real-life example যোগ করো।`
          : `এখনও memorized লাগছে। ${input.topicTitle} নিজের ভাষায় box, rule, বা daily-life analogy দিয়ে আবার explain করো।`,
    status,
  };
}

export function createSocraticQuestionsLocally(input: SocraticRequest): SocraticResponse {
  return {
    questions: [
      `${input.topic} conceptটা exist করার দরকার কেন? কোন problem solve করতে এটা লাগে?`,
      `Under the hood ${input.topic} কীভাবে কাজ করে? Step-by-step mechanism বলো।`,
      `${input.topic} ভুল apply করলে বা boundary exceed করলে কী failure হতে পারে?`,
      `Alternative approach থাকলে ${input.topic} কেন better বা worse হতে পারে?`,
      `Extreme exam conditionে ${input.topic} test করতে চাইলে কী scenario বানাবে?`,
    ],
  };
}

export function evaluateSocraticLocally(input: SocraticEvaluateRequest): SocraticEvaluateResponse {
  const answerWords = tokenize(input.answer).length;
  const hasCausality = /because|কারণ|therefore|so|তাই|কেন/i.test(input.answer);
  const hasMechanism = /step|process|mechanism|works|কাজ|ধাপ|ভিতরে/i.test(input.answer);
  const defenseScore = clampScore(
    Math.min(answerWords, 80) * 0.8 + (hasCausality ? 20 : 0) + (hasMechanism ? 16 : 0),
  );

  return {
    logicGaps: [
      ...(hasCausality ? [] : ["Answer gives a claim but not the causal reason"]),
      ...(hasMechanism ? [] : ["Mechanism or step-by-step process is missing"]),
      ...(answerWords < 25 ? ["Answer is too brief for a defense-style response"] : []),
    ],
    defenseScore,
    feedbackBangla:
      defenseScore >= 75
        ? "সুন্দর logic defense। তুমি কারণ এবং mechanism দুটোই ধরেছো।"
        : "দিকটা ঠিক, কিন্তু answerটা আরো defensible করতে কারণ + mechanism + edge case যোগ করো।",
    idealAnswerBangla:
      "একটা strong answer প্রথমে conceptটার purpose বলে, তারপর ভিতরে কীভাবে কাজ করে তা step-by-step বুঝায়, এবং শেষে কোন case-এ fail করতে পারে সেটা বলে।",
  };
}

export function evaluateFirstPrinciplesLocally(
  input: FirstPrinciplesRequest,
): FirstPrinciplesResponse {
  const expected = tokenize(input.claim).slice(0, 8);
  const axiomText = input.axioms.join(" ");
  const coverage = keywordCoverage(expected.join(" "), axiomText);
  const passedAxioms = input.axioms.filter((axiom) => tokenize(axiom).length >= 4);
  const score = clampScore((passedAxioms.length / Math.max(input.axioms.length, 1)) * 55 + coverage.ratio * 45);
  const status = score >= 75 ? "PASSED" : score >= 45 ? "PARTIAL" : "FAILED";

  return {
    score,
    passedAxioms,
    missingAxioms: coverage.missing.map((item) => `Ground the idea around "${item}"`),
    synthesisFeedback:
      status === "PASSED"
        ? "Strong reconstruction. You moved from small truths toward the full claim."
        : "Break the claim into smaller observable truths before using formulas or memorized labels.",
    status,
  };
}

export function answerKinoLocally(input: ChatRequest): ChatResponse {
  const topic = input.activeTopic ?? "today's topic";
  const energy = input.workspaceState?.energy;
  const latestMessage = input.messages.at(-1)?.content ?? "";

  return {
    reply:
      latestMessage.toLowerCase().includes("wrong")
        ? "Your selected answer likely missed the key clue. Compare the wording of the wrong option with the exact condition in the question, then solve step by step before choosing."
        : energy !== undefined && energy < 30
          ? `তোমার energy কমে গেছে, so ${topic} নিয়ে 5-minute active recall করো। One tiny win is enough to protect momentum.`
          : `For ${topic}, আগে definition নয়, purpose বলো: এটা কেন লাগে? তারপর one example, one failure case. তাহলেই deep understanding হবে।`,
    suggestedAction: "Open Feynman mode and explain the concept in 60 seconds.",
  };
}
