"use client";

import { motion } from "framer-motion";
import {
  Atom,
  Bot,
  CheckCircle2,
  ChevronRight,
  Circle,
  HelpCircle,
  Loader2,
  Lock,
  Mic,
  PenLine,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } };

type TopicNode = {
  id: string;
  name: string;
  slug: string;
  order: number;
  questionCount: number;
  learningProgress: Array<{ status: string; xpEarned: number }>;
};

type QuestionOption = {
  id: string;
  label: string;
  text: string;
};

type Question = {
  id: string;
  text: string;
  explanation: string;
  topic?: { id: string; name: string } | null;
  subject?: { id: string; name: string };
  options: QuestionOption[];
};

const stages = [
  "Topic Introduction",
  "Visual Interactive Lesson",
  "Socratic Mode",
  "Feynman Technique",
  "First-Principles Builder",
  "Active Recall",
  "Adaptive Quiz",
  "Interview Unlock",
];

export function LearningStudio() {
  const [topics, setTopics] = useState<TopicNode[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stage, setStage] = useState(0);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [studentText, setStudentText] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState("");

  useEffect(() => {
    let isActive = true;

    async function load() {
      const [roadmapResponse, questionResponse] = await Promise.all([
        fetch("/api/learning/roadmap", { cache: "no-store" }),
        fetch("/api/questions?examType=IBA&limit=10", { cache: "no-store" }),
      ]);
      const [roadmap, questionPayload] = (await Promise.all([
        roadmapResponse.json(),
        questionResponse.json(),
      ])) as [
        ApiResponse<{
          examTarget: {
            subjects: Array<{
              chapters: Array<{ topics: TopicNode[] }>;
            }>;
          } | null;
        }>,
        ApiResponse<{ questions: Question[] }>,
      ];

      if (!isActive) return;

      if (roadmap.success) {
        const loadedTopics =
          roadmap.data.examTarget?.subjects.flatMap((subject) =>
            subject.chapters.flatMap((chapter) => chapter.topics),
          ) ?? [];
        setTopics(loadedTopics);
        setSelectedTopicId(loadedTopics[0]?.id ?? null);
      }

      if (questionPayload.success) {
        setQuestions(questionPayload.data.questions);
      }

      setLoading(false);
    }

    void load();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId) ?? topics[0],
    [selectedTopicId, topics],
  );
  const activeQuestion =
    questions.find((question) => question.topic?.id === selectedTopic?.id) ??
    questions[0];
  const selectedOption = activeQuestion?.options.find(
    (option) => option.id === selectedOptionId,
  );

  async function markProgress(nextStage = stage + 1, extra?: { feynmanScore?: number; socraticScore?: number }) {
    if (!selectedTopic) return;

    await fetch("/api/learning/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId: selectedTopic.id,
        status: nextStage >= stages.length - 1 ? "PASSED" : "UNATTEMPTED",
        energySpent: 8,
        xpEarned: 10,
        ...extra,
      }),
    });
  }

  async function runSocratic() {
    if (!selectedTopic) return;
    setThinking(true);
    setAiResult("");
    const response = await fetch("/api/ai/socratic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: selectedTopic.name,
        context: studentText || `Student is learning ${selectedTopic.name}.`,
      }),
    });
    const payload = (await response.json()) as ApiResponse<{
      data: { questions: string[] };
    }>;
    if (payload.success) {
      setAiResult(payload.data.data.questions.join("\n\n"));
      await markProgress(stage + 1, { socraticScore: 72 });
    }
    setThinking(false);
  }

  async function runFeynman() {
    if (!selectedTopic) return;
    setThinking(true);
    setAiResult("");
    const response = await fetch("/api/ai/feynman", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicTitle: selectedTopic.name,
        providedExplanation: activeQuestion?.explanation ?? `Core explanation for ${selectedTopic.name}.`,
        userExplanation: studentText,
        subject: activeQuestion?.subject?.name ?? "Admission Prep",
      }),
    });
    const payload = (await response.json()) as ApiResponse<{
      data: { score: number; feedbackBangla: string; missingConcepts: string[] };
    }>;
    if (payload.success) {
      setAiResult(
        `Score: ${payload.data.data.score}/100\n\n${payload.data.data.feedbackBangla}\n\nMissing: ${payload.data.data.missingConcepts.join(", ") || "None"}`,
      );
      await markProgress(stage + 1, { feynmanScore: payload.data.data.score });
    }
    setThinking(false);
  }

  async function runFirstPrinciples() {
    if (!selectedTopic) return;
    setThinking(true);
    setAiResult("");
    const response = await fetch("/api/ai/first-principles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: selectedTopic.name,
        claim: activeQuestion?.explanation ?? `Rebuild ${selectedTopic.name} from first principles.`,
        axioms: studentText.split("\n").filter(Boolean).slice(0, 5),
      }),
    });
    const payload = (await response.json()) as ApiResponse<{
      data: { score: number; synthesisFeedback: string; missingAxioms: string[] };
    }>;
    if (payload.success) {
      setAiResult(
        `Score: ${payload.data.data.score}/100\n\n${payload.data.data.synthesisFeedback}\n\nMissing atoms: ${payload.data.data.missingAxioms.join(", ") || "None"}`,
      );
      await markProgress(stage + 1);
    }
    setThinking(false);
  }

  async function submitQuiz(optionId: string) {
    if (!activeQuestion) return;
    setSelectedOptionId(optionId);
    const response = await fetch(`/api/questions/${activeQuestion.id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedOptionId: optionId, mode: "CHAPTER_DRILL" }),
    });
    const payload = (await response.json()) as ApiResponse<{
      result: { isCorrect: boolean; explanation: string; xpEarned: number };
    }>;
    if (payload.success) {
      setQuizFeedback(
        `${payload.data.result.isCorrect ? "Correct" : "Needs review"} • +${payload.data.result.xpEarned} XP\n${payload.data.result.explanation}`,
      );
      await markProgress(stage + 1);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="size-8 animate-spin text-[#93C5FD]" />
      </div>
    );
  }

  if (!selectedTopic) {
    return (
      <div className="rounded-[2rem] border-2 border-dashed border-white/10 bg-[#1E293B] p-6 text-center text-slate-300">
        No topic roadmap found. Run the Prisma seed after migration to populate lessons.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border-2 border-white/10 bg-gradient-to-br from-indigo-600 to-[#0F172A] p-5">
        <p className="text-sm font-bold text-indigo-100">Learn it. Teach it. Prove it.</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-white">
          {selectedTopic.name}
        </h1>
        <p className="mt-2 text-sm leading-6 text-indigo-100">
          Kino will guide you through an eight-stage mastery protocol.
        </p>
      </section>

      <section className="no-scrollbar flex gap-2 overflow-x-auto">
        {stages.map((label, index) => {
          const isCurrent = index === stage;
          const isComplete = index < stage;

          return (
            <button
              key={label}
              onClick={() => setStage(index)}
              className={`min-w-[9rem] rounded-2xl border-2 p-3 text-left text-xs font-black transition ${
                isCurrent
                  ? "scale-105 border-indigo-300 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/20"
                  : isComplete
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-[#1E293B] text-slate-400"
              }`}
            >
              <div className="mb-2">
                {isComplete ? <CheckCircle2 className="size-4" /> : isCurrent ? <Circle className="size-4" /> : <Lock className="size-4" />}
              </div>
              {index + 1}. {label}
            </button>
          );
        })}
      </section>

      <motion.section
        key={stage}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-5"
      >
        {stage === 0 ? (
          <StageIntro topic={selectedTopic.name} onContinue={() => setStage(1)} />
        ) : null}
        {stage === 1 ? (
          <StageVisualLesson question={activeQuestion} onContinue={() => setStage(2)} />
        ) : null}
        {stage === 2 ? (
          <StageAi
            title="Socratic Mode"
            icon={<HelpCircle className="size-6 text-cyan-200" />}
            placeholder="Answer Kino's current question..."
            studentText={studentText}
            aiResult={aiResult}
            thinking={thinking}
            onText={setStudentText}
            onSubmit={runSocratic}
            onContinue={() => setStage(3)}
          />
        ) : null}
        {stage === 3 ? (
          <StageAi
            title="Feynman Technique"
            icon={<PenLine className="size-6 text-amber-200" />}
            placeholder="Explain it to a 10-year-old in 50-300 words..."
            studentText={studentText}
            aiResult={aiResult}
            thinking={thinking}
            onText={setStudentText}
            onSubmit={runFeynman}
            onContinue={() => setStage(4)}
          />
        ) : null}
        {stage === 4 ? (
          <StageAi
            title="Rebuild from the Atom"
            icon={<Atom className="size-6 text-violet-200" />}
            placeholder="Write one atomic truth per line..."
            studentText={studentText}
            aiResult={aiResult}
            thinking={thinking}
            onText={setStudentText}
            onSubmit={runFirstPrinciples}
            onContinue={() => setStage(5)}
          />
        ) : null}
        {stage === 5 ? (
          <StageRecall question={activeQuestion} onContinue={() => setStage(6)} />
        ) : null}
        {stage === 6 ? (
          <StageQuiz
            question={activeQuestion}
            selectedOption={selectedOption}
            feedback={quizFeedback}
            onSubmit={submitQuiz}
            onContinue={() => setStage(7)}
          />
        ) : null}
        {stage === 7 ? <StageInterviewUnlock /> : null}
      </motion.section>
    </div>
  );
}

function StageIntro({ topic, onContinue }: { topic: string; onContinue: () => void }) {
  return (
    <div>
      <Bot className="mb-4 size-8 text-cyan-200" />
      <h2 className="text-2xl font-black text-white">Why does {topic} matter?</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        Before learning the rule, predict where this idea appears in exams, interviews, or real decisions.
      </p>
      <Input className="mt-5 border-slate-700 bg-slate-950/40 text-white" placeholder="My prediction..." />
      <div className="mt-5 grid gap-3">
        {["Exam traps", "Real-world reasoning", "Interview defense"].map((item) => (
          <div key={item} className="rounded-2xl bg-slate-950/35 p-4 text-sm font-bold text-slate-200">
            {item}
          </div>
        ))}
      </div>
      <Button onClick={onContinue} className="mt-5 h-12 w-full">Reveal Topic Map</Button>
    </div>
  );
}

function StageVisualLesson({ question, onContinue }: { question?: Question; onContinue: () => void }) {
  return (
    <div>
      <Sparkles className="mb-4 size-8 text-[#F59E0B]" />
      <h2 className="text-2xl font-black text-white">Visual Interactive Lesson</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        {question?.explanation ?? "No lesson seed is available for this topic yet."}
      </p>
      <div className="mt-5 rounded-[2rem] border-2 border-blue-400/30 bg-blue-400/10 p-5">
        <p className="text-sm font-black text-blue-100">Checkpoint</p>
        <p className="mt-2 text-sm leading-6 text-slate-200">{question?.text ?? "Add questions to unlock checkpoints."}</p>
      </div>
      <Button onClick={onContinue} className="mt-5 h-12 w-full">Continue to Socratic Mode</Button>
    </div>
  );
}

function StageAi({
  title,
  icon,
  placeholder,
  studentText,
  aiResult,
  thinking,
  onText,
  onSubmit,
  onContinue,
}: {
  title: string;
  icon: ReactNode;
  placeholder: string;
  studentText: string;
  aiResult: string;
  thinking: boolean;
  onText: (value: string) => void;
  onSubmit: () => void;
  onContinue: () => void;
}) {
  const wordCount = studentText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div>
      <div className="mb-4">{icon}</div>
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <textarea
        value={studentText}
        onChange={(event) => onText(event.target.value)}
        placeholder={placeholder}
        className="mt-5 min-h-40 w-full rounded-[2rem] border-2 border-slate-700 bg-slate-950/40 p-4 text-sm leading-7 text-white outline-none focus:border-[#1A56DB]"
      />
      <div className="mt-2 text-right text-xs font-bold text-slate-400">{wordCount} words</div>
      <Button onClick={onSubmit} disabled={thinking || studentText.trim().length < 10} className="mt-4 h-12 w-full">
        {thinking ? <Loader2 className="animate-spin" /> : null}
        Ask Kino
      </Button>
      {aiResult ? (
        <div className="mt-5 whitespace-pre-line rounded-[2rem] border-2 border-cyan-400/30 bg-cyan-400/10 p-5 text-sm leading-7 text-cyan-50">
          {aiResult}
          <Button onClick={onContinue} className="mt-5 h-12 w-full">Continue</Button>
        </div>
      ) : null}
    </div>
  );
}

function StageRecall({ question, onContinue }: { question?: Question; onContinue: () => void }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-white">Active Recall</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        Close the explanation and reconstruct the answer from memory.
      </p>
      <div className="mt-5 rounded-[2rem] border-2 border-amber-400/30 bg-amber-400/10 p-5 text-sm leading-7 text-amber-50">
        {question?.text ?? "No recall prompt is available yet."}
      </div>
      <Button onClick={onContinue} className="mt-5 h-12 w-full">I recalled it</Button>
    </div>
  );
}

function StageQuiz({
  question,
  selectedOption,
  feedback,
  onSubmit,
  onContinue,
}: {
  question?: Question;
  selectedOption?: QuestionOption;
  feedback: string;
  onSubmit: (optionId: string) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-black text-white">Adaptive Quiz</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">{question?.text ?? "No quiz question available."}</p>
      <div className="mt-5 space-y-3">
        {question?.options.map((option) => (
          <button
            key={option.id}
            disabled={Boolean(selectedOption)}
            onClick={() => onSubmit(option.id)}
            className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left text-sm font-bold ${
              selectedOption?.id === option.id
                ? "border-[#1A56DB] bg-blue-500/20 text-white"
                : "border-white/10 bg-slate-950/35 text-slate-200"
            }`}
          >
            <span>{option.label}</span>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
      {feedback ? (
        <div className="mt-5 whitespace-pre-line rounded-[2rem] border-2 border-[#F59E0B] bg-amber-400/10 p-5 text-sm leading-7 text-amber-50">
          {feedback}
          <Button onClick={onContinue} className="mt-5 h-12 w-full">Unlock Interview</Button>
        </div>
      ) : null}
    </div>
  );
}

function StageInterviewUnlock() {
  return (
    <div className="text-center">
      <Mic className="mx-auto mb-5 size-12 text-[#F59E0B]" />
      <h2 className="text-3xl font-black text-white">Interview Mode Unlocked</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        You have moved from recall to defense. Practice under pressure in the interview center.
      </p>
      <a
        href="/interview"
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1A56DB] text-sm font-black text-white shadow-lg shadow-blue-500/20"
      >
        Open Interview Center
        <ChevronRight className="size-4" />
      </a>
    </div>
  );
}
