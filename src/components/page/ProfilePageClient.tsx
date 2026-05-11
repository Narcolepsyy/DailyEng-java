"use client"

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Clock, BookOpen, Flame, TrendingUp, Quote, Zap, Star, Trophy } from "lucide-react";
import { UserProfileSidebar } from "@/components/layout/user-profile-sidebar";
import { ProtectedRoute, PageIcons } from "@/components/auth/protected-route";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { getXpStats, getActivityHistory } from "@/actions/xp";
import type { XpStats, ActivityDay } from "@/actions/xp";

interface ProfilePageClientProps {
  userName?: string;
  userLevel?: string;
  quote?: { text: string; author: string } | null;
}

export default function ProfilePageClient({
  userName = "User",
  userLevel = "A1",
  quote,
}: ProfilePageClientProps) {
  const { profile } = useUserProfile();

  // Fetch real XP data from API
  const [xpStats, setXpStats] = useState<XpStats | null>(null);
  const [activityData, setActivityData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [stats, history] = await Promise.all([
          getXpStats(),
          getActivityHistory(365),
        ]);
        setXpStats(stats);

        // Convert activity days to heatmap format
        const heatmap: Record<string, number> = {};
        for (const day of history.days) {
          heatmap[day.date] = day.lessonsCount;
        }
        setActivityData(heatmap);
      } catch {
        // API not available — show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate streak from XP stats (real data) or 0
  const currentStreak = xpStats?.streak ?? 0;

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // XP level progress
  const xpInLevel = xpStats ? xpStats.totalXp - xpStats.xpForCurrentLevel : 0;
  const xpNeeded = xpStats ? xpStats.xpForNextLevel - xpStats.xpForCurrentLevel : 1;
  const xpProgress = xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 0;

  // Format study time from total XP (rough estimate: 1 XP ≈ 1 minute)
  const totalMinutes = xpStats?.totalXp ? Math.round(xpStats.totalXp / 2) : 0;
  const studyHours = Math.floor(totalMinutes / 60);
  const studyMins = totalMinutes % 60;

  return (
    <ProtectedRoute
      pageName="Profile"
      pageDescription="Track your learning progress, complete daily missions, and view your achievements."
      pageIcon={PageIcons.profile}
    >
      <div className="container mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* ================= LEFT SIDEBAR ================= */}
          <div className="md:col-span-3 lg:col-span-3 space-y-6">
            <UserProfileSidebar
              activePage="profile"
              userName={profile?.name || userName}
              userImage={profile?.image}
            />
          </div>

          {/* ================= MAIN CONTENT ================= */}
          <div className="md:col-span-9 lg:col-span-9 space-y-6">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary-50 to-secondary-50 p-6 text-white shadow-sm border-2 border-border">
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-primary-600 text-sm font-medium">
                      {getGreeting()}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-primary-800">
                    Welcome back, {profile?.name || userName}!
                  </h1>
                  <p className="text-primary-600 text-sm">
                    {currentStreak > 0
                      ? `You're on a ${currentStreak}-day streak! Keep up the great work.`
                      : "Start your learning journey today and build your streak!"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
                    <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">
                      Current Level
                    </p>
                    <div className="text-3xl font-black mt-1 text-secondary-500">
                      {userLevel}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Level Card */}
            {xpStats && (
              <Card className="border-2 border-border shadow-md bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg font-black">{xpStats.level}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Level {xpStats.level}</h3>
                      <p className="text-sm text-slate-500">
                        {xpStats.totalXp.toLocaleString()} total XP
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-accent-600">
                    <Zap size={16} className="text-accent-500" />
                    {xpInLevel} / {xpNeeded} XP to Level {xpStats.level + 1}
                  </div>
                </div>

                {/* XP Progress Bar */}
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full xp-bar-gradient transition-all duration-1000 ease-out"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>

                {/* Skill Scores */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5">
                  <SkillBadge label="Vocab" score={xpStats.vocabScore} color="from-blue-500 to-indigo-500" />
                  <SkillBadge label="Grammar" score={xpStats.grammarScore} color="from-purple-500 to-violet-500" />
                  <SkillBadge label="Speaking" score={xpStats.speakingScore} color="from-pink-500 to-rose-500" />
                  <SkillBadge label="Listening" score={xpStats.listeningScore} color="from-orange-500 to-amber-500" />
                  <SkillBadge label="Reading" score={xpStats.readingScore} color="from-teal-500 to-emerald-500" />
                  <SkillBadge label="Writing" score={xpStats.writingScore} color="from-cyan-500 to-blue-500" />
                </div>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                label="Total Study Time"
                value={studyHours > 0 ? `${studyHours}h ${studyMins}m` : `${studyMins}m`}
                icon={<Clock className="text-yellow-500" size={20} />}
                trend={xpStats ? `${xpStats.totalXp.toLocaleString()} XP earned` : "Start learning"}
                trendUp={!!xpStats?.totalXp}
                bgColor="bg-gradient-to-br from-yellow-50 to-orange-50"
                iconBg="bg-yellow-100"
              />
              <StatCard
                label="Day Streak"
                value={
                  currentStreak === 0
                    ? "0 Days"
                    : `${currentStreak} ${currentStreak === 1 ? "Day" : "Days"}`
                }
                icon={<Flame className="text-orange-500" size={20} />}
                trend={currentStreak > 0 ? "Keep going!" : "Start today!"}
                trendUp={currentStreak > 0}
                bgColor="bg-gradient-to-br from-orange-50 to-red-50"
                iconBg="bg-orange-100"
              />
              <StatCard
                label="Coins"
                value={xpStats?.coins?.toLocaleString() ?? "0"}
                icon={<Star className="text-accent-500" size={20} />}
                trend={xpStats?.badges?.length ? `${xpStats.badges.length} badges` : "Earn more"}
                trendUp={!!xpStats?.coins}
                bgColor="bg-gradient-to-br from-accent-50 to-emerald-50"
                iconBg="bg-accent-100"
              />
            </div>

            {/* Study Heat Map */}
            <Card className="border-2 border-border shadow-md bg-white p-6">
              {loading ? (
                <div className="h-32 flex items-center justify-center text-gray-400">
                  Loading activity data...
                </div>
              ) : (
                <ActivityHeatmap data={activityData} />
              )}
            </Card>

            {/* Daily Quote */}
            {quote && (
              <Card className="border-2 border-border shadow-md bg-white p-8">
                <div className="flex flex-col items-center text-center">
                  <Quote className="w-10 h-10 text-primary-300 mb-4 rotate-180" />
                  <blockquote className="text-lg md:text-xl font-medium text-slate-700 italic leading-relaxed max-w-2xl">
                    &quot;{quote.text}&quot;
                  </blockquote>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-8 h-[2px] bg-primary-300"></div>
                    <cite className="text-sm font-semibold text-primary-600 not-italic">
                      {quote.author}
                    </cite>
                    <div className="w-8 h-[2px] bg-primary-300"></div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

/* --- Helper Components --- */

function SkillBadge({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
        <span className="text-white text-xs font-bold">{score}</span>
      </div>
      <span className="text-[10px] font-medium text-gray-500">{label}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
  trendUp,
  bgColor = "bg-white",
  iconBg = "bg-slate-50",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  bgColor?: string;
  iconBg?: string;
}) {
  return (
    <Card
      className={`p-4 border-none shadow-md ${bgColor} hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2.5 ${iconBg} rounded-xl group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
          <p className="text-xl font-bold text-slate-800 truncate">{value}</p>
          {trend && (
            <div
              className={`flex items-center gap-1 mt-1 text-xs font-medium ${trendUp ? "text-accent-600" : "text-slate-500"
                }`}
            >
              {trendUp && <TrendingUp size={10} />}
              {trend}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ActivityHeatmap({ data }: { data: Record<string, number> }) {
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    date: string;
    count: number;
  } | null>(null);

  // ⚡ Bolt: Memoize expensive heatmap layout calculations to prevent recalculation on every tooltip hover
  const { totalLessons, activeDays, maxStreak, weeks, monthPositions } = useMemo(() => {
    const sortedDates = Object.keys(data).sort();

    // ⚡ Bolt: Consolidate stats calculation into a single O(N) loop to prevent redundant array traversals
    let totalLessons = 0;
    let activeDays = 0;
    let maxStreak = 0;
    let currentStreak = 0;

    sortedDates.forEach((date) => {
      const count = data[date];
      if (count > 0) {
        totalLessons += count;
        activeDays++;
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    // Generate last 52 weeks of data (364 days)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 363);

    // Align to start of week (Sunday)
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    // Generate weeks array
    const weeks: Array<Array<{ date: string; count: number; isToday?: boolean }>> = [];
    const monthPositions: Array<{ month: string; weekIndex: number }> = [];
    let lastMonth = -1;

    for (let week = 0; week < 53; week++) {
      const weekDays: Array<{ date: string; count: number; isToday?: boolean }> = [];

      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + week * 7 + day);
        const dateStr = currentDate.toISOString().split("T")[0];
        const isToday = dateStr === today.toISOString().split("T")[0];
        const isFuture = currentDate > today;

        if (day === 0) {
          const month = currentDate.getMonth();
          if (month !== lastMonth && !isFuture) {
            monthPositions.push({
              month: currentDate.toLocaleDateString("vi-VN", { month: "short" }),
              weekIndex: week,
            });
            lastMonth = month;
          }
        }

        weekDays.push({
          date: isFuture ? "" : dateStr,
          count: isFuture ? -1 : data[dateStr] || 0,
          isToday,
        });
      }
      weeks.push(weekDays);
    }

    return { totalLessons, activeDays, maxStreak, weeks, monthPositions };
  }, [data]);

  const getColor = (count: number) => {
    if (count === -1) return "bg-transparent";
    if (count === 0) return "bg-[#ebedf0]";
    if (count <= 3) return "bg-[#9be9a8]";
    if (count <= 6) return "bg-[#40c463]";
    if (count <= 9) return "bg-[#30a14e]";
    return "bg-[#216e39]";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    day: { date: string; count: number }
  ) => {
    if (!day.date) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      date: day.date,
      count: day.count,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="w-full">
      {/* Stats Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-800">
            {totalLessons}
          </span>
          <span className="text-slate-600 text-sm">
            lessons in the past year
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Active days:</span>
            <span className="font-semibold text-slate-700">{activeDays}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Max streak:</span>
            <span className="font-semibold text-slate-700">{maxStreak}</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1 min-w-full">
          <div className="flex gap-[3px]">
            <div className="flex flex-col gap-[3px] pr-2 w-8">
              {dayLabels.map((label, idx) => (
                <div
                  key={idx}
                  className="h-[11px] text-[10px] text-slate-400 flex items-center justify-end"
                >
                  {label}
                </div>
              ))}
            </div>

            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {week.map((day, dayIdx) => (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    className={`w-[11px] h-[11px] rounded-[3px] ${getColor(
                      day.count
                    )} 
                      ${day.isToday
                        ? "ring-1 ring-emerald-600 ring-offset-1"
                        : ""
                      }
                      ${day.date ? "cursor-pointer" : ""}`}
                    onMouseEnter={(e) => handleMouseEnter(e, day)}
                    onMouseLeave={handleMouseLeave}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Month labels */}
          <div className="flex gap-[3px] pl-8">
            {monthPositions.map((pos, idx) => {
              const nextPos = monthPositions[idx + 1]?.weekIndex || 53;
              const width = (nextPos - pos.weekIndex) * 14;
              return (
                <div
                  key={idx}
                  className="text-[10px] text-slate-400 capitalize"
                  style={{ width: `${width}px`, minWidth: `${width}px` }}
                >
                  {pos.month}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-slate-400">
        <span>Less</span>
        <div className="flex gap-[2px]">
          <div className="w-[11px] h-[11px] rounded-[3px] bg-[#ebedf0]"></div>
          <div className="w-[11px] h-[11px] rounded-[3px] bg-[#9be9a8]"></div>
          <div className="w-[11px] h-[11px] rounded-[3px] bg-[#40c463]"></div>
          <div className="w-[11px] h-[11px] rounded-[3px] bg-[#30a14e]"></div>
          <div className="w-[11px] h-[11px] rounded-[3px] bg-[#216e39]"></div>
        </div>
        <span>More</span>
      </div>

      {/* Custom Tooltip */}
      {tooltip && tooltip.show && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
            <div className="font-semibold text-emerald-400">
              {tooltip.count} {tooltip.count === 1 ? "lesson" : "lessons"}
            </div>
            <div className="text-slate-300 text-[10px] mt-0.5">
              {formatDate(tooltip.date)}
            </div>
          </div>
          <div className="w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </div>
  );
}
