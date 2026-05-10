"use client";

import { useState, useEffect, useCallback } from "react";
import { Flame, Zap, Star } from "lucide-react";
import type { XpStats } from "@/actions/xp";
import { getXpStats } from "@/actions/xp";

/**
 * Compact XP bar for the navbar — shows level, XP progress, and streak.
 * Uses Ultramarine→Neon Lime gradient for the progress fill.
 */
export function XpBar() {
  const [stats, setStats] = useState<XpStats | null>(null);
  const [animate, setAnimate] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getXpStats();
      setStats(data);
    } catch {
      // Not logged in or API error — hide silently
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Intentionally removed setInterval polling here.
    // XP updates are now entirely event-driven via the "xp-awarded" event below.
  }, [fetchStats]);

  // Listen for custom xp-awarded events (dispatched by XpToast)
  useEffect(() => {
    const handler = () => {
      setAnimate(true);
      fetchStats();
      setTimeout(() => setAnimate(false), 600);
    };
    window.addEventListener("xp-awarded", handler);
    return () => window.removeEventListener("xp-awarded", handler);
  }, [fetchStats]);

  if (!stats) return null;

  const xpInLevel = stats.totalXp - stats.xpForCurrentLevel;
  const xpNeeded = stats.xpForNextLevel - stats.xpForCurrentLevel;
  const progress = xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full
        bg-white/60 backdrop-blur-md border border-primary-100
        shadow-sm hover:shadow-md transition-all duration-300 cursor-default
        ${animate ? "xp-pulse" : ""}`}
    >
      {/* Level badge */}
      <div className="relative flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white
            bg-gradient-to-br from-primary-500 to-primary-700 shadow-md"
        >
          {stats.level}
        </div>
        {/* Ring glow on animate */}
        {animate && (
          <div className="absolute inset-0 rounded-full bg-primary-400/30 animate-ping" />
        )}
      </div>

      {/* XP progress */}
      <div className="flex flex-col gap-0.5 min-w-[80px]">
        <div className="flex items-center justify-between text-[10px] font-semibold">
          <span className="text-primary-700 flex items-center gap-0.5">
            <Zap size={10} className="text-accent-500" />
            {stats.totalXp.toLocaleString()} XP
          </span>
          <span className="text-gray-400">
            Lv {stats.level + 1}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out xp-bar-gradient"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Streak flame */}
      {stats.streak > 0 && (
        <div className="flex items-center gap-0.5 pl-1 border-l border-primary-100">
          <Flame size={14} className="text-orange-500 streak-flame" />
          <span className="text-xs font-bold text-orange-600">
            {stats.streak}
          </span>
        </div>
      )}
    </div>
  );
}
