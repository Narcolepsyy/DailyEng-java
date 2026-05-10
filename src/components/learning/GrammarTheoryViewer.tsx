"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Volume2, AlertTriangle, BookOpen, ChevronRight, ChevronLeft } from "lucide-react"
import { AddToNotebookDialog } from "@/components/notebook/AddToNotebookDialog"

interface GrammarExample {
    en: string
    vi: string
}

interface GrammarNote {
    id: string
    title: string
    explanation: string
    examples: GrammarExample[]
}

interface GrammarTheoryViewerProps {
    items: GrammarNote[]
    topic?: {
        category?: string
        level?: string
    }
    onComplete: () => void
}

export function GrammarTheoryViewer({
    items,
    topic,
    onComplete
}: GrammarTheoryViewerProps) {
    const handlePlayAudio = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = "en-US"
        window.speechSynthesis.speak(utterance)
    }

    if (!items || items.length === 0) return <div className="text-center p-8">No grammar notes found.</div>

    return (
        <div className="w-full h-full flex flex-col relative">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
                <div className="max-w-4xl mx-auto space-y-8 py-4 px-2">
                    
                    {items.map((item, index) => {
                        // Attempt to extract formula if the first line is short or contains "+"
                        const lines = item.explanation.split('\n').filter(l => l.trim() !== "");
                        let formula = "";
                        let usage = item.explanation;
                        
                        if (lines.length > 1 && (lines[0].includes("+") || lines[0].length < 60)) {
                            formula = lines[0];
                            usage = lines.slice(1).join("\n");
                        }

                        // Colors for the border (alternating for visual variety)
                        const borderColors = ["border-l-blue-500", "border-l-amber-500", "border-l-emerald-500", "border-l-purple-500"];
                        const borderColor = borderColors[index % borderColors.length];

                        return (
                            <Card key={item.id} className={`p-8 bg-white border border-slate-100 shadow-sm rounded-2xl ${borderColor} border-l-[6px]`}>
                                {/* Badges & Action */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                                            {topic?.category || "Grammar"}
                                        </span>
                                        <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                                            {topic?.level || "A1"}
                                        </span>
                                    </div>
                                    <AddToNotebookDialog 
                                        type="grammar" 
                                        itemPayload={{
                                            word: item.title,
                                            partOfSpeech: "Grammar",
                                            meaning: item.explanation ? [item.explanation] : [],
                                            vietnamese: [],
                                            examples: item.examples || [],
                                            level: topic?.level || "A1",
                                            tags: topic?.category ? [topic.category] : []
                                        }} 
                                    />
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                                    {item.title}
                                </h2>

                                {/* Formula (if detected) */}
                                {formula && (
                                    <div className="mb-6 py-4 px-6 bg-[#f8faff] rounded-xl text-blue-600 font-mono font-medium text-[15px]">
                                        {formula}
                                    </div>
                                )}

                                {/* Usage / Explanation */}
                                <p className="text-slate-600 text-[15px] leading-relaxed mb-8 whitespace-pre-wrap">
                                    {usage}
                                </p>

                                {/* Examples */}
                                {item.examples && item.examples.length > 0 && (
                                    <div>
                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                                            Examples
                                        </h3>
                                        <div className="space-y-4">
                                            {item.examples.map((ex, idx) => (
                                                <div key={idx} className="flex items-start gap-3">
                                                    <span className="text-blue-300 mt-1 flex-shrink-0">→</span>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[15px] text-slate-700">{ex.en}</span>
                                                            <button
                                                                onClick={() => handlePlayAudio(ex.en)}
                                                                className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                                                                aria-label="Play audio"
                                                            >
                                                                <Volume2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <p className="text-sm text-slate-500 mt-1">{ex.vi}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Floating Action Button for Practice */}
            <div className="absolute bottom-6 right-6">
                <Button 
                    onClick={onComplete}
                    size="lg"
                    className="gap-2 rounded-full px-8 shadow-xl shadow-primary-200/50 bg-primary-600 hover:bg-primary-700"
                >
                    Practice Now <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
