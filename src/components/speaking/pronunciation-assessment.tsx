"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================== Types ==============================

interface PhonemeAssessment {
  phoneme: string;
  accuracyScore: number;
}

interface SyllableAssessment {
  syllable: string;
  accuracyScore: number;
}

interface WordAssessment {
  word: string;
  accuracyScore: number;
  errorType: string;
  phonemes?: PhonemeAssessment[];
  syllables?: SyllableAssessment[];
}

interface TurnAssessment {
  text: string;
  words: WordAssessment[];
  accuracyScore: number;
  fluencyScore: number;
  prosodyScore: number;
  overallScore: number;
  completenessScore?: number;
}

interface AssessmentData {
  turns: TurnAssessment[];
  fullText: string;
  pronunciationScore: number;
  accuracyScore: number;
  fluencyScore: number;
  prosodyScore: number;
  completenessScore?: number;
  contentScore: number;
  grammarScore: number;
  relevanceScore: number;
  vocabularyScore: number;
}

// ============================== Helpers ==============================

const scoreColor = (s: number) => {
  if (s >= 80) return { ring: "#10b981", bar: "bg-emerald-500", text: "text-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (s >= 60) return { ring: "#f59e0b", bar: "bg-amber-500", text: "text-amber-600", badge: "bg-amber-50 text-amber-700 border-amber-200" };
  return { ring: "#ef4444", bar: "bg-red-500", text: "text-red-600", badge: "bg-red-50 text-red-700 border-red-200" };
};

// ============================== Score Ring ==============================

const ScoreRing = React.memo(function ScoreRing({
  score,
  size = 104,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const sw = 7;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const prog = (score / 100) * circ;
  const c = size / 2;
  const col = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={c} cy={c} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
          <circle
            cx={c} cy={c} r={r} fill="none" stroke={col.ring} strokeWidth={sw}
            strokeDasharray={circ} strokeDashoffset={circ - prog}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${col.text} tabular-nums`}>
          {Math.round(score)}
        </span>
      </div>
      {label && <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>}
    </div>
  );
});

// ============================== Metric Bar ==============================

const MetricBar = React.memo(function MetricBar({
  label,
  score,
  hint,
}: {
  label: string;
  score: number;
  hint?: string;
}) {
  const col = scoreColor(score);
  return (
    <div className="space-y-1.5 group/metric">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 font-medium flex items-center gap-1">
          {label}
          {hint && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center justify-center cursor-help rounded-full hover:bg-slate-100 p-0.5 transition-colors">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-white text-slate-600 border border-slate-200 shadow-lg text-[11px] px-2.5 py-1.5 mb-1 z-50">
                  {hint}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </span>
        <span className={`text-sm font-bold tabular-nums ${col.text}`}>{Math.round(score)}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${col.bar} transition-all duration-700 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
});

// ============================== Error Config ==============================

// All possible error types — used regardless of mode;
// visibleErrorTypes will filter to only those present in the data.
const ALL_ERROR_TYPES = [
  { key: "Mispronunciation", label: "Mispronunciations", color: "bg-red-500", dot: "bg-red-400", hint: "A word was pronounced incorrectly" },
  { key: "Omission", label: "Omission", color: "bg-orange-500", dot: "bg-orange-400", hint: "A word from the script was skipped" },
  { key: "Insertion", label: "Insertion", color: "bg-cyan-500", dot: "bg-cyan-400", hint: "An extra word not in the script was spoken" },
  { key: "UnexpectedBreak", label: "Unexpected break", color: "bg-violet-500", dot: "bg-violet-400", hint: "An unnatural pause between words" },
  { key: "MissingBreak", label: "Missing break", color: "bg-violet-500", dot: "bg-violet-400", hint: "Words run together without a natural pause" },
  { key: "Monotone", label: "Monotone", color: "bg-slate-400", dot: "bg-slate-400", hint: "Speech lacks pitch variation and sounds flat" },
] as const;

const ERROR_WORD_STYLES: Record<string, string> = {
  Mispronunciation: "bg-red-100 text-red-700 border-b-2 border-red-400",
  Omission: "bg-orange-100 text-orange-700 border-b-2 border-orange-400",
  Insertion: "bg-cyan-100 text-cyan-700 border-b-2 border-cyan-400",
  UnexpectedBreak: "bg-violet-100 text-violet-700 border-b-2 border-violet-400",
  MissingBreak: "bg-violet-100 text-violet-700 border-b-2 border-violet-400",
  Monotone: "bg-slate-100 text-slate-600 border-b-2 border-slate-400",
};

// ============================== Main Component ==============================

export default function PronunciationAssessmentReview({
  data,
  mode = "unscripted",
  language = "en",
  onBack,
  onRetry,
  isEmbedded = false,
}: {
  data: AssessmentData;
  mode?: "scripted" | "unscripted";
  language?: string;
  onBack: () => void;
  onRetry: () => void;
  isEmbedded?: boolean;
}) {
  const isJapanese = language === "ja";
  const [enabledErrors, setEnabledErrors] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_ERROR_TYPES.map((e) => [e.key, true]))
  );
  const [expandedTurn, setExpandedTurn] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<{ turnIdx: number; wordIdx: number } | null>(null);

  const errorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const turn of data.turns) {
      for (const w of turn.words) {
        if (w.errorType !== "None") {
          counts[w.errorType] = (counts[w.errorType] || 0) + 1;
        }
      }
    }
    return counts;
  }, [data.turns]);

  // Show only error types that actually appear in the data (regardless of mode)
  const visibleErrorTypes = ALL_ERROR_TYPES;

  const toggleError = useCallback((key: string) => {
    setEnabledErrors((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);
  return (
    <div className={isEmbedded ? "" : "min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/80 px-4 sm:px-6 lg:px-8 pt-6 pb-12"}>
      <div className={isEmbedded ? "space-y-7" : "max-w-7xl mx-auto space-y-7"}>
        {!isEmbedded && (
          /* ═══════════ Header ═══════════ */
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Assessment Result
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {isJapanese
                  ? "各文字をクリックして音節を表示 · ターンをクリックで詳細表示"
                  : "Click any word to view IPA phonemes · Click a turn to expand details"}
              </p>
            </div>
            <div className="flex items-center gap-3 mb-1">
              {[
                { label: "0–59", color: "bg-red-500" },
                { label: "60–79", color: "bg-amber-500" },
                { label: "80–100", color: "bg-emerald-500" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                  <span className="text-xs text-slate-400 tabular-nums">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ Assessment Panel ═══════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px]">

            {/* ─── Left: Turns ─── */}
            <div className="p-6 lg:p-7 space-y-3 rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none">
              {data.turns.length > 0 ? (
                data.turns.map((turn, turnIdx) => {
                  const isExpanded = expandedTurn === turnIdx;
                  const turnErrors: Record<string, number> = {};
                  turn.words.forEach((w) => {
                    if (w.errorType !== "None") turnErrors[w.errorType] = (turnErrors[w.errorType] || 0) + 1;
                  });
                  const totalErrors = Object.values(turnErrors).reduce((a, b) => a + b, 0);
                  const turnErrorList = ALL_ERROR_TYPES.filter((e) => (turnErrors[e.key] || 0) > 0);
                  const sc = scoreColor(turn.overallScore);

                  return (
                    <div
                      key={turnIdx}
                      className={`rounded-xl transition-all duration-200 border ${isExpanded
                        ? "border-indigo-200 bg-indigo-50/30 shadow-sm"
                        : "border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50"
                        }`}
                    >
                      {/* Turn header */}
                      <button
                        onClick={() => {
                          setExpandedTurn(isExpanded ? null : turnIdx);
                          setSelectedWord(null);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 cursor-pointer"
                        aria-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest select-none">
                            Turn {turnIdx + 1}
                          </span>
                          <span className={`text-xs font-bold tabular-nums ${sc.text}`}>
                            {Math.round(turn.overallScore)}%
                          </span>
                          {totalErrors > 0 && (
                            <span className="text-[11px] bg-red-50 text-red-500 font-semibold px-2 py-0.5 rounded-full border border-red-200">
                              {totalErrors} {totalErrors === 1 ? "error" : "errors"}
                            </span>
                          )}
                        </div>
                        <svg
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Words */}
                      <div className="px-4 pb-3.5">
                        <div className={`leading-[2.6] text-[15px] ${isJapanese ? "tracking-wide" : ""}`}>
                          {turn.words.length > 0 ? (
                            turn.words.map((w, i) => {
                              const isErr = w.errorType !== "None";
                              const isEnabled = enabledErrors[w.errorType];
                              const errStyle = isErr && isEnabled ? ERROR_WORD_STYLES[w.errorType] : null;
                              const isWS = selectedWord?.turnIdx === turnIdx && selectedWord?.wordIdx === i;

                              const wordClass = errStyle
                                ? `select-none ${errStyle} px-1.5 py-0.5 rounded-md text-[15px] font-medium`
                                : w.accuracyScore >= 80
                                  ? "select-none text-slate-700"
                                  : w.accuracyScore >= 60
                                    ? "select-none text-amber-600 font-medium"
                                    : "select-none text-red-500 font-medium";

                              return (
                                <span key={i} className={`relative inline-block ${isJapanese ? "mr-0" : "mr-1.5"}`}>
                                  <span
                                    className={`${wordClass} cursor-pointer transition-all duration-100 rounded-md px-0.5
                                      hover:bg-indigo-50 hover:text-indigo-700
                                      ${isWS ? "ring-2 ring-indigo-400 bg-indigo-50 text-indigo-700" : ""}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedWord(isWS ? null : { turnIdx, wordIdx: i });
                                    }}
                                  >
                                    {w.word}
                                  </span>

                                  {/* Word Detail Tooltip */}
                                  {isWS && ((w.phonemes && w.phonemes.length > 0) || (w.syllables && w.syllables.length > 0)) && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50">
                                      <div className="bg-slate-800 text-white rounded-xl shadow-xl shadow-slate-900/20 px-3.5 py-2.5 whitespace-nowrap">
                                        <div className="text-sm text-center mb-2 font-medium">
                                          <span className="text-white">{w.word}</span>
                                          <span className="text-slate-400 mx-1.5">·</span>
                                          <span className={`${scoreColor(w.accuracyScore).text === "text-emerald-600" ? "text-emerald-400" : scoreColor(w.accuracyScore).text === "text-amber-600" ? "text-amber-400" : "text-red-400"} font-bold`}>
                                            {Math.round(w.accuracyScore)}
                                          </span>
                                        </div>
                                        {/* Syllables / Mora */}
                                        {w.syllables && w.syllables.length > 0 && (
                                          <div className={isJapanese ? "" : "mb-2.5 pb-2.5 border-b border-slate-700/50"}>
                                            <div className="flex gap-1.5 justify-center">
                                              {w.syllables.map((s, si) => {
                                                const sc = scoreColor(s.accuracyScore);
                                                return (
                                                  <div key={si} className="flex flex-col items-center gap-0.5">
                                                    <span className={`text-sm font-semibold text-white px-1.5 py-0.5 rounded ${sc.bar}`}>
                                                      {s.syllable}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 tabular-nums font-semibold mt-0.5">
                                                      {Math.round(s.accuracyScore)}
                                                    </span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}

                                        {/* Phonemes (English only — Japanese uses mora above) */}
                                        {!isJapanese && w.phonemes && w.phonemes.length > 0 && (
                                        <div className="flex gap-1 justify-center">
                                          {w.phonemes.map((p, pi) => {
                                            const pc = scoreColor(p.accuracyScore);
                                            return (
                                              <div key={pi} className="flex flex-col items-center gap-0.5">
                                                <div className={`${pc.bar} text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-lg`}>
                                                  {p.phoneme}
                                                </div>
                                                <span className="text-[11px] text-slate-400 tabular-nums font-semibold">
                                                  {Math.round(p.accuracyScore)}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        )}
                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-[7px] border-r-[7px] border-b-[7px] border-l-transparent border-r-transparent border-b-slate-800" />
                                      </div>
                                    </div>
                                  )}
                                </span>
                              );
                            })
                          ) : (
                            <p className="text-slate-400">{turn.text}</p>
                          )}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            {[
                              { label: "Accuracy", value: turn.accuracyScore },
                              { label: "Fluency", value: turn.fluencyScore },
                              { label: "Prosody", value: turn.prosodyScore },
                            ].map((m) => {
                              const mc = scoreColor(m.value);
                              return (
                                <div key={m.label}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-400 font-medium">{m.label}</span>
                                    <span className={`text-xs font-bold tabular-nums ${mc.text}`}>
                                      {Math.round(m.value)}
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${mc.bar} transition-all duration-500`}
                                      style={{ width: `${m.value}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {turnErrorList.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {turnErrorList.map((et) => (
                                <div key={et.key} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                                  <span className={`w-2 h-2 rounded-full ${et.dot}`} />
                                  <span className="text-xs text-slate-500 font-medium">{et.label}</span>
                                  <span className="text-xs text-slate-400 font-bold">{turnErrors[et.key]}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              No errors detected
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-400">{data.fullText}</p>
              )}
            </div>

            {/* ─── Right: Error Toggles ─── */}
            <div className="p-6 lg:p-7 border-t lg:border-t-0 lg:border-l border-slate-100 rounded-b-2xl lg:rounded-r-2xl lg:rounded-bl-none">
              <h3 className="text-xs font-bold text-slate-400 mb-5 uppercase tracking-widest">
                Errors
              </h3>
              <div className="space-y-4">
                {ALL_ERROR_TYPES.map((errorType) => {
                  const count = errorCounts[errorType.key] || 0;
                  return (
                    <div key={errorType.key} className="group/error">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`min-w-[20px] h-5 px-1 rounded-md shrink-0 ${count > 0 ? errorType.color : "bg-slate-200"} flex items-center justify-center text-white text-[11px] font-bold`}>
                            {count}
                          </span>
                          <span className={`text-sm truncate ${count > 0 ? "text-slate-600" : "text-slate-400"} flex items-center gap-1`}>
                            <span className="truncate">{errorType.label}</span>
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex items-center justify-center shrink-0 cursor-help rounded-full hover:bg-slate-100 p-0.5 transition-colors">
                                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-white text-slate-600 border border-slate-200 shadow-lg text-[11px] px-2.5 py-1.5 mb-1 z-50">
                                  {errorType.hint}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </span>
                        </div>
                        <button
                          onClick={() => toggleError(errorType.key)}
                          className={`shrink-0 relative rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${enabledErrors[errorType.key] ? "bg-indigo-500" : "bg-slate-200"
                            }`}
                          role="switch"
                          aria-checked={enabledErrors[errorType.key]}
                          aria-label={`Toggle ${errorType.label}`}
                          style={{ width: 38, height: 22 }}
                        >
                          <span
                            className={`absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${enabledErrors[errorType.key] ? "translate-x-4" : "translate-x-0"
                              }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ Score Cards ═══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pronunciation Score */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="text-xs font-bold text-slate-400 mb-5 uppercase tracking-widest">
              Pronunciation Score
            </h3>
            <div className="flex items-center gap-7">
              <ScoreRing score={data.pronunciationScore} />
              <div className="flex-1 space-y-3">
                <MetricBar label={isJapanese ? "正確さ (Accuracy)" : "Accuracy"} score={data.accuracyScore} hint={isJapanese ? "各音の発音精度" : "How correctly each sound is pronounced"} />
                <MetricBar label={isJapanese ? "流暢さ (Fluency)" : "Fluency"} score={data.fluencyScore} hint={isJapanese ? "滑らかさと自然なペース" : "Smoothness and natural pace of speech"} />
                <MetricBar label={isJapanese ? "韻律 (Prosody)" : "Prosody"} score={data.prosodyScore} hint={isJapanese ? "イントネーション、アクセント、リズム" : "Intonation, stress, and rhythm patterns"} />
                {mode === "scripted" && data.completenessScore !== undefined && (
                  <MetricBar label="Completeness" score={data.completenessScore} hint="How much of the script was spoken" />
                )}
              </div>
            </div>
          </div>

          {/* Content Score */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="text-xs font-bold text-slate-400 mb-5 uppercase tracking-widest">
              Content Score
            </h3>
            <div className="flex items-center gap-7">
              <ScoreRing score={data.contentScore} />
              <div className="flex-1 space-y-3">
                <MetricBar label={isJapanese ? "文法 (Grammar)" : "Grammar"} score={data.grammarScore} hint={isJapanese ? "助詞・活用・敬語の正確さ" : "Correctness of sentence structure"} />
                <MetricBar label={isJapanese ? "話題関連性 (Relevance)" : "Topic Relevance"} score={data.relevanceScore} hint={isJapanese ? "シナリオとの適合性" : "How well responses fit the scenario"} />
                <MetricBar label={isJapanese ? "語彙 (Vocabulary)" : "Vocabulary"} score={data.vocabularyScore} hint={isJapanese ? "語彙の多様性と適切さ" : "Range and appropriateness of words used"} />
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ Actions ═══════════ */}
        {!isEmbedded && (
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="h-12 px-6 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-sm
                hover:border-slate-300 hover:text-slate-800 active:scale-[0.98] transition-all duration-150 cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Back
            </button>
            <button
              onClick={onRetry}
              className="h-12 px-6 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-sm
                hover:border-slate-300 hover:text-slate-800 active:scale-[0.98] transition-all duration-150 cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export type { AssessmentData, WordAssessment, TurnAssessment };
