"use client";

import { motion } from "framer-motion";
import {
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Gift,
  Loader2,
  MessageSquareText,
  Mic,
  NotebookPen,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } };

function Shell({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <section className="rounded-[2rem] border-2 border-white/10 bg-gradient-to-br from-[#1A56DB] to-[#111827] p-5 shadow-2xl shadow-blue-950/30">
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-white/10">
          {icon}
        </div>
        <h1 className="text-3xl font-black tracking-normal text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-blue-100">{subtitle}</p>
      </section>
      {children}
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="grid min-h-[45vh] place-items-center">
      <Loader2 className="size-8 animate-spin text-[#93C5FD]" />
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[2rem] border-2 border-dashed border-white/10 bg-[#1E293B] p-6 text-center text-sm leading-6 text-slate-300">
      {children}
    </div>
  );
}

export function EventsScreen() {
  const [events, setEvents] = useState<Array<Record<string, string | number | null>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/events", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiResponse<{ events: Array<Record<string, string | number | null>> }>) => {
        if (payload.success) setEvents(payload.data.events);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell
      title="Events Hub"
      subtitle="Competitions, workshops, mentor lives, and mock contests from real Event records."
      icon={<CalendarDays className="size-6" />}
    >
      {loading ? <LoadingState /> : null}
      {!loading && events.length === 0 ? (
        <EmptyState>No events are published yet. Seed or create events to populate this hub.</EmptyState>
      ) : null}
      <div className="space-y-3">
        {events.map((event) => (
          <article key={String(event.id)} className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-[#93C5FD]">
                {String(event.type)}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {event.price === 0 ? "Free" : `৳${event.price}`}
              </span>
            </div>
            <h2 className="text-xl font-black text-white">{String(event.title)}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{String(event.description)}</p>
            <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-400">
              <span>{new Date(String(event.startsAt)).toLocaleString()}</span>
              <span>{event.myStatus ? String(event.myStatus) : "Open"}</span>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}

export function MentorsScreen() {
  const [mentors, setMentors] = useState<Array<Record<string, string | number | boolean | string[] | null>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/mentors", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiResponse<{ mentors: Array<Record<string, string | number | boolean | string[] | null>> }>) => {
        if (payload.success) setMentors(payload.data.mentors);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell
      title="Mentor Marketplace"
      subtitle="Verified mentors from real MentorProfile records."
      icon={<Users className="size-6" />}
    >
      {loading ? <LoadingState /> : null}
      {!loading && mentors.length === 0 ? (
        <EmptyState>No mentors are published yet. Run the seed after migration to add starter mentors.</EmptyState>
      ) : null}
      <div className="space-y-3">
        {mentors.map((mentor) => (
          <article key={String(mentor.id)} className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-5">
            <div className="flex gap-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#1A56DB] text-xl font-black">
                {String(mentor.name ?? "M").slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-black text-white">{String(mentor.name ?? "Mentor")}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {String(mentor.department)} — {String(mentor.university)}
                </p>
                <p className="mt-2 text-xs font-bold text-[#F59E0B]">
                  ★ {String(mentor.rating)} • {String(mentor.sessionsCount)} sessions
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-white">৳{String(mentor.rateChat)}</p>
                <p className="text-xs text-slate-400">/ chat</p>
              </div>
            </div>
            <Button className="mt-4 h-11 w-full">Book Mentor</Button>
          </article>
        ))}
      </div>
    </Shell>
  );
}

export function LeaderboardScreen() {
  const [rows, setRows] = useState<Array<Record<string, string | number | boolean | null>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/gamification/leaderboard", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiResponse<{ leaderboard: Array<Record<string, string | number | boolean | null>> }>) => {
        if (payload.success) setRows(payload.data.leaderboard);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell title="Leaderboard" subtitle="Weekly rank powered by real XP ledger totals." icon={<Trophy className="size-6" />}>
      {loading ? <LoadingState /> : null}
      {!loading && rows.length === 0 ? <EmptyState>No XP entries yet. Complete practice to appear here.</EmptyState> : null}
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={String(row.userId)} className="flex items-center gap-3 rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-4">
            <div className="grid size-11 place-items-center rounded-2xl bg-blue-500/15 text-lg font-black text-[#93C5FD]">
              #{String(row.rank)}
            </div>
            <div className="flex-1">
              <p className="font-black text-white">{String(row.name)}</p>
              <p className="text-xs font-bold text-slate-400">{Number(row.points).toLocaleString()} XP</p>
            </div>
            {row.isMe ? <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-200">YOU</span> : null}
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function RewardsScreen() {
  const [achievements, setAchievements] = useState<Array<Record<string, string | number | null>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/gamification/rewards", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiResponse<{ achievements: Array<Record<string, string | number | null>> }>) => {
        if (payload.success) setAchievements(payload.data.achievements);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell title="Rewards" subtitle="Achievements, XP bonuses, and premium boundaries." icon={<Gift className="size-6" />}>
      {loading ? <LoadingState /> : null}
      <div className="grid gap-3">
        {achievements.map((achievement) => (
          <div key={String(achievement.id)} className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-5">
            <div className="mb-3 flex items-center justify-between">
              <Award className="size-6 text-[#F59E0B]" />
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-[#F59E0B]">
                +{String(achievement.xpReward)} XP
              </span>
            </div>
            <p className="font-black text-white">{String(achievement.name)}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{String(achievement.description)}</p>
            <p className="mt-3 text-xs font-black text-emerald-200">
              {achievement.unlockedAt ? "Unlocked" : "Locked"}
            </p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function BattleScreen() {
  const [battles, setBattles] = useState<Array<Record<string, string | number>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/gamification/battles", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiResponse<{ battles: Array<Record<string, string | number>> }>) => {
        if (payload.success) setBattles(payload.data.battles);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell title="Battle" subtitle="Challenge classmates in topic duels and track battle history." icon={<Swords className="size-6" />}>
      {loading ? <LoadingState /> : null}
      {!loading && battles.length === 0 ? (
        <EmptyState>No battles yet. Start a duel after completing a topic mission.</EmptyState>
      ) : null}
      <div className="space-y-3">
        {battles.map((battle) => (
          <div key={String(battle.id)} className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-5">
            <p className="font-black text-white">vs {String(battle.opponentName)}</p>
            <p className="mt-1 text-sm text-slate-400">{String(battle.subject)} • {String(battle.result)}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function NotesScreen() {
  const [notes, setNotes] = useState<Array<Record<string, string | string[] | boolean | null>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/notes", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiResponse<{ notes: Array<Record<string, string | string[] | boolean | null>> }>) => {
        if (payload.success) setNotes(payload.data.notes);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell title="Notes" subtitle="Private learning notes, tagged by topic and ready for export later." icon={<NotebookPen className="size-6" />}>
      <div className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-4">
        <Input className="border-slate-700 bg-slate-950/40 text-white" placeholder="Search your notes..." />
      </div>
      {loading ? <LoadingState /> : null}
      {!loading && notes.length === 0 ? <EmptyState>No notes yet. Add notes from a lesson highlight or stage reflection.</EmptyState> : null}
      {notes.map((note) => (
        <article key={String(note.id)} className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-5">
          <p className="font-black text-white">{String(note.title)}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{String(note.content)}</p>
        </article>
      ))}
    </Shell>
  );
}

export function CommunityScreen() {
  const [posts, setPosts] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/community", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiResponse<{ posts: Array<Record<string, unknown>> }>) => {
        if (payload.success) setPosts(payload.data.posts);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell title="Community" subtitle="Study-group discussion backed by CommunityPost records." icon={<MessageSquareText className="size-6" />}>
      {loading ? <LoadingState /> : null}
      {!loading && posts.length === 0 ? <EmptyState>No community posts yet. Ask the first question after a lesson.</EmptyState> : null}
      {posts.map((post) => (
        <article key={String(post.id)} className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-5">
          <p className="font-black text-white">{String(post.title)}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{String(post.body)}</p>
          <p className="mt-3 text-xs font-black text-[#F59E0B]">{String(post.upvotes)} upvotes</p>
        </article>
      ))}
    </Shell>
  );
}

export function AnalyticsScreen() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void fetch("/api/analytics/student", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiResponse<Record<string, unknown>>) => {
        if (payload.success) setData(payload.data);
      });
  }, []);

  const summary = (data?.summary ?? {}) as Record<string, number>;
  const weakestTopics = (data?.weakestTopics ?? []) as Array<Record<string, string | number>>;

  return (
    <Shell title="Analytics" subtitle="Mastery, weak topics, interview readiness, and recall health." icon={<BarChart3 className="size-6" />}>
      {!data ? <LoadingState /> : null}
      {data ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            {[
              ["Accuracy", `${summary.overallAccuracy ?? 0}%`],
              ["Attempts", `${summary.totalAttempts ?? 0}`],
              ["Feynman", `${summary.averageFeynmanScore ?? 0}`],
              ["Interview", `${summary.averageInterviewScore ?? 0}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-4">
                <p className="text-2xl font-black text-[#F59E0B]">{value}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
              </div>
            ))}
          </section>
          <section className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-5">
            <h2 className="font-black text-white">Weakest topics</h2>
            <div className="mt-4 space-y-3">
              {weakestTopics.length === 0 ? <p className="text-sm text-slate-400">No accuracy data yet.</p> : null}
              {weakestTopics.map((topic) => (
                <div key={String(topic.topicName)} className="flex items-center justify-between rounded-2xl bg-slate-950/35 p-3 text-sm">
                  <span className="font-bold text-white">{String(topic.topicName)}</span>
                  <span className="font-black text-[#F59E0B]">{String(topic.accuracy)}%</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </Shell>
  );
}

export function TeacherScreen() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void fetch("/api/teacher/dashboard", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiResponse<Record<string, unknown>>) => {
        if (payload.success) setData(payload.data);
      });
  }, []);

  const metrics = (data?.metrics ?? {}) as Record<string, number>;
  const courses = (data?.courses ?? []) as Array<Record<string, unknown>>;

  return (
    <Shell title="Teacher Dashboard" subtitle="Course, class, Feynman, quiz, and risk signals for educators." icon={<Users className="size-6" />}>
      {!data ? <LoadingState /> : null}
      {data ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            {[
              ["Accuracy", `${metrics.accuracy ?? 0}%`],
              ["Attempts", `${metrics.totalAttempts ?? 0}`],
              ["At risk", `${metrics.atRiskStudents ?? 0}`],
              ["Feynman", `${metrics.averageFeynmanScore ?? 0}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-4">
                <p className="text-2xl font-black text-[#93C5FD]">{value}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
              </div>
            ))}
          </section>
          <section className="space-y-3">
            {courses.length === 0 ? <EmptyState>No courses owned by this account yet.</EmptyState> : null}
            {courses.map((course) => (
              <article key={String(course.id)} className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-5">
                <p className="font-black text-white">{String(course.title)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{String(course.description)}</p>
              </article>
            ))}
          </section>
        </>
      ) : null}
    </Shell>
  );
}

export function InterviewCenterScreen() {
  const [sessions, setSessions] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        const response = await fetch("/api/interview/sessions", { cache: "no-store" });

        if (!response.ok) {
          setSessions([]);
          return;
        }

        if (response.status === 204 || response.headers.get("content-length") === "0") {
          setSessions([]);
          return;
        }

        let payload: ApiResponse<{ sessions: Array<Record<string, unknown>> }>;

        try {
          payload = (await response.json()) as ApiResponse<{
            sessions: Array<Record<string, unknown>>;
          }>;
        } catch {
          setSessions([]);
          return;
        }

        if (payload.success) setSessions(payload.data.sessions);
      } finally {
        setLoading(false);
      }
    }

    void loadSessions();
  }, []);

  return (
    <Shell title="Mock Interview Center" subtitle="Flash, Standard, and Deep interviews unlock after reasoning stages." icon={<Mic className="size-6" />}>
      <div className="rounded-[2rem] border-2 border-indigo-400/30 bg-indigo-400/10 p-5">
        <p className="font-black text-indigo-100">Interview Mode</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Complete Socratic and Feynman stages in the learning studio, then store full transcripts and scorecards here.
        </p>
        <Button className="mt-4 h-12 w-full">Start Standard Interview</Button>
      </div>
      {loading ? <LoadingState /> : null}
      {!loading && sessions.length === 0 ? <EmptyState>No interview sessions yet.</EmptyState> : null}
      {sessions.map((session) => (
        <article key={String(session.id)} className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-5">
          <div className="flex items-center justify-between">
            <p className="font-black text-white">{String(session.mode)}</p>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-200">
              {String(session.readiness)}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">Score: {String(session.score)}/100</p>
        </article>
      ))}
    </Shell>
  );
}

export function QuestionBankScreen() {
  const [questions, setQuestions] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/questions?examType=IBA&limit=25", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiResponse<{ questions: Array<Record<string, unknown>> }>) => {
        if (payload.success) setQuestions(payload.data.questions);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell title="Question Bank" subtitle="Searchable interview and admission practice built from real Question records." icon={<CheckCircle2 className="size-6" />}>
      {loading ? <LoadingState /> : null}
      {!loading && questions.length === 0 ? <EmptyState>No questions available for this filter.</EmptyState> : null}
      {questions.map((question) => (
        <article key={String(question.id)} className="rounded-[2rem] border-2 border-white/10 bg-[#1E293B] p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-[#93C5FD]">
              {String((question.topic as { name?: string } | null)?.name ?? "Practice")}
            </span>
            <span className="text-xs font-black text-[#F59E0B]">{String(question.difficulty)}</span>
          </div>
          <p className="font-bold leading-7 text-white">{String(question.text)}</p>
        </article>
      ))}
    </Shell>
  );
}
