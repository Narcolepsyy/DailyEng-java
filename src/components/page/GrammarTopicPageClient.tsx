"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Flame, BookOpen, ChevronLeft } from "lucide-react"
import { GrammarPracticeMode } from "@/components/learning/GrammarPracticeMode"
import { GrammarTheoryViewer } from "@/components/learning/GrammarTheoryViewer"

interface GrammarTopicPageClientProps {
  topicId: string
  topic: {
    id: string
    title: string
    description: string
    level: string
  }
  grammarNotes: any[]
  quizItems: any[]
}

export default function GrammarTopicPageClient({
  topicId,
  topic,
  grammarNotes,
  quizItems,
}: GrammarTopicPageClientProps) {
  const router = useRouter()
  const [learningPhase, setLearningPhase] = useState<"study" | "practice">("study")
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0)

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-4 h-[calc(100vh-80px)] flex flex-col">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="gap-2 -ml-2 text-slate-500 hover:text-slate-900"
            onClick={() => router.push('/grammar-hub')}
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Grammar Hub
          </Button>

          <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
            {topic.title}
          </h1>
        </div>

        {/* Level/Mode Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border-2 border-border shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Mode:</span>
            <div className="flex gap-2">
              <Button
                variant={learningPhase === "study" ? "default" : "outline"}
                size="sm"
                onClick={() => setLearningPhase("study")}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" /> Theory
              </Button>
              <Button
                variant={learningPhase === "practice" ? "default" : "outline"}
                size="sm"
                onClick={() => setLearningPhase("practice")}
                className="gap-2"
              >
                <Flame className="h-4 w-4" /> Practice
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0">
          {learningPhase === "study" ? (
            <div className="flex justify-center h-full">
              <div className="w-full max-w-4xl h-full flex flex-col">
                <GrammarTheoryViewer
                  items={grammarNotes}
                  topic={topic}
                  onComplete={() => setLearningPhase("practice")}
                />
              </div>
            </div>
          ) : (
            <GrammarPracticeMode items={quizItems} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
