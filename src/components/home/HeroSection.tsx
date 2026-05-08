"use client"

import { useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
} from "lucide-react"
import { StackedCardBackground } from "./stacked-card-background"

const InteractiveGridBackground = dynamic(
  () => import("@/components/ui/interactive-grid-background").then((mod) => mod.InteractiveGridBackground),
  { ssr: false }
)

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!heroRef.current) return
    const elements = heroRef.current.querySelectorAll(".hero-anim-target")
    if (elements.length === 0) return

    import("animejs").then((animeModule) => {
      const anime = animeModule.default
      anime.timeline({
        easing: "spring(1, 80, 10, 0)",
      }).add({
        targets: elements,
        translateY: [48, 0],
        opacity: [0, 1],
        delay: anime.stagger(120, { start: 100 }),
      })
    })
  }, [])

  return (
    <section className="relative overflow-hidden pt-12 pb-8 sm:pt-12 sm:pb-12 lg:pt-16 lg:pb-16">
      <InteractiveGridBackground
        rows={12}
        cols={20}
        className="z-0 opacity-80"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pointer-events-none">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left Content */}
          <div ref={heroRef} className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="hero-anim-target opacity-0 inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-primary-100 shadow-sm pointer-events-auto cursor-pointer hover:bg-primary-100 transition-colors">
              <Sparkles className="w-4 h-4 fill-primary-400 text-primary-600" />
              <span>The #1 AI-Powered English Platform</span>
            </div>

            <div className="hero-anim-target opacity-0">
              <h1 className="text-6xl sm:text-7xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-[1.1] tracking-tight text-gray-700">
                Daily<span className="text-primary">Eng</span>
              </h1>
            </div>

            <div className="hero-anim-target opacity-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium mb-6 leading-relaxed text-gray-500">
                Master English the <br className="hidden lg:block" />
                <span className="text-primary-600 font-semibold">
                  Smart & Fun Way!
                </span>
              </h2>
            </div>

            <div className="hero-anim-target opacity-0">
              <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-xl leading-relaxed">
                Stop memorizing lists. Start using the language. Practice with
                real-world scenarios, AI tutors, and personalized roadmaps.
              </p>
            </div>

            <div className="hero-anim-target opacity-0 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/auth/signup"
                className="pointer-events-auto w-full sm:w-auto cursor-pointer"
              >
                <Button
                  size="lg"
                  variant="default"
                  className="w-full sm:w-auto bg-primary-400 hover:bg-primary-600 text-white px-8 py-6 rounded-full text-lg font-bold cursor-pointer shadow-lg"
                >
                  Start Learning Free
                </Button>
              </Link>
              <Link
                href="/helps"
                className="pointer-events-auto w-full sm:w-auto cursor-pointer"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-primary-200 text-primary-700 hover:border-primary-300 hover:bg-primary-50 px-8 py-6 rounded-full text-lg bg-transparent cursor-pointer"
                >
                  How it works
                </Button>
              </Link>
            </div>

            <div className="hero-anim-target opacity-0 mt-8 flex items-center gap-4 text-sm text-gray-500">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden"
                  >
                    <Image
                      src={`/placeholder-user.jpg`}
                      width={32}
                      height={32}
                      alt="User"
                    />
                  </div>
                ))}
              </div>
              <p>Trusted by 10,000+ learners</p>
            </div>
          </div>

          {/* Right Visual - StackedCardCarousel */}
          <div className="relative w-full lg:pl-10 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <div className="absolute -inset-4 bg-linear-to-r from-primary-100 to-secondary-100 rounded-full opacity-30 blur-3xl z-0" />
            <div className="pointer-events-auto">
              <StackedCardBackground
                images={[
                  "/carousel-1.jpg",
                  "/carousel-2.jpg",
                  "/carousel-3.jpg",
                  "/carousel-4.jpg",
                ]}
                autoPlayInterval={3000}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
