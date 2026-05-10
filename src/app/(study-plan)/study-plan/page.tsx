import PlanPageClient from "@/components/page/PlanPageClient";
import type {
  TodayLesson,
  Reminder,
  StudyGoals,
  IELTSExam,
  StudyStats,
} from "@/components/page/PlanPageClient";
import { cookies } from "next/headers";
import { Suspense } from "react";
import Loading from "./loading";

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// ─── Fetch helpers (server-side with cookie forwarding) ────────────────────

async function fetchWithCookies<T>(path: string): Promise<T | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Backend response types ────────────────────────────────────────────────

interface StudyPlanApiResponse {
  id: string;
  userId: string;
  goal: string;
  level: string;
  minutesPerDay: number;
  wordsPerDay: number;
  interests: string[];
  examDate: string | null;
  createdAt: string;
  tasks: StudyTaskApiResponse[];
}

interface StudyTaskApiResponse {
  id: string;
  planId: string;
  date: string;
  type: string;
  completed: boolean;
  title: string;
  startTime: string | null;
  endTime: string | null;
  link: string | null;
}

interface StudyStatsApiResponse {
  dailyHours: string;
  weeklyHours: string;
  totalHours: string;
}

// ─── Mappers ───────────────────────────────────────────────────────────────

function mapTasks(tasks: StudyTaskApiResponse[]): TodayLesson[] {
  return tasks.map((t) => ({
    id: t.id,
    type: t.type as TodayLesson["type"],
    title: t.title,
    topic: t.type.charAt(0).toUpperCase() + t.type.slice(1),
    duration: t.startTime && t.endTime ? `${t.startTime} - ${t.endTime}` : "",
    completed: t.completed,
    link: t.link ?? undefined,
    startTime: t.startTime ?? undefined,
    endTime: t.endTime ?? undefined,
  }));
}

function mapStudyGoals(plan: StudyPlanApiResponse): StudyGoals {
  const hoursPerWeek = Math.round((plan.minutesPerDay * 7) / 60);
  return {
    currentLevel: plan.level,
    targetLevel: getTargetLevel(plan.level),
    hoursPerWeek,
    durationMonths: 6,
  };
}

function mapIeltsExam(plan: StudyPlanApiResponse): IELTSExam {
  if (plan.examDate) {
    const examDate = new Date(plan.examDate);
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    return {
      examDate: plan.examDate,
      daysRemaining,
    };
  }
  // Default: 6 months from now
  const defaultDate = new Date();
  defaultDate.setMonth(defaultDate.getMonth() + 6);
  return {
    examDate: defaultDate.toISOString(),
    daysRemaining: 180,
  };
}

function getTargetLevel(current: string): string {
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const idx = levels.indexOf(current);
  if (idx >= 0 && idx < levels.length - 1) return levels[idx + 1];
  return current;
}

function buildReminders(tasks: TodayLesson[]): Reminder[] {
  const reminders: Reminder[] = [];
  const hasSpeaking = tasks.some((t) => t.type === "speaking" && t.completed);
  const hasVocab = tasks.some((t) => t.type === "vocab" && t.completed);

  if (!hasSpeaking) {
    reminders.push({
      id: "r-speaking",
      type: "speaking",
      title: "Speaking Room",
      description: "You haven't practiced speaking today",
      action: "Practice Now",
      href: "/speaking-room",
    });
  }

  if (!hasVocab) {
    reminders.push({
      id: "r-notebook",
      type: "notebook",
      title: "Notebook",
      description: "You have words to review",
      action: "Review Now",
      href: "/notebook",
    });
  }

  return reminders;
}

// ─── Fallback data ─────────────────────────────────────────────────────────

function getFallbackData() {
  const todayLessons: TodayLesson[] = [
    { id: "task-1", type: "vocab", title: "Business Vocabulary", topic: "Professional English", duration: "09:00 - 09:30", completed: false, link: "/vocabulary-hub/business", startTime: "09:00", endTime: "09:30" },
    { id: "task-2", type: "grammar", title: "Past Perfect Tense", topic: "Grammar Fundamentals", duration: "10:00 - 10:30", completed: false, link: "/grammar-hub/past-perfect", startTime: "10:00", endTime: "10:30" },
    { id: "task-3", type: "speaking", title: "Job Interview Practice", topic: "Speaking Skills", duration: "14:00 - 14:30", completed: false, link: "/speaking-room/session/scenario-2", startTime: "14:00", endTime: "14:30" },
  ];
  const reminders: Reminder[] = [
    { id: "r1", type: "speaking", title: "Speaking Room", description: "You haven't practiced speaking today", action: "Practice Now", href: "/speaking-room" },
    { id: "r2", type: "notebook", title: "Notebook", description: "You have 15 words to review", action: "Review Now", href: "/notebook" },
  ];
  const studyGoals: StudyGoals = { currentLevel: "B1", targetLevel: "B2", hoursPerWeek: 10, durationMonths: 6 };
  const ieltsExam: IELTSExam = { examDate: new Date(Date.now() + 180 * 86400000).toISOString(), daysRemaining: 180 };
  const stats: StudyStats = { dailyHours: "0.0", weeklyHours: "0.0", totalHours: "0.0" };
  return { todayLessons, reminders, studyGoals, ieltsExam, stats };
}

// ─── Page Wrapper ──────────────────────────────────────────────────────────

export default function StudyPlanPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PlanPageContent />
    </Suspense>
  );
}

async function PlanPageContent() {
  // Fetch from real backend
  const [plan, todayTasksApi, statsApi] = await Promise.all([
    fetchWithCookies<StudyPlanApiResponse>("/study/plan"),
    fetchWithCookies<StudyTaskApiResponse[]>("/study/tasks/today"),
    fetchWithCookies<StudyStatsApiResponse>("/study/stats"),
  ]);

  // If backend unreachable or user not logged in, use fallback
  if (!plan) {
    const fallback = getFallbackData();
    return (
      <PlanPageClient
        todayLessons={fallback.todayLessons}
        reminders={fallback.reminders}
        studyGoals={fallback.studyGoals}
        ieltsExam={fallback.ieltsExam}
        stats={fallback.stats}
      />
    );
  }

  const todayLessons = todayTasksApi ? mapTasks(todayTasksApi) : [];
  const studyGoals = mapStudyGoals(plan);
  const ieltsExam = mapIeltsExam(plan);
  const reminders = buildReminders(todayLessons);
  const stats: StudyStats = statsApi ?? { dailyHours: "0.0", weeklyHours: "0.0", totalHours: "0.0" };

  return (
    <PlanPageClient
      todayLessons={todayLessons}
      reminders={reminders}
      studyGoals={studyGoals}
      ieltsExam={ieltsExam}
      stats={stats}
    />
  );
}
