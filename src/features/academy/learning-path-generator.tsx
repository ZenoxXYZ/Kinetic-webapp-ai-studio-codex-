"use client";

import { motion } from "framer-motion";
import { FileText, Link as LinkIcon, Loader2, Sparkles, Type } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Tab = "topic" | "link" | "pdf";

type LearningPathItem = {
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } };

const tabs = [
  { id: "topic" as const, label: "Type a Topic", icon: Type },
  { id: "link" as const, label: "Paste a Link", icon: LinkIcon },
  { id: "pdf" as const, label: "Upload PDF", icon: FileText },
];

function getDifficultyClass(difficulty: LearningPathItem["difficulty"]) {
  if (difficulty === "beginner") {
    return "bg-emerald-400/15 text-emerald-200";
  }

  if (difficulty === "intermediate") {
    return "bg-amber-400/15 text-[#F59E0B]";
  }

  return "bg-red-400/15 text-red-200";
}

export function LearningPathGenerator() {
  const [activeTab, setActiveTab] = useState<Tab>("topic");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [learningPath, setLearningPath] = useState<LearningPathItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(file: File | undefined) {
    setError("");
    setLearningPath([]);

    if (!file) {
      setFileName("");
      setFileContent("");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => {
      setFileContent("");
      setError("Could not read this PDF. Try another file or paste the topic.");
    };
    reader.readAsText(file);
  }

  function buildRequestBody() {
    if (activeTab === "topic") {
      return { text };
    }

    if (activeTab === "link") {
      return { url };
    }

    return {
      fileContent,
      fileType: fileName ? `application/pdf:${fileName}` : "application/pdf",
    };
  }

  async function generatePath() {
    setError("");
    setLearningPath([]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/learning-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRequestBody()),
      });
      const payload = (await response.json()) as ApiResponse<{
        learningPath: LearningPathItem[];
      }>;

      if (!payload.success) {
        setError(payload.error.message);
        return;
      }

      setLearningPath(payload.data.learningPath);
    } catch {
      setError("Kino could not generate the path. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-5 text-white shadow-2xl shadow-blue-950/20">
      <div className="flex items-start gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#1A56DB] shadow-lg shadow-blue-500/25">
          <Sparkles className="size-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-normal text-white">
            Generate Your Learning Path
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Upload a PDF, paste a link, or describe what you want to learn.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setError("");
              }}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center text-[11px] font-black transition ${
                isActive
                  ? "border-[#1A56DB] bg-[#1A56DB] text-white shadow-lg shadow-blue-500/25"
                  : "border-white/10 bg-slate-950/35 text-slate-300"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {activeTab === "topic" ? (
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="border-slate-700 bg-slate-950/40 text-white"
            placeholder="Example: Greedy algorithms for admission interviews"
          />
        ) : null}

        {activeTab === "link" ? (
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="border-slate-700 bg-slate-950/40 text-white"
            placeholder="https://example.com/resource"
            type="url"
          />
        ) : null}

        {activeTab === "pdf" ? (
          <div className="rounded-2xl border border-dashed border-slate-600 bg-slate-950/40 p-4">
            <input
              accept=".pdf,application/pdf"
              className="block w-full text-sm font-semibold text-slate-300 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#1A56DB] file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
              onChange={(event) => void handleFileChange(event.target.files?.[0])}
              type="file"
            />
            {fileName ? (
              <p className="mt-3 text-xs font-bold text-slate-400">
                Selected: {fileName}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200">
          {error}
        </p>
      ) : null}

      <Button
        className="mt-4 h-14 w-full bg-[#1A56DB] shadow-xl shadow-blue-500/20"
        disabled={isLoading}
        onClick={() => void generatePath()}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
        Generate Path
      </Button>

      {isLoading ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-center justify-center gap-3 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-5 text-sm font-black text-blue-100"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, ease: "linear", repeat: Infinity }}
            className="size-5 rounded-full border-2 border-[#93C5FD] border-t-transparent"
          />
          Kino is mapping your path...
        </motion.div>
      ) : null}

      {learningPath.length > 0 ? (
        <div className="mt-5 space-y-3">
          {learningPath.map((item, index) => (
            <motion.article
              key={`${item.order}:${item.title}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border border-white/10 bg-[#0F172A] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#1A56DB] text-sm font-black">
                  {item.order}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-white">{item.title}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-black ${getDifficultyClass(item.difficulty)}`}
                    >
                      {item.difficulty}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {item.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs font-black text-[#F59E0B]">
                      {item.estimatedMinutes} min
                    </span>
                    <Button asChild size="sm">
                      <Link href={"/learn" as Route}>Start Learning</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

