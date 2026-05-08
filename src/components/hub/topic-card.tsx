"use client"

import React, { memo } from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { Tag } from "@/components/ui/tag"
import { Bookmark, Mic, Globe, Briefcase, BookOpen, Coffee, Users, ShoppingBag, HeartPulse, Plane } from "lucide-react"

interface TopicCardProps {
  id: string;
  title: string;
  description: string;
  level: string;
  wordCount?: number;
  thumbnail?: string;
  progress?: number;
  href?: string;
  onClick?: (id: string, e: React.MouseEvent) => void;
  onNotYet?: () => void;
  type?: "vocabulary" | "grammar" | "speaking";
  isBookmarked?: boolean;
  onBookmarkToggle?: (id: string) => void;
  subcategory?: string;
}

const getThumbnailStyle = (title: string, subcategory: string = "") => {
  const str = (subcategory || title).toLowerCase();
  
  if (str.includes("shop") || str.includes("buy")) return { bg: "from-pink-500 to-rose-400", Icon: ShoppingBag, fallback: "/diverse-food-spread.jpg" };
  if (str.includes("din") || str.includes("food") || str.includes("coffee") || str.includes("restaurant")) return { bg: "from-orange-400 to-amber-500", Icon: Coffee, fallback: "/diverse-food-spread.jpg" };
  if (str.includes("travel") || str.includes("airport") || str.includes("flight") || str.includes("transport")) return { bg: "from-cyan-400 to-blue-500", Icon: Plane, fallback: "/diverse-travelers-world-map.jpg" };
  if (str.includes("hotel") || str.includes("tourist") || str.includes("site")) return { bg: "from-sky-400 to-indigo-500", Icon: Globe, fallback: "/diverse-travelers-world-map.jpg" };
  if (str.includes("meet") || str.includes("present") || str.includes("negotiat") || str.includes("interview") || str.includes("business")) return { bg: "from-indigo-500 to-purple-600", Icon: Briefcase, fallback: "/abstract-job-concept.jpg" };
  if (str.includes("academic") || str.includes("lectur") || str.includes("research")) return { bg: "from-emerald-400 to-teal-500", Icon: BookOpen, fallback: "/hero-grammar.jpg" };
  if (str.includes("health") || str.includes("doctor") || str.includes("pharmac") || str.includes("medic")) return { bg: "from-rose-400 to-red-500", Icon: HeartPulse, fallback: "/hero-vocabulary.jpg" };
  if (str.includes("social") || str.includes("part") || str.includes("friend") || str.includes("dat")) return { bg: "from-violet-400 to-fuchsia-500", Icon: Users, fallback: "/carousel-1.jpg" };
  
  // Default/Fallback based on hash string to ensure stability
  const fallbacks = [
    "/hero-vocabulary.jpg",
    "/hero-grammar.jpg",
    "/languagehub.jpg",
    "/carousel-1.jpg"
  ];
  const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return { bg: "from-blue-500 to-indigo-600", Icon: Mic, fallback: fallbacks[hash % fallbacks.length] };
}

const SpeakingThumbnail = memo(function SpeakingThumbnail({ id, title, subcategory, level, thumbnail }: { id: string, title: string, subcategory?: string, level: string, thumbnail?: string }) {
  const { bg, Icon, fallback } = getThumbnailStyle(title, subcategory);
  const displayImage = (thumbnail && thumbnail !== "/learning.png") ? thumbnail : fallback;
  
  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br ${bg} transition-transform duration-500 group-hover:scale-105`}>
      {/* Background Image - Now Clear and Bright */}
      {displayImage && (
        <Image 
          src={displayImage} 
          alt={title} 
          fill 
          className="object-cover"
        />
      )}

      {/* Subtle overlay to ensure text/badges are visible if needed, but keeping it lively */}
      <div className="absolute inset-0 bg-black/5" />
      
      {/* Decorative level indicator in the corner */}
      <div className="absolute bottom-2 right-4 z-10 font-black text-white/40 text-5xl tracking-tighter mix-blend-overlay select-none">
        {level}
      </div>
    </div>
  )
});

export const TopicCard = memo(function TopicCard({
  id,
  title,
  description,
  level,
  wordCount = 25,
  thumbnail = "/learning.png",
  progress = 0,
  href,
  onNotYet,
  type = "vocabulary",
  isBookmarked = false,
  onBookmarkToggle,
  subcategory,
  onClick,
}: TopicCardProps) {
  const isCompleted = progress === 100;
  const isInProgress = progress > 0 && progress < 100;

  const getButtonLabel = () => {
    // Speaking cards always show "Start Learning"
    if (type === "speaking") return "Start Learning";
    if (isCompleted) return "Review";
    if (isInProgress) return "Continue";
    return "Start Learning";
  };

  const getCountLabel = () => {
    switch (type) {
      case "vocabulary":
        return `${wordCount} words`;
      case "grammar":
        return `${wordCount} lessons`;
      case "speaking":
        return `${wordCount} min`;
      default:
        return `${wordCount} words`;
    }
  };

  const getStatusVariant = () => {
    if (progress === 100) return "completed" as const;
    if (progress > 0) return "inProgress" as const;
    return "notYet" as const;
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBookmarkToggle?.(id);
  };

  const cardContent = (
    <Card className="group relative overflow-hidden rounded-3xl border-2 border-border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary-300 flex flex-col min-w-[280px] h-[420px]">
      <button
        onClick={handleBookmarkClick}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-200 cursor-pointer ${
          isBookmarked
            ? "bg-primary-500 text-white shadow-md"
            : "bg-white/80 text-primary-400 hover:bg-primary-100 hover:text-primary-600"
        }`}
      >
        <Bookmark
          className={`h-5 w-5 transition-all ${
            isBookmarked ? "fill-current" : ""
          }`}
        />
      </button>

      <div className="p-4 pt-0 pb-0">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl">
          {type === "speaking" ? (
            <SpeakingThumbnail id={id} title={title} subcategory={subcategory} level={level} thumbnail={thumbnail} />
          ) : (
            <Image
              src={(thumbnail && thumbnail !== "/learning.png") ? thumbnail : getThumbnailStyle(title, subcategory).fallback}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </div>
      </div>

      <div className="p-5 pt-0 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="text-xs px-2.5 py-1 bg-primary-100 text-primary-600 border border-primary-200 font-medium">
            {level}
          </Badge>
          {/* Show subcategory badge for speaking cards */}
          {type === "speaking" && subcategory && (
            <Badge className="text-xs px-2.5 py-1 bg-primary-100 text-primary-600 border border-primary-200 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              {subcategory}
            </Badge>
          )}
          {/* Hide duration/count badge for speaking cards */}
          {type !== "speaking" && (
            <Badge className="text-xs px-2.5 py-1 bg-primary-100 text-primary-600 border border-primary-200 font-medium">
              {getCountLabel()}
            </Badge>
          )}

          {/* Hide status tag for speaking cards */}
          {type !== "speaking" && onNotYet && (
            <Tag
              variant={getStatusVariant()}
              size="md"
              className="ml-auto cursor-pointer transition-all hover:brightness-95"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNotYet();
              }}
            />
          )}
        </div>

        <h4
          className="mb-2 text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1"
          title={title}
        >
          {title}
        </h4>

        <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed min-h-11">
          {description}
        </p>

        <div className="flex items-center gap-3 mt-auto">
          <Button
            className={`flex-1 h-10 rounded-full font-semibold text-sm cursor-pointer transition-all ${
              type === "speaking"
                ? "bg-primary-300 hover:bg-primary-400 text-primary-800"
                : isCompleted
                ? "bg-primary-100 hover:bg-primary-200 text-primary-700"
                : isInProgress
                ? "bg-primary-100 hover:bg-primary-200 text-primary-700"
                : "bg-primary-300 hover:bg-primary-400 text-primary-800"
            }`}
            variant={
              type === "speaking"
                ? "default"
                : isCompleted
                ? "outline"
                : isInProgress
                ? "outline"
                : "default"
            }
          >
            {getButtonLabel()}
          </Button>
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} onClick={(e) => onClick?.(id, e)}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div onClick={(e) => onClick?.(id, e)} className="h-full">
      {cardContent}
    </div>
  );
});
