import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Bot,
  User,
  Menu,
  FastForward,
  Mic,
  Volume2,
  Lightbulb,
  BookOpen,
  X,
  Pencil,
} from "lucide-react";
import type { Turn, AnalysisResult } from "@/hooks/speaking-session/types";
import PronunciationAssessmentReview, { type AssessmentData } from "@/components/speaking/pronunciation-assessment";

const VoiceWaveform = dynamic(() => import("@/components/speaking/VoiceWaveform"), { ssr: false });

interface ActiveSessionViewProps {
  scenario: { title: string };
  turns: Turn[];
  isRecording: boolean;
  isTranscribing: boolean;
  isProcessing: boolean;
  mediaStream: MediaStream | null;
  hintText: string | null;
  hintTranslation: string | null;
  isLoadingHint: boolean;
  sessionMode: "scripted" | "unscripted";
  showQuitDialog: boolean;
  showFinishDialog: boolean;
  backUrl: string;
  conversationRef: React.Ref<HTMLDivElement>;
  onToggleRecording: () => void;
  onRequestHint: () => void;
  onDismissHint: () => void;
  onSpeakText: (text: string) => void;
  onSpeakHint: () => void;
  onSetShowQuitDialog: (show: boolean) => void;
  onSetShowFinishDialog: (show: boolean) => void;
  onContinue: () => void;
  onFinish: () => void;
  onStopMicrophone: () => void;
  currentTurnNumber: number;
  maxTurns: number;
  t: (key: string) => string;
  assessmentData?: AssessmentData | null;
  onRetry: () => void;
  language?: string;
}

export default function ActiveSessionView({
  scenario,
  turns,
  isRecording,
  isTranscribing,
  isProcessing,
  mediaStream,
  hintText,
  hintTranslation,
  isLoadingHint,
  sessionMode,
  showQuitDialog,
  showFinishDialog,
  backUrl,
  conversationRef,
  onToggleRecording,
  onRequestHint,
  onDismissHint,
  onSpeakText,
  onSpeakHint,
  onSetShowQuitDialog,
  onSetShowFinishDialog,
  onContinue,
  onFinish,
  onStopMicrophone,
  currentTurnNumber,
  maxTurns,
  t,
  assessmentData,
  onRetry,
  language,
}: ActiveSessionViewProps) {
  const isComplete = !!assessmentData;
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 h-screen max-h-screen flex flex-col">
      {/* Options Dialog */}
      {showQuitDialog && (
        <OptionsDialog
          backUrl={backUrl}
          onContinue={onContinue}
          onFinish={onFinish}
          onStopMicrophone={onStopMicrophone}
          t={t}
        />
      )}

      {/* Finish Confirmation Dialog */}
      {showFinishDialog && (
        <FinishDialog
          onCancel={() => onSetShowFinishDialog(false)}
          onFinish={onFinish}
          t={t}
        />
      )}

      {/* Header */}
      <SessionHeader
        title={scenario.title}
        showQuitDialog={showQuitDialog}
        currentTurnNumber={currentTurnNumber}
        maxTurns={maxTurns}
        onMenuClick={() => onSetShowQuitDialog(true)}
        onFinishClick={() => onSetShowFinishDialog(true)}
        isComplete={isComplete}
      />

      {/* Main Content */}
      <div className={`flex-1 flex min-h-0 pb-4 mx-auto w-full px-4 sm:px-6 lg:px-8 gap-6 ${isComplete ? "max-w-[1400px]" : "justify-center max-w-4xl"}`}>
        <div className="flex-1 rounded-3xl border-2 border-border bg-primary-100 flex flex-col overflow-hidden relative shadow-lg min-w-0">
          <ChatMessages
            turns={turns}
            isProcessing={isProcessing}
            conversationRef={conversationRef}
            onSpeakText={onSpeakText}
            t={t}
            isComplete={isComplete}
            assessmentData={assessmentData}
            sessionMode={sessionMode}
            language={language}
            onRetry={onRetry}
            backUrl={backUrl}
          />

          {!isComplete && (
            <InputBar
              hintText={hintText}
              hintTranslation={hintTranslation}
              isLoadingHint={isLoadingHint}
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              mediaStream={mediaStream}
              sessionMode={sessionMode}
              onToggleRecording={onToggleRecording}
              onRequestHint={onRequestHint}
              onDismissHint={onDismissHint}
              onSpeakHint={onSpeakHint}
              t={t}
            />
          )}
        </div>

        {/* Right Column: Overall Scores when Complete */}
        {isComplete && assessmentData && (
          <div className="w-[450px] shrink-0 flex flex-col gap-6 overflow-y-auto scrollbar-none pr-2">
            <PronunciationAssessmentReview
              data={assessmentData}
              mode={sessionMode}
              language={language}
              onBack={() => {}}
              onRetry={onRetry}
              isEmbedded={true}
              hideTurns={true}
            />
            
            <div className="flex flex-col gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm mt-auto mb-8">
              {backUrl && (
                <Link href={backUrl} className="w-full">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 font-bold transition-all duration-300">
                    Back to Topics
                  </Button>
                </Link>
              )}
              <Button 
                onClick={onRetry}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold shadow-md shadow-indigo-200 transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────

function OptionsDialog({
  backUrl,
  onContinue,
  onFinish,
  onStopMicrophone,
  t,
}: {
  backUrl: string;
  onContinue: () => void;
  onFinish: () => void;
  onStopMicrophone: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-bold text-center mb-6">
          {t("speaking_session.active.option")}
        </h3>
        <div className="flex flex-col gap-3">
          <Button
            className="w-full bg-[#4f46e5] hover:bg-[#4338ca]"
            onClick={onContinue}
          >
            {t("speaking_session.active.continue")}
          </Button>
          <Button
            variant="outline"
            className="w-full border-2 border-primary-200 hover:bg-primary-50"
            onClick={onFinish}
          >
            {t("speaking_session.active.finish")}
          </Button>
          <Link href={backUrl} className="w-full" onClick={onStopMicrophone}>
            <Button
              variant="outline"
              className="w-full border-2 border-primary-200 hover:bg-primary-50"
            >
              {t("speaking_session.active.back_to_home")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function FinishDialog({
  onCancel,
  onFinish,
  t,
}: {
  onCancel: () => void;
  onFinish: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-bold text-center mb-6">
          {t("speaking_session.active.finish_confirm")}
        </h3>
        <div className="flex flex-col gap-3">
          <Button
            className="w-full bg-[#4f46e5] hover:bg-[#4338ca]"
            onClick={onCancel}
          >
            {t("speaking_session.active.no")}
          </Button>
          <Button
            variant="outline"
            className="w-full border-2 border-primary-200 hover:bg-primary-50"
            onClick={onFinish}
          >
            {t("speaking_session.active.yes")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SessionHeader({
  title,
  showQuitDialog,
  currentTurnNumber,
  maxTurns,
  onMenuClick,
  onFinishClick,
  isComplete,
}: {
  title: string;
  showQuitDialog: boolean;
  currentTurnNumber: number;
  maxTurns: number;
  onMenuClick: () => void;
  onFinishClick: () => void;
  isComplete?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center justify-center z-10 shrink-0 relative max-w-4xl mx-auto w-full">
      {!isComplete && (
        <button
          onClick={onMenuClick}
          aria-label="Session menu"
          className={`absolute left-0 w-10 h-10 rounded-full bg-[#e0e7ff] flex items-center justify-center hover:bg-[#c7d2fe] transition-all duration-300 ${
            showQuitDialog ? "rotate-90" : "rotate-0"
          }`}
        >
          <Menu className="h-5 w-5 text-[#4b3fd4]" />
        </button>
      )}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-center">{isComplete ? "Session Results" : title}</h1>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold tracking-wide">
          {isComplete ? "Completed" : `${currentTurnNumber}/${maxTurns}`}
        </span>
      </div>
      {!isComplete && (
        <button
          onClick={onFinishClick}
          aria-label="Finish conversation"
          className="absolute right-0 w-10 h-10 rounded-full bg-[#e0e7ff] flex items-center justify-center hover:bg-[#c7d2fe] transition-all duration-300"
        >
          <FastForward className="h-5 w-5 text-[#4b3fd4]" />
        </button>
      )}
    </div>
  );
}

function ChatMessages({
  turns,
  isProcessing,
  conversationRef,
  onSpeakText,
  t,
  isComplete,
  assessmentData,
  sessionMode,
  language,
  onRetry,
  backUrl,
}: {
  turns: Turn[];
  isProcessing: boolean;
  conversationRef: React.Ref<HTMLDivElement>;
  onSpeakText: (text: string) => void;
  t: (key: string) => string;
  isComplete?: boolean;
  assessmentData?: AssessmentData | null;
  sessionMode?: "scripted" | "unscripted";
  language?: string;
  onRetry?: () => void;
  backUrl?: string;
}) {
  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none"
      ref={conversationRef}
    >
      {turns.map((turn) => (
        <MessageBubble
          key={turn.id}
          turn={turn}
          onSpeakText={onSpeakText}
          isComplete={isComplete}
        />
      ))}
      {isProcessing && <TypingIndicator t={t} />}

    </div>
  );
}

function MessageBubble({
  turn,
  onSpeakText,
  isComplete,
}: {
  turn: Turn;
  onSpeakText: (text: string) => void;
  isComplete?: boolean;
}) {
  const isUser = turn.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex gap-3 max-w-2xl group">
        {!isUser && (
          <div className="shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md border border-border">
            <Bot className="h-4 w-4 text-[#4f46e5]" />
          </div>
        )}

        <div className="flex-1">
          <div
            className={`rounded-2xl px-3 py-2 shadow-md backdrop-blur-sm text-[15px] ${
              isUser
                ? "bg-[#4f46e5] text-white rounded-tr-sm"
                : "bg-white text-foreground border border-border rounded-tl-sm"
            }`}
          >
            <MessageText text={turn.text} isUser={isUser} />
          </div>
          <div
            className={`flex gap-2 mt-1 px-1 ${
              isUser ? "justify-end" : "justify-start"
            } opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <button
              onClick={() => onSpeakText(turn.text)}
              aria-label="Listen to this message"
              className="p-1.5 hover:bg-indigo-50 rounded-full text-slate-400 hover:text-indigo-500 transition-colors"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>

          {/* Correction hint nudge (Tutor only) */}
          {!isUser && turn.correctionHint && (
            <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/60 w-fit motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
              <Pencil className="h-3 w-3 text-amber-500 shrink-0" />
              <span className="text-xs text-amber-700 font-medium">{turn.correctionHint}</span>
            </div>
          )}

          {/* Detailed User Turn Analysis Card */}
          {isComplete && isUser && (turn.wordAssessments || turn.relevanceHint || turn.pronunciationScores) && (
            <div className="mt-2 bg-slate-50/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200 shadow-sm w-full flex items-start gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                
                {/* Context Relevance */}
                <div className="flex flex-col gap-1.5">
                  <div className="text-[13px] font-bold flex items-center gap-1.5">
                    <Lightbulb className="h-4 w-4 text-amber-500" /> 
                    <span className="text-slate-700">Context Relevance:</span>
                    {turn.relevanceHint ? (
                      <span className="text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100 text-[11px] uppercase tracking-wider">Not suitable</span>
                    ) : (
                      <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 text-[11px] uppercase tracking-wider">Good</span>
                    )}
                  </div>
                  {turn.relevanceHint && (
                    <div className="text-[13px] text-slate-700 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/60 leading-relaxed">
                      {turn.relevanceHint}
                    </div>
                  )}
                </div>

                {/* Pronunciation */}
                {turn.wordAssessments && turn.wordAssessments.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-slate-200/80 pt-2.5">
                    <div className="text-[13px] font-bold flex items-center gap-1.5 text-slate-700">
                      <Mic className="h-4 w-4 text-indigo-500" /> 
                      Pronunciation
                    </div>
                    <div className="text-[14px] text-slate-700 leading-loose flex flex-wrap gap-x-1.5 gap-y-1">
                      {turn.wordAssessments.map((w, i) => (
                        <span key={i} className={w.errorType !== "None" ? "text-red-600 bg-red-100 px-1.5 py-0.5 rounded-md border-b-2 border-red-300 font-bold shadow-sm" : "text-slate-700"}>
                          {w.word}
                        </span>
                      ))}
                    </div>
                    {turn.wordAssessments.filter(w => w.errorType !== "None").map((w, i) => {
                      const correctPhonemes = w.phonemes?.map(p => p.phoneme).join("") || "";
                      return (
                        <div key={i} className="text-[13px] text-slate-600 mt-0.5 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex items-start gap-2">
                          <span className="shrink-0 text-red-500 mt-0.5">⚠️</span>
                          <span>
                            You should pronounce the word <strong className="text-red-600 font-bold px-1 bg-red-50 rounded">"{w.word}"</strong> as {correctPhonemes ? <span className="font-mono text-indigo-600 font-bold tracking-widest px-1.5 py-0.5 bg-indigo-50 rounded border border-indigo-100">/{correctPhonemes}/</span> : "correctly"}.
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {isUser && (
          <div className="shrink-0 w-7 h-7 rounded-full bg-[#4f46e5] flex items-center justify-center text-white shadow-md">
            <User className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Parses [Kanji](furigana) syntax and renders HTML ruby tags */
function FuriganaText({ text }: { text: string }) {
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>);
    }
    parts.push(
      <ruby key={match.index} className="mx-0.5">
        {match[1]}
        <rt className="text-[10px] text-muted-foreground/80 font-medium tracking-widest">{match[2]}</rt>
      </ruby>
    );
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

/** Splits text from parenthetical translation and renders them separately */
function MessageText({ text, isUser }: { text: string; isUser: boolean }) {
  // Match trailing parenthetical: "Japanese text (English translation)"
  const match = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!match) {
    return <p className="leading-relaxed"><FuriganaText text={text} /></p>;
  }
  const mainText = match[1];
  const translation = match[2];
  return (
    <div>
      <p className="leading-relaxed"><FuriganaText text={mainText} /></p>
      <p className={`text-xs mt-1 italic leading-snug ${
        isUser ? "text-white/60" : "text-muted-foreground/60"
      }`}>
        {translation}
      </p>
    </div>
  );
}

function TypingIndicator({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-3 bg-white border border-border p-3 rounded-2xl">
        <div className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {t("speaking_session.active.thinking")}
        </span>
      </div>
    </div>
  );
}

function InputBar({
  hintText,
  hintTranslation,
  isLoadingHint,
  isRecording,
  isTranscribing,
  mediaStream,
  sessionMode,
  onToggleRecording,
  onRequestHint,
  onDismissHint,
  onSpeakHint,
  t,
}: {
  hintText: string | null;
  hintTranslation: string | null;
  isLoadingHint: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  mediaStream: MediaStream | null;
  sessionMode: "scripted" | "unscripted";
  onToggleRecording: () => void;
  onRequestHint: () => void;
  onDismissHint: () => void;
  onSpeakHint: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="px-4 py-3 border-t border-border/50 bg-white/90 backdrop-blur-2xl shrink-0 w-full z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      {hintText && (
        <HintCard
          hintText={hintText}
          hintTranslation={hintTranslation}
          sessionMode={sessionMode}
          onSpeakHint={onSpeakHint}
          onDismiss={onDismissHint}
          t={t}
        />
      )}

      <div className="flex justify-center items-center gap-5">
        {/* Hint button */}
        <button
          onClick={onRequestHint}
          disabled={isLoadingHint || isRecording}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${
            isLoadingHint
              ? "bg-amber-100 text-amber-500 motion-safe:animate-pulse shadow-inner"
              : hintText
                ? "bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-200/50 hover:shadow-amber-300/60"
                : "bg-amber-50 border border-amber-200/80 text-amber-500 hover:bg-amber-100 hover:border-amber-300 hover:shadow-md hover:shadow-amber-100/40 motion-safe:hover:scale-105"
          } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
          aria-label={
            isLoadingHint ? "Loading hint..." : "Get a hint for what to say"
          }
        >
          <Lightbulb className="h-5 w-5" />
        </button>

        {/* Mic button with concentric ripple rings */}
        <button
          onClick={onToggleRecording}
          disabled={isTranscribing}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
            isRecording
              ? "bg-gradient-to-br from-indigo-400 to-violet-500 shadow-xl shadow-indigo-300/40 motion-safe:scale-110"
              : isTranscribing
                ? "bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg shadow-purple-300/40 cursor-wait"
                : "bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-200/50 motion-safe:hover:scale-105 hover:from-indigo-600 hover:to-indigo-700 hover:shadow-xl hover:shadow-indigo-300/40"
          } text-white disabled:cursor-wait`}
          aria-label={
            isRecording
              ? "Stop recording"
              : isTranscribing
                ? "Recognizing speech..."
                : "Start recording"
          }
        >
          <Mic
            className={`h-6 w-6 relative z-10 ${
              isRecording ? "motion-safe:animate-pulse" : ""
            }`}
          />
          {/* Concentric ripple rings when recording */}
          {isRecording && (
            <>
              <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20 motion-safe:animate-ping" />
              <span
                className="absolute inline-flex rounded-full bg-indigo-300 opacity-10 motion-safe:animate-ping"
                style={{ width: "120%", height: "120%", animationDelay: "150ms" }}
              />
              <span
                className="absolute inline-flex rounded-full bg-indigo-200 opacity-[0.07] motion-safe:animate-ping"
                style={{ width: "140%", height: "140%", animationDelay: "300ms" }}
              />
            </>
          )}
          {/* Shimmer effect when transcribing */}
          {isTranscribing && (
            <span className="absolute inset-0 rounded-full overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite]" />
            </span>
          )}
        </button>
      </div>

      {/* Status area: waveform / recognizing / static label */}
      <div className="mt-2 flex justify-center items-center h-7">
        {isRecording ? (
          <div className="flex items-center gap-2">
            <VoiceWaveform mediaStream={mediaStream} />
            <span className="text-[11px] text-indigo-500 font-medium select-none">
              {t("speaking_session.active.tap_stop_recording")}
            </span>
          </div>
        ) : isTranscribing ? (
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[0, 100, 200].map((delay) => (
                <div
                  key={delay}
                  className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
            <span className="text-[11px] text-violet-500 font-medium select-none">
              Recognizing...
            </span>
          </div>
        ) : (
          <p className="text-center text-[11px] text-muted-foreground/60 select-none">
            {t("speaking_session.active.tap_mic_speak")}
          </p>
        )}
      </div>
    </div>
  );
}

function HintCard({
  hintText,
  hintTranslation,
  sessionMode,
  onSpeakHint,
  onDismiss,
  t,
}: {
  hintText: string;
  hintTranslation: string | null;
  sessionMode: "scripted" | "unscripted";
  onSpeakHint: () => void;
  onDismiss: () => void;
  t: (key: string) => string;
}) {
  const mainText = hintText;
  const translation = hintTranslation;

  return (
    <div className="mb-3 mx-auto max-w-lg motion-safe:animate-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200/60 shadow-md shadow-amber-100/40">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-orange-400 to-amber-300" />
        <div className="flex items-start gap-3 pl-4 pr-3 py-3">
          <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-sm">
            <Lightbulb className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600/80 mb-1 flex items-center gap-1">
              {sessionMode === "scripted" ? (
                <>
                  <BookOpen className="inline h-3 w-3" />{" "}
                  {t("speaking_session.active.read_aloud_hint")}
                </>
              ) : (
                t("speaking_session.active.suggested_response")
              )}
            </p>
            <p className="text-[14px] text-amber-950 leading-relaxed font-medium">
              &ldquo;<FuriganaText text={mainText} />&rdquo;
            </p>
            {translation && (
              <p className="text-xs mt-1.5 italic leading-snug text-amber-900/60">
                {translation}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onSpeakHint}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-200/50 transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="Listen to hint"
              title="Listen to sample pronunciation"
            >
              <Volume2 className="h-3.5 w-3.5 text-amber-500" />
            </button>
            {sessionMode !== "scripted" && (
              <button
                onClick={onDismiss}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-200/50 transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="Dismiss hint"
              >
                <X className="h-3.5 w-3.5 text-amber-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
