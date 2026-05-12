"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  ArrowRight,
  ArrowLeft,
  Target,
  Clock,
  BookOpen,
  Users,
  Briefcase,
  Calendar,
  GraduationCap,
  Globe,
  MessageCircle,
  Headphones,
  PenTool,
  Brain,
  Sparkles,
  Check,
  Star,
  X,
  Plane,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Types - serializable versions (no JSX icons)
export interface QuestionOption {
  id: string
  value: string
  label: string
  iconId?: string  // Icon rendered by helper function
  description?: string
}

export interface Question {
  id: number
  question: string
  iconId?: string
  subtitle?: string
  options: QuestionOption[]
  multiSelect?: boolean
}

export interface Course {
  id: string
  title: string
  description: string
  duration: string
  level: string
  category: string
  image: string
  skills: string[]
  recommended?: boolean
  matchScore?: number
  lessons?: number
  match?: number
}

export interface BuildPlanPageClientProps {
  questions: Question[]
  allCourses: Course[]
}

// Helper function to render option icons
function getOptionIcon(iconId?: string): React.ReactNode {
  if (!iconId) return null
  const iconClass = "w-5 h-5"
  switch (iconId) {
    case "briefcase": return <Briefcase className={iconClass} />
    case "graduation-cap": return <GraduationCap className={iconClass} />
    case "target": return <Target className={iconClass} />
    case "plane": return <Plane className={iconClass} />
    case "star": return <Star className={iconClass} />
    case "clock": return <Clock className={iconClass} />
    case "users": return <Users className={iconClass} />
    case "headphones": return <Headphones className={iconClass} />
    case "book-open": return <BookOpen className={iconClass} />
    case "pen-tool": return <PenTool className={iconClass} />
    case "brain": return <Brain className={iconClass} />
    case "globe": return <Globe className={iconClass} />
    case "message-circle": return <MessageCircle className={iconClass} />
    default: return null
  }
}


import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api-client"

// Map survey answers to backend CreatePlanRequest
const GOAL_MAP: Record<string, string> = {
  career: "work",
  study: "intermediate",
  exam: "exam",
  travel: "travel",
  personal: "casual",
}

const TIME_MAP: Record<string, number> = {
  "15min": 2,   // ~1.75 hrs/week
  "30min": 4,   // ~3.5 hrs/week
  "1hour": 7,   // 7 hrs/week
  "2hours": 14, // 14 hrs/week
}

const generateStudySchedule = async (
  _userId: string,
  _courseIds: string[],
  _days: number[],
  answers: Record<number, string[]>
) => {
  // Q1 = goal, Q3 = time per day, Q8 = topics of interest
  const goalAnswer = answers[1]?.[0] || "personal";
  const timeAnswer = answers[3]?.[0] || "30min";
  const interests = answers[8] || ["General"];

  const goal = GOAL_MAP[goalAnswer] || "casual";
  const hoursPerWeek = TIME_MAP[timeAnswer] || 4;

  await apiClient.post("/study/plan", {
    goal,
    level: "B1", // Default — will be updated from placement test results if available
    hoursPerWeek,
    interests,
  });

  return { success: true };
}

// ... imports remain the same

export default function BuildPlanPageClient({ questions, allCourses }: BuildPlanPageClientProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [stage, setStage] = useState<"intro" | "questions" | "schedule">("intro")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string[]>>({})

  // New State for Selection & Scheduling
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]) // Default Mon, Wed, Fri
  const [isLoading, setIsLoading] = useState(false)

  const handleBuildPlan = async () => {
    setIsLoading(true);
    try {
      await generateStudySchedule(user?.id || "", [], selectedDays, answers);
      router.push("/study-plan");
    } catch (error) {
      console.error("Failed to build plan:", error);
      alert("Something went wrong building your plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }


  // Intro Screen
  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
        {/* Close button */}
        <div className="absolute top-6 right-6">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Exit study plan builder"
              className="rounded-full hover:bg-primary-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center min-h-screen">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-8 cursor-pointer">
              <Sparkles className="w-4 h-4" />
              Personalized Learning Path
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Let's Build Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-400 pt-2.5">
                Perfect Study Plan
              </span>
            </h1>

            <p className="text-lg text-slate-600 mb-12">
              Answer 10 quick questions about your goals, schedule, and preferences. We'll create a customized learning
              roadmap just for you.
            </p>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: Clock, title: "5 Minutes", desc: "Quick questionnaire" },
                { icon: Target, title: "Personalized", desc: "Tailored to your goals" },
                { icon: BookOpen, title: "10+ Courses", desc: "Matched for you" },
              ].map((feature, idx) => (
                <Card
                  key={idx}
                  className="p-6 border border-primary-200 bg-white/80 backdrop-blur-sm cursor-pointer hover:border-primary-300 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </Card>
              ))}
            </div>

            <Button
              size="lg"
              variant="default"
              onClick={() => setStage("questions")}
              className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-6 text-lg rounded-xl transition-all"
            >
              Start Building My Plan
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Questions Stage
  if (stage === "questions") {
    const currentQ = questions[currentQuestion]
    const progress = ((currentQuestion + 1) / questions.length) * 100

    const currentAnswers = answers[currentQ?.id] || []

    const handleSelectOption = (questionId: number, optionValue: string, multiSelect?: boolean) => {
      setAnswers((prev) => {
        const currentAnswers = prev[questionId] || []

        if (multiSelect) {
          if (currentAnswers.includes(optionValue)) {
            return { ...prev, [questionId]: currentAnswers.filter((id) => id !== optionValue) }
          } else {
            return { ...prev, [questionId]: [...currentAnswers, optionValue] }
          }
        } else {
          return { ...prev, [questionId]: [optionValue] }
        }
      })
    }

    const handleNext = () => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
      } else {
        setStage("schedule")
      }
    }

    const handlePrevious = () => {
      if (currentQuestion > 0) {
        setCurrentQuestion((prev) => prev - 1)
      }
    }


    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
        {/* Header */}
        <div className="border-b border-primary-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button variant="outline" aria-label="Exit study plan builder" className="gap-2 cursor-pointer bg-white hover:bg-primary-50">
                  <ArrowLeft className="w-4 h-4" />
                  Exit
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary-500" />
                </div>
                <span className="font-semibold text-slate-900">Study Plan Builder</span>
              </div>
              <div className="text-sm text-slate-500">
                {currentQuestion + 1} of {questions.length}
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Progress value={progress} className="h-2 [&>div]:bg-primary-400" />
        </div>

        {/* Question Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 pb-3">{currentQ.question}</h2>
            {currentQ.subtitle && <p className="text-slate-500">{currentQ.subtitle}</p>}
          </div>

          {/* Options */}
          <div className="space-y-4 mb-12">
            {currentQ.options.map((option) => {
              const isSelected = currentAnswers.includes(option.value)
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelectOption(currentQ.id, option.value, currentQ.multiSelect)}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${isSelected
                    ? "border-primary-500 bg-primary-50 shadow-md"
                    : "border-slate-200 hover:border-primary-300 bg-white"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-primary-700 bg-primary-700" : "border-slate-300"
                        }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <div
                        className={`font-medium ${isSelected ? "text-primary-700" : "text-slate-900"
                          }`}
                      >
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-sm text-slate-500 mt-1">{option.description}</div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="gap-2 cursor-pointer bg-transparent hover:bg-primary-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentAnswers.length === 0}
              className="gap-2 cursor-pointer bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600"
            >
              {currentQuestion === questions.length - 1 ? "Set Schedule" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Schedule Stage (Default Fallback)
  const days = [
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
    { value: 0, label: "Sun" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Set Your Schedule</h1>
          <p className="text-slate-600">Which days do you want to study?</p>
        </div>

        <Card className="p-8 border-primary-100 shadow-xl bg-white/80 backdrop-blur-sm mb-8">
          <div className="flex justify-center gap-3 flex-wrap">
            {days.map((day) => {
              const isSelected = selectedDays.includes(day.value)
              return (
                <button
                  key={day.value}
                  onClick={() => {
                    setSelectedDays(prev =>
                      prev.includes(day.value)
                        ? prev.filter(d => d !== day.value)
                        : [...prev, day.value]
                    )
                  }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold transition-all ${isSelected
                    ? "bg-primary-500 text-white shadow-lg scale-110"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                >
                  {day.label}
                </button>
              )
            })}
          </div>

          <div className="mt-8 text-center text-sm text-slate-500">
            {selectedDays.length === 0 ? "Select at least one day" : `You will study ${selectedDays.length} days a week`}
          </div>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => setStage("questions")}
          >
            Back
          </Button>
          <Button
            size="lg"
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
            onClick={handleBuildPlan}
            disabled={isLoading || selectedDays.length === 0}
          >
            {isLoading ? "Building Plan..." : "Build My Plan"}
            {!isLoading && <Sparkles className="ml-2 w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
