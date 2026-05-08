"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, Pause } from "lucide-react";
import { useAppStore } from "@/lib/store";

// ─── Curated Voice List ────────────────────────────

export interface VoiceOption {
  id: string;
  label: string;
  gender: "female" | "male";
  style: string;
  accent: string;
  waveform: number[];
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "en-US-JennyNeural", label: "Jenny", gender: "female",
    style: "Friendly & warm", accent: "hsl(340, 65%, 55%)",
    waveform: [0.3, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.3, 0.6, 0.9],
  },
  {
    id: "en-US-AriaNeural", label: "Aria", gender: "female",
    style: "Professional", accent: "hsl(260, 55%, 55%)",
    waveform: [0.4, 0.6, 0.5, 0.7, 0.5, 0.6, 0.4, 0.7, 0.5, 0.6, 0.4, 0.7],
  },
  {
    id: "en-US-SaraNeural", label: "Sara", gender: "female",
    style: "Casual & bright", accent: "hsl(30, 80%, 55%)",
    waveform: [0.5, 0.8, 0.3, 0.9, 0.4, 0.8, 0.6, 0.3, 0.9, 0.5, 0.7, 0.4],
  },
  {
    id: "en-US-JaneNeural", label: "Jane", gender: "female",
    style: "Neutral & clear", accent: "hsl(180, 50%, 45%)",
    waveform: [0.4, 0.5, 0.6, 0.5, 0.6, 0.5, 0.4, 0.6, 0.5, 0.4, 0.5, 0.6],
  },
  {
    id: "en-US-GuyNeural", label: "Guy", gender: "male",
    style: "Confident", accent: "hsl(220, 60%, 50%)",
    waveform: [0.6, 0.8, 0.7, 0.9, 0.6, 0.8, 0.5, 0.9, 0.7, 0.6, 0.8, 0.5],
  },
  {
    id: "en-US-DavisNeural", label: "Davis", gender: "male",
    style: "Calm & natural", accent: "hsl(160, 45%, 45%)",
    waveform: [0.3, 0.4, 0.6, 0.5, 0.4, 0.6, 0.3, 0.5, 0.4, 0.6, 0.3, 0.5],
  },
  {
    id: "en-US-TonyNeural", label: "Tony", gender: "male",
    style: "Friendly & casual", accent: "hsl(25, 70%, 50%)",
    waveform: [0.5, 0.7, 0.4, 0.8, 0.5, 0.7, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3],
  },
  {
    id: "en-US-JasonNeural", label: "Jason", gender: "male",
    style: "Relaxed", accent: "hsl(200, 50%, 50%)",
    waveform: [0.3, 0.5, 0.4, 0.6, 0.3, 0.5, 0.4, 0.3, 0.5, 0.4, 0.6, 0.3],
  },
];

export const JA_VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "ja-JP-NanamiNeural", label: "Nanami", gender: "female",
    style: "Friendly & casual", accent: "hsl(340, 65%, 55%)",
    waveform: [0.3, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.3, 0.6, 0.9],
  },
  {
    id: "ja-JP-KeitaNeural", label: "Keita", gender: "male",
    style: "Professional", accent: "hsl(220, 60%, 50%)",
    waveform: [0.6, 0.8, 0.7, 0.9, 0.6, 0.8, 0.5, 0.9, 0.7, 0.6, 0.8, 0.5],
  },
  {
    id: "ja-JP-MayuNeural", label: "Mayu", gender: "female",
    style: "Warm", accent: "hsl(30, 80%, 55%)",
    waveform: [0.4, 0.6, 0.5, 0.7, 0.5, 0.6, 0.4, 0.7, 0.5, 0.6, 0.4, 0.7],
  },
  {
    id: "ja-JP-NaokiNeural", label: "Naoki", gender: "male",
    style: "Calm", accent: "hsl(160, 45%, 45%)",
    waveform: [0.5, 0.7, 0.4, 0.8, 0.5, 0.7, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3],
  }
];

const PREVIEW_TEXT_EN = "Hello! I'm ready to practice speaking with you today.";
const PREVIEW_TEXT_JA = "こんにちは！今日も一緒に話す練習をしましょう。";

// ─── Mini Waveform ────────────────────────────────

const MiniWaveform = React.memo(function MiniWaveform({
  bars,
  color,
  isPlaying,
}: {
  bars: number[];
  color: string;
  isPlaying: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 20 }} aria-hidden="true">
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 999,
            height: `${h * 100}%`,
            backgroundColor: color,
            opacity: isPlaying ? 1 : 0.3,
            transition: "opacity 300ms, height 300ms",
            animation: isPlaying ? `voiceWave ${600 + i * 80}ms ease-in-out infinite alternate` : "none",
          }}
        />
      ))}
    </div>
  );
});

// ─── Voice Card ───────────────────────────────────

const VoiceCard = React.memo(function VoiceCard({
  voice,
  isSelected,
  isPlaying,
  onSelect,
  onPreview,
}: {
  voice: VoiceOption;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const cardStyle: React.CSSProperties = {
    position: "relative",
    width: 128,
    flexShrink: 0,
    borderRadius: 14,
    border: isSelected
      ? "1.5px solid var(--color-primary-400, #818cf8)"
      : hovered
        ? "1.5px solid #c7d2fe"
        : "1.5px solid #e2e8f0",
    background: isSelected ? "#f5f3ff" : "#ffffff",
    cursor: "pointer",
    overflow: "hidden",
    textAlign: "left" as const,
    transition: "border-color 200ms, box-shadow 200ms, transform 200ms",
    boxShadow: isSelected
      ? "0 0 0 2px rgba(129, 140, 248, 0.18), 0 4px 16px rgba(99, 102, 241, 0.10)"
      : hovered
        ? "0 2px 12px rgba(99, 102, 241, 0.08)"
        : "none",
    transform: hovered && !isSelected ? "translateY(-1px)" : "none",
  };

  const genderStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.04em",
    padding: "1px 6px",
    borderRadius: 4,
    lineHeight: 1.5,
    background: voice.gender === "female" ? "#fce7f3" : "#dbeafe",
    color: voice.gender === "female" ? "#be185d" : "#1d4ed8",
  };

  const playBtnStyle: React.CSSProperties = {
    width: 24,
    height: 24,
    flexShrink: 0,
    borderRadius: "50%",
    border: isPlaying ? `1.5px solid ${voice.accent}` : "1.5px solid #e2e8f0",
    background: isPlaying ? `${voice.accent}12` : "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: isPlaying ? voice.accent : "#94a3b8",
    transition: "all 150ms",
    padding: 0,
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={cardStyle}
      aria-label={`Select ${voice.label} voice — ${voice.style}`}
      aria-pressed={isSelected}
    >
      {/* Accent bar */}
      <div
        style={{
          height: isSelected ? 4 : 3,
          width: "100%",
          backgroundColor: voice.accent,
          transition: "height 200ms",
        }}
      />

      {/* Card body */}
      <div style={{ padding: "8px 10px 10px" }}>
        {/* Top: name + gender */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: isSelected ? "var(--color-primary-700, #4338ca)" : "#1e293b",
              lineHeight: 1,
            }}
          >
            {voice.label}
          </span>
          <span style={genderStyle}>
            {voice.gender === "female" ? "F" : "M"}
          </span>
        </div>

        {/* Style */}
        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.3, whiteSpace: "nowrap" }}>
          {voice.style}
        </p>

        {/* Bottom: waveform + play */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 }}>
          <MiniWaveform bars={voice.waveform} color={voice.accent} isPlaying={isPlaying} />
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onPreview();
              }
            }}
            style={playBtnStyle}
            aria-label={isPlaying ? `Stop ${voice.label} preview` : `Preview ${voice.label}`}
            title={isPlaying ? "Stop" : "Preview"}
          >
            {isPlaying ? <Pause style={{ width: 11, height: 11 }} /> : <Volume2 style={{ width: 11, height: 11 }} />}
          </div>
        </div>
      </div>
    </button>
  );
});

// ─── Main Component ──────────────────────────────

const VoiceSelector = React.memo(function VoiceSelector() {
  const ttsVoice = useAppStore((s) => s.ttsVoice);
  const setTtsVoice = useAppStore((s) => s.setTtsVoice);
  const learningLanguage = useAppStore((s) => s.learningLanguage);

  const options = learningLanguage === "ja" ? JA_VOICE_OPTIONS : VOICE_OPTIONS;

  const [mounted, setMounted] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewText = learningLanguage === "ja" ? PREVIEW_TEXT_JA : PREVIEW_TEXT_EN;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-switch voice when language changes
  useEffect(() => {
    const currentIsJa = ttsVoice.startsWith("ja-");
    const shouldBeJa = learningLanguage === "ja";
    if (shouldBeJa && !currentIsJa) {
      setTtsVoice(JA_VOICE_OPTIONS[0].id);
    } else if (!shouldBeJa && currentIsJa) {
      setTtsVoice(VOICE_OPTIONS[0].id);
    }
  }, [learningLanguage, ttsVoice, setTtsVoice]);

  // Inject waveform animation keyframes once
  useEffect(() => {
    const id = "voice-wave-kf";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = `@keyframes voiceWave{0%{transform:scaleY(.55)}100%{transform:scaleY(1.15)}}`;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const handlePreview = useCallback(async (voiceId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (previewingId === voiceId) {
      setPreviewingId(null);
      return;
    }
    setPreviewingId(voiceId);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const resp = await fetch(`${API_BASE}/speaking/speech/synthesize?targetLanguage=${learningLanguage}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: previewText, voice: voiceId }),
      });
      if (!resp.ok) throw new Error("fail");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      const cleanup = () => { setPreviewingId(null); URL.revokeObjectURL(url); audioRef.current = null; };
      audio.onended = cleanup;
      audio.onerror = cleanup;
      await audio.play();
    } catch { setPreviewingId(null); }
  }, [previewingId, learningLanguage]);

  const handleSelect = useCallback((voiceId: string) => {
    setTtsVoice(voiceId);
  }, [setTtsVoice]);

  if (!mounted) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
        Tutor Voice
      </p>

      {/* Horizontal scroll container */}
      <div
        style={{
          overflowX: "auto",
          margin: "0 -8px",
          padding: "0 8px 8px",
          scrollbarWidth: "thin",
          scrollbarColor: "#cbd5e1 transparent",
        }}
      >
        <div style={{ display: "flex", gap: 8, width: "max-content" }}>
          {options.map((v) => (
            <VoiceCard
              key={v.id}
              voice={v}
              isSelected={ttsVoice === v.id}
              isPlaying={previewingId === v.id}
              onSelect={() => handleSelect(v.id)}
              onPreview={() => handlePreview(v.id)}
            />
          ))}
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
        Choose your AI tutor&apos;s voice. Tap the <Volume2 style={{ display: "inline", width: 11, height: 11, verticalAlign: "-1px" }} /> icon to preview.
      </p>
    </div>
  );
});

export default VoiceSelector;
