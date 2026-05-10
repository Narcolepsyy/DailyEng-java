"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Volume2, AlertTriangle, BookOpen, ChevronRight, ChevronLeft } from "lucide-react"

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
    currentIndex: number
    onIndexChange: (index: number) => void
    onComplete: () => void
}

export function GrammarTheoryViewer({
    items,
    currentIndex,
    onIndexChange,
    onComplete
}: GrammarTheoryViewerProps) {
    const currentItem = items[currentIndex]
    const isLastCard = currentIndex === items.length - 1

    const handlePlayAudio = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = "en-US"
        window.speechSynthesis.speak(utterance)
    }

    if (!currentItem) return <div className="text-center p-8">No grammar notes found.</div>

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-xl border-2 border-border shadow-sm overflow-hidden">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10">
                <div className="max-w-3xl mx-auto space-y-10">
                    
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-semibold">
                            <BookOpen className="w-4 h-4" />
                            <span>Grammar Theory</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
                            {currentItem.title}
                        </h2>
                    </div>

                    {/* Explanation Box */}
                    <Card className="p-6 sm:p-8 bg-slate-50 border-slate-100 shadow-none">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span>Format & Usage</span>
                        </h3>
                        {/* Fake color-coded formula to demonstrate the concept (since real data might just be text) */}
                        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 font-mono text-center overflow-x-auto whitespace-nowrap">
                            <span className="text-blue-600 font-bold px-2 py-1 bg-blue-50 rounded">S</span>
                            <span className="mx-2 text-slate-400">+</span>
                            <span className="text-red-600 font-bold px-2 py-1 bg-red-50 rounded">V</span>
                            <span className="mx-2 text-slate-400">+</span>
                            <span className="text-green-600 font-bold px-2 py-1 bg-green-50 rounded">O</span>
                        </div>
                        <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
                            {currentItem.explanation}
                        </p>
                    </Card>

                    {/* Examples Section */}
                    {currentItem.examples && currentItem.examples.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-slate-900">Examples</h3>
                            <div className="grid gap-4">
                                {currentItem.examples.map((ex, idx) => (
                                    <div 
                                        key={idx} 
                                        className="group relative p-5 rounded-2xl border-2 border-slate-100 hover:border-primary-200 bg-white transition-all cursor-default"
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Play example audio"
                                            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-slate-50 hover:bg-primary-50 text-slate-500 hover:text-primary-600 transition-colors"
                                            onClick={() => handlePlayAudio(ex.en)}
                                        >
                                            <Volume2 className="h-5 w-5" />
                                        </Button>
                                        <div className="pr-12">
                                            <p className="text-xl font-medium text-slate-900 mb-2">{ex.en}</p>
                                            <p className="text-base text-slate-500">{ex.vi}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Alert / Watch out box */}
                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex gap-4 items-start">
                        <div className="p-2 bg-amber-100 rounded-full shrink-0 text-amber-600">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900 mb-1">Common Mistake</h4>
                            <p className="text-amber-800 text-sm">
                                Be careful not to confuse this structure with similar ones. Always check the context of the sentence!
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Navigation Bar */}
            <div className="border-t border-border bg-slate-50 p-4 sm:px-8 flex items-center justify-between shrink-0">
                <Button 
                    variant="outline" 
                    onClick={() => onIndexChange(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    className="gap-2 rounded-xl"
                >
                    <ChevronLeft className="w-4 h-4" /> Previous Note
                </Button>

                <div className="text-sm font-medium text-slate-500 hidden sm:block">
                    {currentIndex + 1} / {items.length}
                </div>

                {isLastCard ? (
                    <Button 
                        onClick={onComplete}
                        className="gap-2 rounded-xl bg-primary-600 hover:bg-primary-700"
                    >
                        Practice Now <ChevronRight className="w-4 h-4" />
                    </Button>
                ) : (
                    <Button 
                        onClick={() => onIndexChange(currentIndex + 1)}
                        className="gap-2 rounded-xl"
                    >
                        Next Note <ChevronRight className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
