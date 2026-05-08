// Server Component with auth redirect
// Authenticated users → redirect to /vocab (app dashboard)
// Unauthenticated users → see the marketing landing page

import { redirect } from "next/navigation"
import dynamic from "next/dynamic"
import type { FeatureTab, PartnerLogo } from "@/types/home"
import { auth } from "@/lib/auth"

// ─── Above-fold: eagerly imported ──────────────────
import { PublicNavbar } from "@/components/home/public-navbar"
import { HeroSection } from "@/components/home/HeroSection"
import { LogosMarquee } from "@/components/home/LogosMarquee"
import { SocialProofSection } from "@/components/home/SocialProofSection"
import { FeaturesBentoGrid } from "@/components/home/FeaturesBentoGrid"

// ─── Below-fold SERVER components: direct import ───
import { TestLanguageSection } from "@/components/home/TestLanguageSection"
import { BuildStudyPlanSection } from "@/components/home/BuildStudyPlanSection"
import { FinalCtaSection } from "@/components/home/FinalCtaSection"

// Reviews fetched from backend, with static fallback
import { reviews as fallbackReviews } from "@/data/reviews"
import type { Review } from "@/types/home"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
async function fetchReviews(): Promise<Review[]> {
  try {
    const res = await fetch(`${API_BASE}/site-content/reviews`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  } catch {
    return fallbackReviews;
  }
}

// ─── Below-fold CLIENT components: dynamic import ──
const FeatureTabsSection = dynamic(
  () => import("@/components/home/FeatureTabsSection").then((m) => ({ default: m.FeatureTabsSection })),
)

const ReviewsSection = dynamic(
  () => import("@/components/home/ReviewsSection").then((m) => ({ default: m.ReviewsSection })),
)

// ─── Data ──────────────────────────────────────────

const featureTabs: FeatureTab[] = [
  {
    id: "language-hub",
    label: "Language Hub",
    title: "Language Hub",
    description:
      "No more rote memorization. Every word and rule you learn is reinforced through exercises, conversations, and real applications.",
    image: "/languagehub.jpg",
  },
  {
    id: "speaking-room",
    label: "Speaking Room",
    title: "Virtual Speaking Room",
    description:
      "Practice speaking in real-life contexts with AI tutors. Get instant feedback and interactive speaking sessions. Build confidence step by step.",
    image: "/speakingroom.jpg",
  },
  {
    id: "smart-lens",
    label: "Smart Lens & Translate",
    title: "Smart Lens & AI Translate",
    description:
      "Break language barriers instantly. Use your camera to scan and translate signs, menus, or documents in real-time. Or use our advanced AI text translator for deep contextual understanding.",
    image: "/smart-lens-feature.png",
  },
  {
    id: "study-plan",
    label: "Personal Study Plan",
    title: "Personal Study Plan",
    description:
      "DailyLang adapts to your goals. Whether you're practicing for school, work, or exams — we guide your progress with a personalized learning roadmap.",
    image: "/personal-study-plan.jpg",
  },
  {
    id: "learning-profile",
    label: "Your Learning Profile",
    title: "Your Learning Profile",
    description:
      "Track your achievements, streaks, strengths, and areas to improve. Grow with your own learning journey.",
    image: "/your-learning-profile.jpg",
  },
]

const partnerLogos: PartnerLogo[] = [
  { src: "/bc-logo.png", alt: "British Council" },
  { src: "/idp-logo.png", alt: "IDP" },
  { src: "/cambridge-logo.jpg", alt: "Cambridge" },
  { src: "/toefl-logo.png", alt: "TOEFL" },
  { src: "/ielts-logo.png", alt: "IELTS" },
  { src: "/jlpt-logo.png", alt: "JLPT" },
  { src: "/jtest-logo.png", alt: "J-TEST" },
  { src: "/nattest-logo.png", alt: "NAT-TEST" },
]

// ─── Page ──────────────────────────────────────────

export default async function HomePage() {
  // Server-side auth check: redirect authenticated users to the app dashboard
  const session = await auth();
  if (session?.user) {
    redirect("/speaking-room");
  }

  const reviews = await fetchReviews();
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary-200 selection:text-primary-900">
      <PublicNavbar />
      <HeroSection />
      <LogosMarquee partnerLogos={partnerLogos} />
      <SocialProofSection />
      <FeaturesBentoGrid />

      {/* Client components — dynamically imported for code splitting */}
      <div className="content-lazy">
        <FeatureTabsSection featureTabs={featureTabs} />
      </div>
      <div className="content-lazy">
        <ReviewsSection reviews={reviews} />
      </div>

      {/* Server components — direct import, zero client JS */}
      <div className="content-lazy">
        <TestLanguageSection />
      </div>
      <div className="content-lazy">
        <BuildStudyPlanSection />
      </div>
      <div className="content-lazy">
        <FinalCtaSection />
      </div>
    </div>
  )
}
