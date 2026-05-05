"use client"

import {
  ArrowLeft, ArrowRight, Clock, PlayCircle, Volume2,
  Mic, MicOff, CheckCircle2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { TestStep, Question } from "@/hooks/placement-test/types"
import { getTestStepIcon } from "@/hooks/placement-test/types"

interface TestContentProps {
  testSteps: TestStep[]
  activeTestId: string
  mockQuestions: Record<string, Question[]>
  currentQuestion: number
  selectedAnswer: number | string | null
  writingAnswer: string
  fillBlankAnswer: string
  isRecording: boolean
  isPlaying: boolean
  onExit: () => void
  onSelectAnswer: (answer: number | string) => void
  onNext: () => void
  onPrevious: () => void
  onToggleRecording: () => void
  onPlayAudio: () => void
  onWritingChange: (value: string) => void
  onFillBlankChange: (value: string) => void
}

export function TestContent({
  testSteps, activeTestId, mockQuestions,
  currentQuestion, selectedAnswer, writingAnswer, fillBlankAnswer,
  isRecording, isPlaying,
  onExit, onSelectAnswer, onNext, onPrevious,
  onToggleRecording, onPlayAudio, onWritingChange, onFillBlankChange,
}: TestContentProps) {
  const questions = mockQuestions[activeTestId]
  const currentQ = questions[currentQuestion]
  const testInfo = testSteps.find((s) => s.id === activeTestId)!
  const TestIcon = getTestStepIcon(testInfo.id)

  const isNextDisabled =
    ((currentQ.type === "multiple-choice" || currentQ.type === "reading" || currentQ.type === "listening") && selectedAnswer === null) ||
    (currentQ.type === "fill-blank" && !fillBlankAnswer) ||
    (currentQ.type === "writing" && !writingAnswer) ||
    (currentQ.type === "speaking" && selectedAnswer !== "recorded")

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={onExit} className="gap-2 text-muted-foreground hover:text-foreground bg-white">
              <ArrowLeft className="w-4 h-4" /> Exit Test
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" /><span className="text-sm">No time limit</span>
            </div>
          </div>

          <Card className="p-4 bg-primary-50 border-primary-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <TestIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">{testInfo.label} Test</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">Question {currentQuestion + 1} of {questions.length}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</div>
              </div>
            </div>
            <Progress value={((currentQuestion + 1) / questions.length) * 100} className="mt-4 h-2" />
          </Card>
        </div>

        {/* Question Card */}
        <Card className="p-6 mb-6 rounded-2xl shadow-lg bg-white">
          {/* Listening Audio */}
          {currentQ.type === "listening" && (
            <div className="flex items-center justify-center mb-6">
              <button onClick={onPlayAudio} disabled={isPlaying}
                aria-label={isPlaying ? "Playing audio" : "Play audio"}
                title={isPlaying ? "Playing audio" : "Play audio"}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isPlaying ? "bg-primary-100" : "bg-primary-600 hover:bg-primary-700"}`}>
                {isPlaying ? <Volume2 className="w-10 h-10 text-primary-600 animate-pulse" /> : <PlayCircle className="w-10 h-10 text-white" />}
              </button>
            </div>
          )}

          {/* Reading Passage */}
          {currentQ.type === "reading" && currentQ.passage && (
            <div className="p-4 bg-muted/50 rounded-xl mb-6">
              <p className="text-sm leading-relaxed text-foreground">{currentQ.passage}</p>
            </div>
          )}

          {/* Speaking Prompt */}
          {currentQ.type === "speaking" && currentQ.prompt && (
            <div className="p-4 bg-secondary-50 rounded-xl mb-6">
              <p className="text-sm font-medium text-secondary-800 mb-1">Topic:</p>
              <p className="text-foreground">{currentQ.prompt}</p>
            </div>
          )}

          {/* Writing Prompt */}
          {currentQ.type === "writing" && currentQ.prompt && (
            <div className="p-4 bg-info-50 rounded-xl mb-6">
              <p className="text-sm font-medium text-info-800 mb-1">Task:</p>
              <p className="text-foreground">{currentQ.prompt}</p>
            </div>
          )}

          {/* Question */}
          <h2 className="text-lg font-semibold text-foreground mb-6">{currentQ.question}</h2>

          {/* Answer Options */}
          {currentQ.type === "multiple-choice" || currentQ.type === "reading" || currentQ.type === "listening" ? (
            <div className="space-y-3">
              {currentQ.options?.map((option, idx) => (
                <button key={idx} onClick={() => onSelectAnswer(idx)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedAnswer === idx ? "border-primary-500 bg-primary-50" : "border-border hover:border-primary-300"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${selectedAnswer === idx ? "bg-primary-600 text-white" : "bg-muted text-muted-foreground"}`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-foreground">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : currentQ.type === "fill-blank" ? (
            <Input value={fillBlankAnswer} onChange={(e) => onFillBlankChange(e.target.value)} placeholder="Type your answer..." className="h-12 rounded-xl" />
          ) : currentQ.type === "speaking" ? (
            <div className="flex flex-col items-center gap-4">
              <button onClick={onToggleRecording}
                aria-label={isRecording ? "Stop recording" : selectedAnswer === "recorded" ? "Record again" : "Start recording"}
                title={isRecording ? "Stop recording" : selectedAnswer === "recorded" ? "Record again" : "Start recording"}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? "bg-error-500 animate-pulse" : selectedAnswer === "recorded" ? "bg-success-500" : "bg-primary-600 hover:bg-primary-700"}`}>
                {isRecording ? <MicOff className="w-10 h-10 text-white" /> : selectedAnswer === "recorded" ? <CheckCircle2 className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
              </button>
              <p className="text-sm text-muted-foreground">
                {isRecording ? "Recording... Click to stop" : selectedAnswer === "recorded" ? "Recording saved!" : "Click to start recording"}
              </p>
            </div>
          ) : currentQ.type === "writing" ? (
            <Textarea value={writingAnswer} onChange={(e) => onWritingChange(e.target.value)} placeholder="Write your answer here..." className="min-h-[200px] rounded-xl" />
          ) : null}
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onPrevious} disabled={currentQuestion === 0} className="gap-2 rounded-xl bg-transparent">
            <ArrowLeft className="w-4 h-4" /> Previous
          </Button>
          <Button onClick={onNext} disabled={isNextDisabled} className="gap-2 rounded-xl bg-primary-600 hover:bg-primary-700">
            {currentQuestion === questions.length - 1 ? "Complete Test" : "Next"} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
