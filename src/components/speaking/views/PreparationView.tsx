import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import VoiceSelector from "@/components/speaking/VoiceSelector";
import {
  ArrowLeft,
  BookOpen,
  MessageSquare,
  Play,
  RotateCcw,
  Mic2,
} from "lucide-react";
import type { ScenarioData } from "@/hooks/speaking-session/types";

interface PreparationViewProps {
  scenario: ScenarioData;
  backUrl: string;
  sessionMode: "scripted" | "unscripted";
  onSessionModeChange: (mode: "scripted" | "unscripted") => void;
  onStartSession: () => void;
  onViewHistory: () => void;
  t: (key: string) => string;
}

export default function PreparationView({
  scenario,
  backUrl,
  sessionMode,
  onSessionModeChange,
  onStartSession,
  onViewHistory,
  t,
}: PreparationViewProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Link href={backUrl}>
        <Button variant="outline" className="gap-2 mb-6 bg-white">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column — Learning Goals & Context */}
        <Card className="p-8 bg-white flex flex-col">
          <LearningGoalsSection scenario={scenario} t={t} />
          <ContextSection context={scenario.context} t={t} />
        </Card>

        {/* Right Column — Scenario Info & Controls */}
        <Card className="p-8 bg-white flex flex-col">
          <div className="aspect-video bg-linear-to-br from-primary-200 to-primary-300 rounded-2xl mb-6 relative overflow-hidden">
            <Image
              src={scenario.image || "/learning.png"}
              alt={scenario.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover rounded-2xl"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold mb-4">{scenario.title}</h1>
            <p className="text-muted-foreground flex-1">
              {scenario.description || scenario.context}
            </p>

            <ModeSelector
              mode={sessionMode}
              onModeChange={onSessionModeChange}
              t={t}
            />

            <VoiceSelector />

            <div className="flex gap-3">
              <Button
                onClick={onStartSession}
                className="flex-1 gap-2 text-lg py-6"
                size="lg"
              >
                <Play className="h-5 w-5" />
                {t("speaking_session.preparation.start_speaking")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                aria-label="View history"
                className="px-6 bg-transparent"
                onClick={onViewHistory}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Sub-components (only used inside PreparationView) ──

function LearningGoalsSection({
  scenario,
  t,
}: {
  scenario: ScenarioData;
  t: (key: string) => string;
}) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-6 w-6" />
        <h2 className="text-2xl font-bold">
          {t("speaking_session.preparation.learning_goals")}
        </h2>
      </div>
      <div className="space-y-3">
        <GoalItem index={1} color="bg-primary-400">
          {scenario.goal ||
            t("speaking_session.preparation.goal_practice")}
        </GoalItem>
        {scenario.objectives && scenario.objectives.length > 0 ? (
          scenario.objectives.map((obj, idx) => (
            <GoalItem key={idx} index={idx + 2} color="bg-primary-400">
              {obj}
            </GoalItem>
          ))
        ) : (
          <>
            <GoalItem index={2} color="bg-primary-500">
              {t("speaking_session.preparation.goal_vocab")}
            </GoalItem>
            <GoalItem index={3} color="bg-primary-500">
              {t("speaking_session.preparation.goal_fluency")}
            </GoalItem>
          </>
        )}
      </div>
    </div>
  );
}

function GoalItem({
  index,
  color,
  children,
}: {
  index: number;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex-shrink-0 w-8 h-8 rounded-full ${color} text-white flex items-center justify-center font-semibold text-sm`}
      >
        {index}
      </span>
      <p className="p-4 bg-primary-50 rounded-xl flex-1">{children}</p>
    </div>
  );
}

function ContextSection({
  context,
  t,
}: {
  context?: string;
  t: (key: string) => string;
}) {
  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-xl font-bold">
          {t("speaking_session.preparation.context")}
        </h2>
      </div>
      <div className="p-4 bg-primary-50 rounded-xl text-sm italic text-muted-foreground">
        {context}
      </div>
    </div>
  );
}

function ModeSelector({
  mode,
  onModeChange,
  t,
}: {
  mode: "scripted" | "unscripted";
  onModeChange: (mode: "scripted" | "unscripted") => void;
  t: (key: string) => string;
}) {
  return (
    <div className="mt-6 mb-4">
      <p className="text-sm font-semibold text-slate-700 mb-2">
        {t("speaking_session.preparation.assessment_mode")}
      </p>
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        <button
          onClick={() => onModeChange("unscripted")}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            mode === "unscripted"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
          aria-label="Free Speaking mode"
        >
          <Mic2 className="inline h-4 w-4 mr-1.5 -mt-0.5" />{" "}
          {t("speaking_session.preparation.free_speaking")}
        </button>
        <button
          onClick={() => onModeChange("scripted")}
          aria-label="Read Aloud mode"
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            mode === "scripted"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <BookOpen className="inline h-4 w-4 mr-1.5 -mt-0.5" />{" "}
          {t("speaking_session.preparation.read_aloud")}
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-1.5">
        {mode === "scripted"
          ? t("speaking_session.preparation.desc_read_aloud")
          : t("speaking_session.preparation.desc_free_speaking")}
      </p>
    </div>
  );
}
