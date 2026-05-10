"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, CheckCircle2, RefreshCw, PenTool, Mic, Sparkles, Trophy, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PracticeItem {
    id: string
    context: string // Vietnamese instruction or context
    target: string // Expected English answer
    type: "writing" | "speaking"
    difficulty?: "easy" | "medium" | "hard"
}

// Default fixed questions for Grammar (Future with Will)
const FIXED_WRITING_QUESTIONS: PracticeItem[] = [
    { id: "gw1", context: "Dịch: 'Tôi sẽ giúp bạn' (Easy)", target: "I will help you", type: "writing", difficulty: "easy" },
    { id: "gw2", context: "Dịch: 'Cô ấy sẽ không đến bữa tiệc' (Easy)", target: "She will not come to the party", type: "writing", difficulty: "easy" },
    { id: "gw3", context: "Dịch: 'Họ sẽ mua một chiếc xe hơi mới vào năm sau' (Medium)", target: "They will buy a new car next year", type: "writing", difficulty: "medium" },
    { id: "gw4", context: "Dịch: 'Bạn sẽ đi du lịch ở đâu vào mùa hè này?' (Medium)", target: "Where will you travel this summer?", type: "writing", difficulty: "medium" },
    { id: "gw5", context: "Dịch: 'Tôi nghĩ rằng trí tuệ nhân tạo sẽ thay đổi thế giới trong tương lai' (Hard)", target: "I think that artificial intelligence will change the world in the future", type: "writing", difficulty: "hard" }
]

const FIXED_SPEAKING_QUESTIONS: PracticeItem[] = [
    { id: "gs1", context: "Nói: 'Tôi sẽ gọi cho bạn sau' (Easy)", target: "I will call you later", type: "speaking", difficulty: "easy" },
    { id: "gs2", context: "Nói: 'Trời sẽ mưa vào ngày mai chứ?' (Medium)", target: "Will it rain tomorrow?", type: "speaking", difficulty: "medium" },
    { id: "gs3", context: "Nói: 'Mọi thứ sẽ ổn thôi, đừng lo lắng' (Medium)", target: "Everything will be fine, do not worry", type: "speaking", difficulty: "medium" }
]



// Levenshtein Distance Algorithm for String Similarity
function calculateSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 100;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matrix = [];
    for (let i = 0; i <= s2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;
    return Math.round(similarity);
}

interface GrammarPracticeModeProps {
    items?: any[]
}

export function GrammarPracticeMode({ items }: GrammarPracticeModeProps) {
    const router = useRouter()
    const [mode, setMode] = useState<"writing" | "speaking">("writing")

    // Map DB items to PracticeItem format if available
    const dbQuestions: PracticeItem[] = (items && items.length > 0) ? items.map(q => ({
        id: q.id,
        context: q.question,
        target: q.correctAnswer,
        type: "writing" // Assume writing/fill-in for grammar quiz items for now
    })) : []

    // Separate state for each mode
    const [writingQuestions, setWritingQuestions] = useState<PracticeItem[]>(
        dbQuestions.length > 0 ? dbQuestions : FIXED_WRITING_QUESTIONS
    )
    const [speakingQuestions, setSpeakingQuestions] = useState<PracticeItem[]>(
        dbQuestions.length > 0 ? dbQuestions : FIXED_SPEAKING_QUESTIONS
    )

    const [currentIndexes, setCurrentIndexes] = useState({ writing: 0, speaking: 0 })

    const [userAnswer, setUserAnswer] = useState("")
    const [feedback, setFeedback] = useState<{ score: number; comment: string } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [history, setHistory] = useState<Array<{ question: PracticeItem, score: number }>>([])
    const [isSummary, setIsSummary] = useState(false)

    // Derived state based on mode
    const currentQuestions = mode === "writing" ? writingQuestions : speakingQuestions
    const currentIndex = mode === "writing" ? currentIndexes.writing : currentIndexes.speaking
    const currentQuestion = currentQuestions[currentIndex]

    const handleModeSwitch = (newMode: "writing" | "speaking") => {
        setMode(newMode)
        setFeedback(null)
        setUserAnswer("")
    }

    const handleSubmit = () => {
        if (!userAnswer.trim()) return

        setIsProcessing(true)
        setTimeout(() => {
            // Levenshtein Similarity Grading Logic
            const normalizedUser = userAnswer.trim().toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ");
            const normalizedTarget = currentQuestion.target.trim().toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ");
            
            const score = calculateSimilarity(normalizedUser, normalizedTarget);
            
            let comment = "";
            if (score === 100) {
                comment = "Perfect grammar usage!";
            } else if (score >= 80) {
                comment = `Almost perfect! Just a small typo. Expected: "${currentQuestion.target}"`;
            } else if (score >= 50) {
                comment = `Close! The correct grammar is: "${currentQuestion.target}"`;
            } else {
                comment = `Check your grammar. Expected: "${currentQuestion.target}"`;
            }

            setFeedback({
                score,
                comment
            })
            setHistory(prev => [...prev, { question: currentQuestion, score }])
            setIsProcessing(false)
        }, 800)
    }

    const handleNext = () => {
        setFeedback(null)
        setUserAnswer("")

        if (currentIndex < currentQuestions.length - 1) {
            setCurrentIndexes(prev => ({
                ...prev,
                [mode]: prev[mode] + 1
            }))
        } else {
            setIsSummary(true)
        }
    }

    const handleReviewAgain = () => {
        setCurrentIndexes({ writing: 0, speaking: 0 })
        setHistory([])
        setFeedback(null)
        setUserAnswer("")
        setIsSummary(false)
    }



    if (isSummary) {
        const avgScore = Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / history.length || 0)

        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
                <Card className="p-8 border-2 border-primary-100 shadow-xl bg-white rounded-3xl text-center space-y-6">
                    <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                        <Trophy className="w-12 h-12 text-yellow-600" />
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">Practice Complete!</h2>
                        <p className="text-slate-500 mt-2">You have completed {history.length} questions.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="block text-3xl font-bold text-primary-600">{avgScore}</span>
                            <span className="text-sm text-slate-500 font-medium">Avg. Score</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="block text-3xl font-bold text-green-600">
                                {history.filter(h => h.score >= 80).length}
                            </span>
                            <span className="text-sm text-slate-500 font-medium">High Scores</span>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-center pt-4">
                        <Button variant="outline" onClick={() => router.push("/grammar-hub")} className="gap-2">
                            Other Grammar
                        </Button>
                        <Button className="gap-2 bg-primary-600 hover:bg-primary-700" onClick={handleReviewAgain}>
                            <Sparkles className="w-4 h-4" /> Review Again
                        </Button>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header / Progress */}
            <div className="flex items-center justify-between">
                <div className="flex gap-4">
                    <Button
                        variant={mode === "writing" ? "default" : "outline"}
                        onClick={() => handleModeSwitch("writing")}
                        className="gap-2 rounded-full"
                        size="sm"
                    >
                        <PenTool className="h-3 w-3" /> Writing
                    </Button>
                    <Button
                        variant={mode === "speaking" ? "default" : "outline"}
                        onClick={() => handleModeSwitch("speaking")}
                        className="gap-2 rounded-full"
                        size="sm"
                    >
                        <Mic className="h-3 w-3" /> Speaking
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-500">Question {currentIndex + 1} / {currentQuestions.length}</span>
                </div>
            </div>

            <Card className="p-8 border-2 border-primary-100 shadow-xl bg-white rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                    <div
                        className="h-full bg-primary-500 transition-all duration-500"
                        style={{ width: `${((currentIndex + 1) / currentQuestions.length) * 100}%` }}
                    />
                </div>

                <div className="space-y-6">

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-xs font-bold text-primary-500 uppercase tracking-wider">
                                {currentQuestion.type === "writing" ? "Translate & Apply Grammar" : "Speak Complete Sentence"}
                            </span>
                            {currentQuestion.difficulty && (
                                <span className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold text-white",
                                    currentQuestion.difficulty === "easy" ? "bg-green-500" :
                                        currentQuestion.difficulty === "medium" ? "bg-yellow-500" : "bg-red-500"
                                )}>
                                    {currentQuestion.difficulty}
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">{currentQuestion.context}</h3>
                    </div>

                    <div className="space-y-4">
                        {currentQuestion.type === "writing" ? (
                            <Textarea
                                placeholder="Type your answer here..."
                                className="text-lg p-4 min-h-[120px] rounded-xl border-slate-200 focus:border-primary-500 transition-colors"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                disabled={feedback !== null}
                            />
                        ) : (
                            <div className="h-40 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center flex-col gap-4">
                                {userAnswer ? (
                                    <p className="text-lg font-medium text-slate-800">"{userAnswer}"</p>
                                ) : (
                                    <p className="text-slate-400">Tap microphone to record</p>
                                )}
                                <Button
                                    size="icon"
                                    aria-label="Record answer"
                                    variant={userAnswer ? "outline" : "default"}
                                    className={cn("h-16 w-16 rounded-full", userAnswer ? "border-slate-200" : "shadow-lg shadow-primary-200")}
                                    onClick={() => setUserAnswer("I have lived here for 5 years")} // Mock recording result
                                    aria-label="Tap to record"
                                    title="Tap to record"
                                >
                                    <Mic className="h-6 w-6" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {feedback && (
                        <div className={cn(
                            "p-4 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2",
                            feedback.score >= 80 ? "bg-green-50 text-green-800" : "bg-orange-50 text-orange-800"
                        )}>
                            <div className={cn(
                                "p-2 rounded-full",
                                feedback.score >= 80 ? "bg-green-200" : "bg-orange-200"
                            )}>
                                {feedback.score >= 80 ? <CheckCircle2 className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                            </div>
                            <div>
                                <p className="font-bold">Score: {feedback.score}/100</p>
                                <p className="text-sm">{feedback.comment}</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex items-center justify-between gap-4">
                        <div />

                        <div className="flex gap-2">
                            {!feedback ? (
                                <Button onClick={handleSubmit} disabled={!userAnswer || isProcessing} size="lg" className="w-full sm:w-auto shadow-lg shadow-primary-200">
                                    {isProcessing ? "Checking..." : "Check Answer"}
                                </Button>
                            ) : (
                                <Button onClick={handleNext} size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-slate-200">
                                    Next Question <ArrowRight className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                </div>
            </Card>

            <div className="flex justify-end">
                <Button
                    variant="outline"
                    className="text-primary-500 border-primary-200 hover:bg-primary-50 hover:text-primary-600 gap-2"
                    onClick={() => setIsSummary(true)}
                >
                    <LogOut className="w-4 h-4" /> Finish Practice
                </Button>
            </div>
        </div>
    )
}
