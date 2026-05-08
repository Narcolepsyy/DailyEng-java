import type { ReactNode } from "react";

// ─── Word-level pronunciation assessment ────────────
export interface WordAssessment {
  word: string;
  accuracyScore: number;
  /** None, Mispronunciation, UnexpectedBreak, MissingBreak, Monotone */
  errorType: string;
  phonemes?: { phoneme: string; accuracyScore: number }[];
  syllables?: { syllable: string; accuracyScore: number }[];
}

// ─── Aggregate pronunciation scores ─────────────────
export interface PronunciationScores {
  accuracyScore: number;
  fluencyScore: number;
  prosodyScore: number;
  overallScore: number;
  completenessScore?: number;
}

// ─── Conversation turn ──────────────────────────────
export interface Turn {
  id: string;
  role: "user" | "tutor";
  text: string;
  timestamp: Date;
  wordAssessments?: WordAssessment[];
  pronunciationScores?: PronunciationScores;
  correctionHint?: string;
  relevanceHint?: string;
  scores?: {
    accuracy?: number;
    fluency?: number;
    grammar?: number;
    content?: number;
    topic?: number;
    prosody?: number;
  };
}

// ─── View state machine ─────────────────────────────
export type ViewState =
  | "preparation"
  | "active"
  | "analyzing"
  | "complete"
  | "history"
  | "record-review";

// ─── Domain models ──────────────────────────────────
export interface LearningRecord {
  id: string;
  overallScore: number;
  grammarScore: number;
  topicScore: number;
  fluencyScore: number;
  accuracyScore: number;
  prosodyScore: number;
  vocabularyScore: number;
  date: Date;
}

export interface DetailedFeedbackScore {
  label: string;
  value: number;
}

export interface ErrorCategory {
  name: string;
  count: number;
}

export interface ConversationItem {
  role: "tutor" | "user";
  text: string;
  userErrors?: Array<{
    word: string;
    correction: string;
    type: string;
  }>;
  correctedSentence?: string;
  audioUrl?: string;
}

export interface DetailedFeedbackData {
  scores: DetailedFeedbackScore[];
  errorCategories: ErrorCategory[];
  conversation: ConversationItem[];
  overallRating: string;
  tip: string;
}

export interface ScenarioData {
  id: string;
  title: string;
  description?: string;
  context?: string;
  goal?: string;
  objectives?: string[];
  userRole?: string;
  botRole?: string;
  openingLine?: string;
  image?: string;
}

export interface InitialTurn {
  id: string;
  role: "user" | "tutor";
  text: string;
  /** ISO string for serialization */
  timestamp: string;
  scores?: {
    accuracy?: number;
    fluency?: number;
    grammar?: number;
    content?: number;
    topic?: number;
    prosody?: number;
  };
}

// ─── Component props ────────────────────────────────
export interface SpeakingSessionClientProps {
  scenarioId: string;
  scenario: ScenarioData | null;
  initialTurns: InitialTurn[];
  learningRecords: LearningRecord[];
}

// ─── Analysis result from server ────────────────────
export interface AnalysisResult {
  scores: {
    grammar: number;
    topic: number;
    fluency: number;
    accuracy: number;
    prosody: number;
    vocabulary: number;
    overall: number;
  };
  sessionAnalysis: {
    feedbackTitle: string;
    feedbackSummary: string;
    feedbackRating: string;
    feedbackTip: string;
  };
  errorCategories: { name: string; count: number }[];
  conversation: {
    role: "user" | "tutor";
    text: string;
    turnId: string;
    userErrors?: {
      word: string;
      correction: string;
      type: string;
      startIndex: number;
      endIndex: number;
    }[];
  }[];
  newLevel?: string;
  previousLevel?: string;
  correctedSentences?: { turnIndex: number; original: string; corrected: string }[];
  vocabularyHighlights?: string[];
  suggestedPhrases?: { used: string; better: string }[];
}

// ─── Loaded session data (from history) ─────────────
export interface LoadedSessionData {
  scores: {
    grammar: number;
    topic: number;
    fluency: number;
    accuracy: number;
    prosody: number;
    vocabulary: number;
    overall: number;
  };
  conversation: {
    role: string;
    text: string;
    accuracyScore?: number;
    fluencyScore?: number;
    wordAssessments?: WordAssessment[];
  }[];
}

// ─── Session scores (for radar chart etc.) ──────────
export interface SessionScores {
  grammar: number;
  topic: number;
  fluency: number;
  accuracy: number;
  prosody: number;
  vocabulary: number;
  overall: number;
}
