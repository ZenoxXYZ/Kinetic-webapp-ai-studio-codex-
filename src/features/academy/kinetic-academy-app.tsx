"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Flame,
  Gamepad2,
  GraduationCap,
  Loader2,
  Map,
  MessageCircle,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Toaster, toast } from "sonner";

import { battleOpponents, concepts, events, type Concept, type LearningStep } from "@/features/academy/learning-data";
import { cn } from "@/lib/utils";

type Tab = "learn" | "battle" | "mentors" | "kino";
type ApiState<T> = { status: "idle" | "loading" | "success" | "error"; data?: T; error?: string };

type ApiEnvelope<T> = {
  success: boolean;
  data?: {
    provider: string;
    model: string;
    data: T;
  };
  error?: { message: string; code: string };
};

type FeynmanResult = {
  score: number;
  missingConcepts: string[];
  misconceptions: string[];
  feedbackBangla: string;
  status: "GOOD" | "PARTIAL" | "POOR";
};

type SocraticChain = {
  questions: string[];
};

type SocraticEvaluation = {
  logicGaps: string[];
  defenseScore: number;
  feedbackBangla: string;
  idealAnswerBangla: string;
};

type FirstPrinciplesResult = {
  score: number;
  passedAxioms: string[];
  missingAxioms: string[];
  synthesisFeedback: string;
  status: "PASSED" | "PARTIAL" | "FAILED";
};

type KinoReply = {
  reply: string;
  suggestedAction?: string;
};

type BrowserSpeechRecognitionAlternative = {
  transcript: string;
};

type BrowserSpeechRecognitionResult = ArrayLike<BrowserSpeechRecognitionAlternative>;

type BrowserSpeechRecognitionEvent = {
  results: ArrayLike<BrowserSpeechRecognitionResult>;
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

async function postJson<TResponse>(url: string, body: unknown): Promise<ApiEnvelope<TResponse>> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as ApiEnvelope<TResponse>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error?.message ?? "Request failed");
  }

  return payload;
}

function ShellButton({
  children,
  className,
  variant = "primary",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[#1A56DB] text-white shadow-[0_0_24px_rgba(26,86,219,0.35)]",
        variant === "secondary" && "bg-emerald-500 text-white shadow-[0_0_24px_rgba(14,159,110,0.25)]",
        variant === "ghost" && "border border-slate-700 bg-slate-900 text-slate-100",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-[#1E293B] shadow-[0_18px_60px_rgba(2,6,23,0.35)]", className)}>
      {children}
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-900/70 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-black uppercase">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function LandingHero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative overflow-hidden px-5 py-8 sm:px-8 lg:px-10">
      <div className="absolute left-1/2 top-0 size-[34rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-100">
            <Sparkles className="size-4" />
            AI-powered cognitive admission prep for Bangladesh
          </div>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Kinetic Academy
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-8 text-slate-300">
              Learn ICT, Python, and admission reasoning through Feynman explanations, Socratic defense, first-principles reconstruction, and gamified battle loops.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ShellButton onClick={onStart} className="min-h-14 px-6 text-base">
              Enter Learning Lab
              <ChevronRight className="size-5" />
            </ShellButton>
            <ShellButton variant="ghost" onClick={() => document.getElementById("architecture")?.scrollIntoView({ behavior: "smooth" })} className="min-h-14 px-6 text-base">
              View System
              <ShieldCheck className="size-5" />
            </ShellButton>
          </div>
        </div>

        <Panel className="p-5">
          <div className="grid grid-cols-2 gap-3">
            <StatPill icon={<Flame className="size-4 text-orange-400" />} label="Streak" value="15 days" />
            <StatPill icon={<Zap className="size-4 text-amber-400" />} label="Energy" value="100" />
            <StatPill icon={<Trophy className="size-4 text-amber-400" />} label="Kinetic Score" value="450" />
            <StatPill icon={<Brain className="size-4 text-blue-300" />} label="AI Checks" value="3 modes" />
          </div>
          <div className="mt-5 rounded-2xl bg-slate-950/70 p-4">
            <p className="text-sm font-black text-blue-200">Today&apos;s quest</p>
            <p className="mt-2 text-xl font-black text-white">Explain XOR Gate simply</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
              <motion.div className="h-full rounded-full bg-[#1A56DB]" initial={{ width: 0 }} animate={{ width: "68%" }} transition={{ duration: 0.8 }} />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-400">Feynman → Socratic → First Principles</p>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function ConceptMap({
  selected,
  onSelect,
}: {
  selected: Concept;
  onSelect: (concept: Concept) => void;
}) {
  return (
    <Panel className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-blue-200">Course map</p>
          <h2 className="text-2xl font-black text-white">ICT + Python Foundations</h2>
        </div>
        <Map className="size-6 text-blue-300" />
      </div>
      <div className="grid gap-3">
        {concepts.map((concept, index) => (
          <motion.button
            key={concept.id}
            type="button"
            onClick={() => onSelect(concept)}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 text-left transition",
              selected.id === concept.id
                ? "border-blue-300 bg-blue-500/15 shadow-[0_0_24px_rgba(26,86,219,0.18)]"
                : "border-slate-700 bg-slate-950/40 hover:border-blue-500/50",
            )}
          >
            <div className={cn("grid size-11 place-items-center rounded-2xl font-black", selected.id === concept.id ? "bg-[#1A56DB] text-white" : "bg-slate-800 text-slate-300")}>
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-white">{concept.title}</p>
              <p className="truncate text-sm font-medium text-slate-400">{concept.summary}</p>
            </div>
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-black text-amber-200">
              -{concept.energyCost} energy
            </span>
          </motion.button>
        ))}
      </div>
    </Panel>
  );
}

function ExplanationStep({ concept }: { concept: Concept }) {
  return (
    <div className="space-y-4">
      <Panel className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-blue-200">{concept.subject}</p>
            <h2 className="mt-1 text-3xl font-black text-white">{concept.title}</h2>
            <p className="mt-3 text-base font-medium leading-8 text-slate-300">{concept.explanation}</p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-200">
            {concept.difficulty}
          </span>
        </div>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-3">
        {["Explain", "Inspect", "Defend"].map((item, index) => (
          <Panel key={item} className="p-4">
            <p className="text-sm font-black text-slate-400">Step {index + 1}</p>
            <p className="mt-1 text-lg font-black text-white">{item}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function SandboxStep({ concept }: { concept: Concept }) {
  const [active, setActive] = useState(0);
  const example = concept.examples[active];

  return (
    <Panel className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-blue-200">Interactive sandbox</p>
          <h2 className="text-2xl font-black text-white">Inspect the mechanism</h2>
        </div>
        <Activity className="size-6 text-emerald-300" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {concept.examples.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActive(index)}
            className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-black", active === index ? "bg-[#1A56DB] text-white" : "border border-slate-700 text-slate-300")}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-950 p-4">
          <p className="text-xs font-black uppercase text-slate-500">Input</p>
          <p className="mt-3 text-3xl font-black text-white">{example.input}</p>
        </div>
        <div className="rounded-2xl bg-slate-950 p-4">
          <p className="text-xs font-black uppercase text-slate-500">Output</p>
          <p className="mt-3 text-3xl font-black text-emerald-300">{example.output}</p>
        </div>
        <div className="rounded-2xl bg-blue-500/10 p-4">
          <p className="text-xs font-black uppercase text-blue-200">Why</p>
          <p className="mt-3 text-sm font-bold leading-6 text-blue-50">{example.annotation}</p>
        </div>
      </div>
    </Panel>
  );
}

function FeynmanStep({ concept }: { concept: Concept }) {
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<ApiState<FeynmanResult>>({ status: "idle" });

  const submit = async () => {
    setState({ status: "loading" });
    try {
      const payload = await postJson<FeynmanResult>("/api/ai/feynman", {
        topicTitle: concept.title,
        subject: concept.subject,
        providedExplanation: concept.explanation,
        userExplanation: answer,
      });
      setState({ status: "success", data: payload.data?.data });
      toast.success(`Feynman score: ${payload.data?.data.score}/100`);
    } catch (error) {
      setState({ status: "error", error: error instanceof Error ? error.message : "Failed" });
    }
  };

  const startVoice = () => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      toast.error("Speech recognition is not available in this browser.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "bn-BD";
    recognition.interimResults = false;
    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript)
        .filter(Boolean)
        .join(" ");
      setAnswer((value) => [value, transcript].filter(Boolean).join(" "));
    };
    recognition.onerror = () => toast.error("Voice capture failed. Please type instead.");
    recognition.start();
  };

  return (
    <Panel className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-blue-200">Feynman evaluator</p>
          <h2 className="text-2xl font-black text-white">Explain like you&apos;re teaching a classmate</h2>
        </div>
        <Brain className="size-6 text-blue-300" />
      </div>
      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Type in Bangla, English, or Banglish. Example: Binary means each position doubles..."
        className="min-h-40 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm font-bold leading-6 text-white outline-none focus:border-blue-400"
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <ShellButton variant="ghost" onClick={startVoice}>
          <Mic className="size-4" />
          Voice
        </ShellButton>
        <ShellButton disabled={answer.trim().length < 20 || state.status === "loading"} onClick={submit}>
          {state.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Evaluate
        </ShellButton>
      </div>
      {state.status === "success" && state.data ? (
        <ResultCard title={`Score ${state.data.score}/100 - ${state.data.status}`} tone="blue">
          <p>{state.data.feedbackBangla}</p>
          <GapList title="Missing concepts" items={state.data.missingConcepts} />
          <GapList title="Misconceptions" items={state.data.misconceptions} />
        </ResultCard>
      ) : null}
      {state.status === "error" ? <ErrorCard message={state.error ?? "Evaluation failed"} /> : null}
    </Panel>
  );
}

function SocraticStep({ concept }: { concept: Concept }) {
  const [chain, setChain] = useState<ApiState<SocraticChain>>({ status: "idle" });
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [evaluation, setEvaluation] = useState<ApiState<SocraticEvaluation>>({ status: "idle" });

  const generate = async () => {
    setChain({ status: "loading" });
    try {
      const payload = await postJson<SocraticChain>("/api/ai/socratic", {
        topic: concept.title,
        context: concept.explanation,
      });
      setChain({ status: "success", data: payload.data?.data });
    } catch (error) {
      setChain({ status: "error", error: error instanceof Error ? error.message : "Failed" });
    }
  };

  const evaluate = async (index: number) => {
    const question = chain.data?.questions[index];
    const answer = answers[index];
    if (!question || !answer) return;

    setEvaluation({ status: "loading" });
    try {
      const payload = await postJson<SocraticEvaluation>("/api/ai/socratic/evaluate", { question, answer });
      setEvaluation({ status: "success", data: payload.data?.data });
    } catch (error) {
      setEvaluation({ status: "error", error: error instanceof Error ? error.message : "Failed" });
    }
  };

  return (
    <Panel className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-blue-200">Socratic interrogation</p>
          <h2 className="text-2xl font-black text-white">Defend your model of thinking</h2>
        </div>
        <ShellButton disabled={chain.status === "loading"} onClick={generate}>
          {chain.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Generate
        </ShellButton>
      </div>
      {chain.status === "idle" ? (
        <p className="rounded-2xl bg-slate-950 p-4 text-sm font-bold leading-6 text-slate-300">
          Generate a five-question reasoning chain. Each question forces you to explain purpose, mechanism, failure, tradeoffs, and boundary scenarios.
        </p>
      ) : null}
      {chain.status === "success" && chain.data ? (
        <div className="space-y-4">
          {chain.data.questions.map((question, index) => (
            <div key={question} className="rounded-2xl bg-slate-950 p-4">
              <p className="text-sm font-black text-blue-200">Question {index + 1}</p>
              <p className="mt-2 font-bold leading-7 text-white">{question}</p>
              <textarea
                value={answers[index] ?? ""}
                onChange={(event) => setAnswers((value) => ({ ...value, [index]: event.target.value }))}
                placeholder="Defend your reasoning..."
                className="mt-3 min-h-24 w-full resize-none rounded-2xl border border-slate-700 bg-[#0F172A] p-3 text-sm font-bold text-white outline-none focus:border-blue-400"
              />
              <ShellButton className="mt-3" variant="ghost" disabled={!answers[index] || evaluation.status === "loading"} onClick={() => evaluate(index)}>
                Evaluate defense
              </ShellButton>
            </div>
          ))}
        </div>
      ) : null}
      {chain.status === "error" ? <ErrorCard message={chain.error ?? "Could not generate Socratic chain"} /> : null}
      {evaluation.status === "success" && evaluation.data ? (
        <ResultCard title={`Defense score ${evaluation.data.defenseScore}/100`} tone="emerald">
          <p>{evaluation.data.feedbackBangla}</p>
          <GapList title="Logic gaps" items={evaluation.data.logicGaps} />
          <p className="mt-3 rounded-2xl bg-slate-950 p-3 text-sm font-bold leading-6 text-slate-200">
            {evaluation.data.idealAnswerBangla}
          </p>
        </ResultCard>
      ) : null}
    </Panel>
  );
}

function FirstPrinciplesStep({ concept }: { concept: Concept }) {
  const [axioms, setAxioms] = useState<string[]>(concept.requiredAxioms.map(() => ""));
  const [state, setState] = useState<ApiState<FirstPrinciplesResult>>({ status: "idle" });

  const submit = async () => {
    setState({ status: "loading" });
    try {
      const payload = await postJson<FirstPrinciplesResult>("/api/ai/first-principles", {
        topic: concept.title,
        claim: concept.firstPrinciplesClaim,
        axioms,
      });
      setState({ status: "success", data: payload.data?.data });
    } catch (error) {
      setState({ status: "error", error: error instanceof Error ? error.message : "Failed" });
    }
  };

  return (
    <Panel className="p-5">
      <p className="text-sm font-black text-blue-200">First-principles reconstruction</p>
      <h2 className="mt-1 text-2xl font-black text-white">Build the concept from atomic truths</h2>
      <p className="mt-3 rounded-2xl bg-blue-500/10 p-4 text-sm font-bold leading-6 text-blue-100">
        Claim: {concept.firstPrinciplesClaim}
      </p>
      <div className="mt-4 space-y-3">
        {concept.requiredAxioms.map((hint, index) => (
          <label key={hint} className="block rounded-2xl bg-slate-950 p-4">
            <span className="text-xs font-black uppercase text-slate-500">Axiom {index + 1}</span>
            <input
              value={axioms[index]}
              onChange={(event) => setAxioms((items) => items.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
              placeholder={hint}
              className="mt-2 w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600"
            />
          </label>
        ))}
      </div>
      <ShellButton className="mt-4" disabled={axioms.some((axiom) => axiom.trim().length < 3) || state.status === "loading"} onClick={submit}>
        {state.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        Check reconstruction
      </ShellButton>
      {state.status === "success" && state.data ? (
        <ResultCard title={`First-principles score ${state.data.score}/100 - ${state.data.status}`} tone="amber">
          <p>{state.data.synthesisFeedback}</p>
          <GapList title="Passed axioms" items={state.data.passedAxioms} />
          <GapList title="Missing axioms" items={state.data.missingAxioms} />
        </ResultCard>
      ) : null}
      {state.status === "error" ? <ErrorCard message={state.error ?? "Could not check reconstruction"} /> : null}
    </Panel>
  );
}

function ResultCard({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "blue" | "emerald" | "amber";
  children: React.ReactNode;
}) {
  const color = tone === "blue" ? "border-blue-400/30 bg-blue-500/10 text-blue-50" : tone === "emerald" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-50" : "border-amber-400/30 bg-amber-500/10 text-amber-50";

  return (
    <div className={cn("mt-5 rounded-2xl border p-4 text-sm font-bold leading-6", color)}>
      <p className="mb-2 text-base font-black text-white">{title}</p>
      {children}
    </div>
  );
}

function GapList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;

  return (
    <div className="mt-3">
      <p className="text-xs font-black uppercase text-slate-300">{title}</p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-black text-red-100">
      {message}
    </div>
  );
}

function LearningLab() {
  const [selected, setSelected] = useState(concepts[0]);
  const [step, setStep] = useState<LearningStep>("explain");
  const steps: Array<{ id: LearningStep; label: string }> = [
    { id: "explain", label: "Explain" },
    { id: "sandbox", label: "Sandbox" },
    { id: "feynman", label: "Feynman" },
    { id: "socratic", label: "Socratic" },
    { id: "principles", label: "First Principles" },
  ];

  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[360px_1fr] lg:px-10">
      <ConceptMap selected={selected} onSelect={(concept) => { setSelected(concept); setStep("explain"); }} />
      <div className="space-y-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {steps.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStep(item.id)}
              className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-black", step === item.id ? "bg-[#1A56DB] text-white" : "border border-slate-700 text-slate-300")}
            >
              {item.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={`${selected.id}-${step}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {step === "explain" ? <ExplanationStep concept={selected} /> : null}
            {step === "sandbox" ? <SandboxStep concept={selected} /> : null}
            {step === "feynman" ? <FeynmanStep concept={selected} /> : null}
            {step === "socratic" ? <SocraticStep concept={selected} /> : null}
            {step === "principles" ? <FirstPrinciplesStep concept={selected} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function BattleArena() {
  const [result, setResult] = useState<{ opponent: string; user: number; opponentScore: number; outcome: string } | null>(null);

  const startBattle = () => {
    const opponent = battleOpponents[Math.floor(Math.random() * battleOpponents.length)];
    const user = 70 + Math.floor(Math.random() * 31);
    const opponentScore = 62 + Math.floor(Math.random() * 34);
    const outcome = user >= opponentScore ? "WIN" : "LOSS";
    setResult({ opponent: opponent.name, user, opponentScore, outcome });
    toast(outcome === "WIN" ? "+25 Kinetic Score" : "Review unlocked: weakness map updated");
  };

  return (
    <section className="mx-auto max-w-7xl px-5 py-6 lg:px-10">
      <Panel className="overflow-hidden p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-sm font-black text-red-200">
              <Swords className="size-4" />
              1v1 Battle Arena
            </div>
            <h2 className="mt-4 text-4xl font-black text-white">Defend your reasoning under pressure.</h2>
            <p className="mt-3 max-w-2xl text-base font-medium leading-8 text-slate-300">
              Simulated matchmaking runs a timed cognitive duel and produces score offsets. The data model is ready for WebSocket lobbies when live multiplayer launches.
            </p>
            <ShellButton className="mt-5" onClick={startBattle}>
              Start simulated clash
              <Gamepad2 className="size-5" />
            </ShellButton>
          </div>
          <div className="rounded-2xl bg-slate-950 p-5">
            {result ? (
              <div>
                <p className="text-sm font-black text-slate-400">Opponent</p>
                <p className="mt-1 text-2xl font-black text-white">{result.opponent}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <StatPill icon={<UserIcon />} label="You" value={String(result.user)} />
                  <StatPill icon={<Bot className="size-4 text-blue-300" />} label="Opponent" value={String(result.opponentScore)} />
                </div>
                <p className={cn("mt-5 rounded-2xl p-4 text-center text-xl font-black", result.outcome === "WIN" ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200")}>
                  {result.outcome}
                </p>
              </div>
            ) : (
              <p className="text-sm font-bold leading-7 text-slate-400">No active battle. Start a clash to simulate opponent matching, score calculation, and reward feedback.</p>
            )}
          </div>
        </div>
      </Panel>
    </section>
  );
}

function UserIcon() {
  return <GraduationCap className="size-4 text-emerald-300" />;
}

function MentorsAndEvents() {
  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[1fr_1fr] lg:px-10">
      <Panel className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-blue-200">Mentorship hub</p>
            <h2 className="text-2xl font-black text-white">Verified local winners</h2>
          </div>
          <Users className="size-6 text-blue-300" />
        </div>
        {["Nafisa Rahman - IBA DU - English RC", "Samin Chowdhury - BUET CSE - Logic", "Tashfia Karim - DU Econ - Quant"].map((mentor) => (
          <div key={mentor} className="mb-3 rounded-2xl bg-slate-950 p-4 last:mb-0">
            <p className="font-black text-white">{mentor}</p>
            <p className="mt-1 text-sm font-bold text-slate-400">⭐ 4.9 • 120+ sessions • ৳100 chat</p>
          </div>
        ))}
      </Panel>
      <Panel className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-blue-200">Events</p>
            <h2 className="text-2xl font-black text-white">Olympiads and live sprints</h2>
          </div>
          <Trophy className="size-6 text-amber-300" />
        </div>
        {events.map((event) => (
          <div key={event.title} className="mb-3 rounded-2xl bg-slate-950 p-4 last:mb-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-white">{event.title}</p>
                <p className="mt-1 text-sm font-bold text-slate-400">{event.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-200">{event.date}</span>
            </div>
          </div>
        ))}
      </Panel>
    </section>
  );
}

function KinoAssistant() {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<ApiState<KinoReply>>({ status: "idle" });

  const ask = async () => {
    setState({ status: "loading" });
    try {
      const payload = await postJson<KinoReply>("/api/ai/chat", {
        messages: [{ role: "user", content: message }],
        examType: "IBA",
        activeTopic: "Binary Place Value",
        workspaceState: { mode: "learning-lab", energy: 68, streak: 15 },
      });
      setState({ status: "success", data: payload.data?.data });
      setMessage("");
    } catch (error) {
      setState({ status: "error", error: error instanceof Error ? error.message : "Failed" });
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-5 py-6 lg:px-10">
      <Panel className="p-5">
        <div className="flex items-center gap-3">
          <div className="grid size-14 place-items-center rounded-2xl bg-blue-500/15 text-3xl">🤖</div>
          <div>
            <p className="text-sm font-black text-blue-200">Kino AI Assistant</p>
            <h2 className="text-2xl font-black text-white">Your cognitive coach</h2>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-sm font-bold leading-7 text-slate-300">
          {state.status === "success" && state.data ? (
            <>
              <p className="text-white">{state.data.reply}</p>
              {state.data.suggestedAction ? <p className="mt-3 text-blue-200">{state.data.suggestedAction}</p> : null}
            </>
          ) : state.status === "error" ? (
            <span className="text-red-200">{state.error}</span>
          ) : (
            "Ask Kino why a concept exists, where your answer is weak, or what to practice next."
          )}
        </div>
        <div className="mt-4 flex gap-3">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask: why does XOR reject both-true?"
            className="min-h-12 flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm font-bold text-white outline-none focus:border-blue-400"
          />
          <ShellButton disabled={!message.trim() || state.status === "loading"} onClick={ask}>
            {state.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
            Ask
          </ShellButton>
        </div>
      </Panel>
    </section>
  );
}

function ArchitectureSection() {
  return (
    <section id="architecture" className="mx-auto max-w-7xl px-5 py-8 lg:px-10">
      <Panel className="p-6">
        <p className="text-sm font-black text-blue-200">System architecture</p>
        <h2 className="mt-2 text-3xl font-black text-white">Server-only AI keys, validated APIs, scalable data model.</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ["Next.js", "App Router UI + route handlers"],
            ["Prisma", "Postgres source of truth"],
            ["Gemini", "Server-only structured JSON"],
            ["Security", "Zod, rate limits, JWT-ready auth"],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl bg-slate-950 p-4">
              <p className="font-black text-white">{title}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

export function KineticAcademyApp() {
  const [tab, setTab] = useState<Tab>("learn");
  const nav = useMemo(
    () => [
      { id: "learn" as const, label: "Learning Lab", icon: Brain },
      { id: "battle" as const, label: "Battle", icon: Swords },
      { id: "mentors" as const, label: "Mentors", icon: Users },
      { id: "kino" as const, label: "Kino", icon: Bot },
    ],
    [],
  );

  return (
    <main className="min-h-dvh bg-[#0F172A] text-white">
      <LandingHero onStart={() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" })} />
      <section id="workspace" className="sticky top-0 z-30 border-y border-white/10 bg-[#0B1222]/95 px-3 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn("flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black", active ? "bg-[#1A56DB] text-white" : "text-slate-400 hover:bg-slate-800")}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          {tab === "learn" ? <LearningLab /> : null}
          {tab === "battle" ? <BattleArena /> : null}
          {tab === "mentors" ? <MentorsAndEvents /> : null}
          {tab === "kino" ? <KinoAssistant /> : null}
        </motion.div>
      </AnimatePresence>
      <ArchitectureSection />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1E293B",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            borderRadius: "18px",
            fontWeight: 900,
          },
        }}
      />
    </main>
  );
}
