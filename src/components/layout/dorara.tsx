"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import {
  X,
  Send,
  Sparkles,
  BookOpen,
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Mic,
  Brain,
  Target,
  GraduationCap,
  Notebook,
  Zap,
  ArrowRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { DoraraChatMessage } from "@/actions/dorara";
import { DoraraMessageRenderer } from "@/components/dorara/dorara-message-renderer";
import { useDoraraStream } from "@/hooks/useDoraraStream";

const STORAGE_KEY = "dorara-chat-history-v2";
const MAX_MESSAGES = 100;
// Initial message generation moved inside component

// ── Context-aware quick actions ─────────────────────────────────────────

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  message: string;
}

function getQuickActionsForPage(pathname: string, langStr: string): QuickAction[] {
  const cleanPath = pathname.split("?")[0].replace(/\/$/, "") || "/";

  if (cleanPath === "/speaking-room" || cleanPath.startsWith("/speaking-room/")) {
    return [
      { icon: Mic, label: "Review my speaking", message: "How were my recent speaking sessions? What should I improve?" },
      { icon: Target, label: "Suggest a scenario", message: "What speaking scenario should I practice next based on my level?" },
      { icon: Lightbulb, label: "Speaking tips", message: `Give me tips to improve my ${langStr} speaking fluency!` },
    ];
  }
  if (cleanPath === "/vocabulary-hub" || cleanPath.startsWith("/vocabulary-hub/")) {
    return [
      { icon: BookOpen, label: "Teach me a word", message: `Teach me a useful ${langStr} word that matches my level with examples!` },
      { icon: Brain, label: "Quiz me", message: "Give me a vocabulary quiz question to test my knowledge!" },
      { icon: Zap, label: "Word of the day", message: "What's a great word of the day? Include phonetics and examples." },
    ];
  }
  if (cleanPath === "/grammar-hub" || cleanPath.startsWith("/grammar-hub/")) {
    return [
      { icon: GraduationCap, label: "Explain this rule", message: "Explain the grammar rule I'm studying with simple examples!" },
      { icon: Brain, label: "Grammar quiz", message: "Give me a grammar quiz question to practice!" },
      { icon: Lightbulb, label: "Common mistakes", message: `What are common grammar mistakes learners make?` },
    ];
  }
  if (cleanPath === "/notebook") {
    return [
      { icon: Notebook, label: "Review weak words", message: "Which words in my notebook need review? Quiz me on them!" },
      { icon: Brain, label: "Quiz notebook", message: "Give me a quiz based on words in my notebook!" },
      { icon: Target, label: "Study strategy", message: "Best strategy for reviewing vocabulary with spaced repetition?" },
    ];
  }
  if (cleanPath.startsWith("/user/profile")) {
    return [
      { icon: Target, label: "Analyze progress", message: "Look at my learning stats and tell me what to focus on next!" },
      { icon: Sparkles, label: "Set a goal", message: "Help me set a realistic learning goal for this week!" },
      { icon: Zap, label: "Motivate me", message: `Give me some motivation to keep learning ${langStr}!` },
    ];
  }

  return [
    { icon: BookOpen, label: "Teach me a word", message: `Teach me a useful ${langStr} word with pronunciation, meaning, and an example sentence!` },
    { icon: Brain, label: "Quiz me", message: `Give me a quick ${langStr} quiz question to test my skills!` },
    { icon: HelpCircle, label: "How to use DailyEng", message: "What features does DailyEng have? How should I start learning?" },
  ];
}

// ── Main Component ──────────────────────────────────────────────────────

export function Dorara() {
  const { user, status } = useAuth();
  const doraraOpen = useAppStore((state) => state.doraraOpen);
  const setDoraraOpen = useAppStore((state) => state.setDoraraOpen);
  const learningLanguage = useAppStore((state) => state.learningLanguage);
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<DoraraChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { streamedText, isStreaming, streamMessage } = useDoraraStream();

  const langStr = learningLanguage === "ja" ? "Japanese" : "English";

  const getInitialMessage = (): DoraraChatMessage => ({
    id: "initial",
    role: "tutor",
    content: `Hey! I'm **Dorara**, your AI ${langStr} companion.\n\nI know your learning journey — your XP, your strengths, your weak spots. Ask me anything and I'll tailor it to you.`,
    suggestedActions: [
      "Teach me a new word",
      "Quiz me on grammar",
      "How do I use DailyEng?",
    ],
  });

  const isAuthenticated = status === "authenticated" && !!user;
  const isLoading = isStreaming;
  const quickActions = getQuickActionsForPage(pathname || "/", langStr);
  const lastTutorMessage = [...messages].reverse().find((m) => m.role === "tutor");
  const aiSuggestedActions = lastTutorMessage?.suggestedActions || [];

  // Load/save localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          } else {
            setMessages([getInitialMessage()]);
          }
        } else {
          setMessages([getInitialMessage()]);
        }
      } catch (e) { 
        console.error("Error loading chat:", e); 
        setMessages([getInitialMessage()]);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined" && messages.length > 0) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); }
      catch (e) { console.error("Error saving chat:", e); }
    }
  }, [messages, isInitialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (doraraOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [doraraOpen]);

  // Lock body scroll when expanded so mouse wheel goes to Dorara, not the page
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  if (!isAuthenticated) return null;

  const isAtLimit = messages.length >= MAX_MESSAGES;

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleSend = async (overrideMessage?: string) => {
    const messageText = overrideMessage || input.trim();
    if (!messageText) return;
    if (isAtLimit) { setShowLimitWarning(true); return; }

    const userMessage: DoraraChatMessage = {
      id: Date.now().toString(), role: "user", content: messageText,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Stream AI response via SSE for real-time typing effect
    const result = await streamMessage(messages, messageText, pathname || "/", learningLanguage);
    setMessages((prev) => [...prev, {
      id: (Date.now() + 1).toString(), role: "tutor",
      content: (result as any).error || result.response,
      suggestedActions: result.suggestedActions,
      vocabHighlights: result.vocabHighlights,
      quizQuestion: result.quizQuestion,
    }]);
  };


  const handleClearHistory = () => {
    setMessages([getInitialMessage()]);
    setShowLimitWarning(false);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Floating Trigger ──────────────────────────────────────── */}
      {!doraraOpen && (
        <button
          onClick={() => setDoraraOpen(true)}
          className="
            fixed bottom-6 right-6 z-50 cursor-pointer
            h-14 w-14 rounded-2xl
            bg-gradient-to-br from-primary-600 to-primary-700
            text-white
            shadow-[0_4px_20px_rgba(79,70,229,0.35)]
            hover:shadow-[0_6px_28px_rgba(79,70,229,0.5)]
            hover:-translate-y-0.5
            active:translate-y-0
            flex items-center justify-center
            border border-primary-500/40
            transition-all duration-200 ease-out
          "
          aria-label="Open Dorara"
        >
          <Image
            src="/dorara-assistant.png"
            alt="Dorara"
            width={32}
            height={32}
            className="rounded-xl"
          />
        </button>
      )}

      {/* ── Chat Panel ────────────────────────────────────────────── */}
      {doraraOpen && (
        <>
          {/* Fullscreen backdrop */}
          {isExpanded && (
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsExpanded(false)}
            />
          )}
        <div
          className={`
            fixed z-50
            bg-white/95
            backdrop-blur-xl
            border border-primary-200/50
            flex flex-col
            overflow-hidden
            transition-all duration-300 ease-in-out
            ${
              isExpanded
                ? "inset-4 rounded-2xl shadow-[0_24px_80px_rgba(79,70,229,0.25),0_8px_32px_rgba(0,0,0,0.12)]"
                : "bottom-6 right-6 w-[420px] max-w-[calc(100vw-32px)] h-[600px] rounded-2xl shadow-[0_8px_40px_rgba(79,70,229,0.12),0_2px_8px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-3 duration-200"
            }
          `}
        >
          {/* ── Header ──────────────────────────────────────────── */}
          <div className="relative overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800" />
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }} />

            <div className="relative pt-4 pb-3">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
                      <Image src="/dorara-assistant.png" alt="Dorara" width={28} height={28} className="rounded-lg" />
                    </div>
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent-400 border-2 border-primary-700 shadow-sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-[15px] tracking-tight">
                        Dorara
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/15 backdrop-blur-sm text-[10px] font-semibold text-white/90 uppercase tracking-wider">
                        <Sparkles className="h-2.5 w-2.5" />
                        AI
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 font-medium">
                      {langStr} Learning Companion
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handleClearHistory}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
                    aria-label="New chat"
                    title="New Chat"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
                    aria-label={isExpanded ? "Thu nhỏ" : "Mở rộng toàn màn hình"}
                    title={isExpanded ? "Thu nhỏ" : "Toàn màn hình"}
                  >
                    {isExpanded
                      ? <Minimize2 className="h-3.5 w-3.5" />
                      : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => { setDoraraOpen(false); setIsExpanded(false); }}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Quick actions — pills */}
              <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5 scrollbar-none w-full">
                {/* Spacer for left padding (16px total = 10px + 6px gap) */}
                <div className="w-2.5 flex-shrink-0" />
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSend(action.message)}
                    disabled={isLoading}
                    className="
                      flex items-center gap-1.5
                      px-2.5 py-1.5
                      rounded-lg
                      bg-white/10 backdrop-blur-sm border border-white/10
                      hover:bg-white/20 hover:border-white/20
                      text-white/80 hover:text-white
                      text-[11px] font-medium
                      transition-all duration-150
                      whitespace-nowrap flex-shrink-0
                      disabled:opacity-40 disabled:cursor-not-allowed
                      cursor-pointer
                    "
                  >
                    <action.icon className="h-3 w-3 opacity-70" />
                    {action.label}
                  </button>
                ))}
                {/* Spacer for right padding (ensure it never touches the edge) */}
                <div className="w-2.5 flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* ── Limit Warning ──────────────────────────────────── */}
          {showLimitWarning && (
            <div className="bg-amber-50/80 border-b border-amber-200/60 px-4 py-2 flex items-center gap-2 text-amber-700 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Message limit reached.</span>
              <button onClick={handleClearHistory} className="ml-auto text-amber-600 hover:text-amber-800 font-semibold cursor-pointer">
                New Chat
              </button>
            </div>
          )}

          {/* ── Messages ──────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-gray-50/30 to-white scrollbar-none">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {/* Tutor avatar */}
                {msg.role === "tutor" && (
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 mr-2 flex-shrink-0 flex items-center justify-center shadow-sm mt-0.5">
                    <Image src="/dorara-assistant.png" alt="" width={18} height={18} className="rounded-md" />
                  </div>
                )}
                {/* Message bubble */}
                <div
                  className={`
                    max-w-[82%] px-3.5 py-2.5
                    ${msg.role === "user"
                      ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl rounded-br-lg shadow-[0_2px_8px_rgba(79,70,229,0.2)] text-[13px] leading-relaxed"
                      : "bg-white text-foreground rounded-2xl rounded-bl-lg border border-gray-200/60 shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
                    }
                  `}
                >
                  {msg.role === "tutor" ? (
                    <DoraraMessageRenderer message={msg} />
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming AI response — live typing effect */}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 mr-2 flex-shrink-0 flex items-center justify-center shadow-sm mt-0.5">
                  <Image src="/dorara-assistant.png" alt="" width={18} height={18} className="rounded-md" />
                </div>
                <div className="max-w-[82%] px-3.5 py-2.5 bg-white text-foreground rounded-2xl rounded-bl-lg border border-gray-200/60 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                  {streamedText ? (
                    <DoraraMessageRenderer
                      message={{ id: "streaming", role: "tutor", content: streamedText }}
                    />
                  ) : (
                    <div className="flex gap-1 items-center py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1.4s" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-300 animate-bounce" style={{ animationDelay: "200ms", animationDuration: "1.4s" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-200 animate-bounce" style={{ animationDelay: "400ms", animationDuration: "1.4s" }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI-suggested follow-up actions */}
            {!isLoading && aiSuggestedActions.length > 0 && messages.length > 1 && (
              <div className="flex flex-wrap gap-1.5 pl-9">
                {aiSuggestedActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(action)}
                    className="
                      inline-flex items-center gap-1
                      px-3 py-1.5 rounded-xl
                      border border-primary-200/50
                      bg-primary-50/40
                      text-[11px] text-primary-700 font-medium
                      hover:bg-primary-100/60 hover:border-primary-300/50
                      transition-all duration-150
                      cursor-pointer
                    "
                  >
                    {action}
                    <ArrowRight className="h-2.5 w-2.5 opacity-50" />
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input ──────────────────────────────────────────── */}
          <div className="border-t border-gray-100 bg-white px-4 py-3">
            <div className="flex gap-2 items-end">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="
                  flex-1 rounded-xl
                  border border-gray-200/80 bg-gray-50/50
                  px-3.5 py-2.5
                  text-[13px] text-foreground
                  placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-primary-300/40 focus:border-primary-300/60 focus:bg-white
                  transition-all duration-200
                  disabled:opacity-40
                "
                aria-label="Message input"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="
                  h-10 w-10 rounded-xl
                  bg-gradient-to-br from-primary-600 to-primary-700
                  hover:from-primary-700 hover:to-primary-800
                  text-white
                  shadow-[0_2px_8px_rgba(79,70,229,0.25)]
                  hover:shadow-[0_4px_12px_rgba(79,70,229,0.35)]
                  hover:-translate-y-px
                  active:translate-y-0
                  transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0
                  cursor-pointer
                  flex items-center justify-center flex-shrink-0
                "
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center tracking-wide">
              {messages.length}/{MAX_MESSAGES} messages
            </p>
          </div>
        </div>
        </>
      )}
    </>
  );
}
