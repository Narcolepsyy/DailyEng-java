"use client"

import {
  BookOpen, FileText, Zap, Volume2, Star, Check, X, Undo2, Shuffle, Mic,
  ArrowLeft, Brain,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { NotebookItem } from "@/hooks/notebook/types"
import { speakText } from "@/hooks/notebook/types"

// ─── Flashcard View ────────────────────────────────

interface VocabularyFlashcardsProps {
  currentItem: NotebookItem | undefined
  currentCardIndex: number
  setCurrentCardIndex: (index: number) => void
  isFlipped: boolean
  setIsFlipped: (flipped: boolean) => void
  cardAnimation: "" | "swipe-left" | "swipe-right"
  flashcardItems: NotebookItem[]
  learnedCards: Set<string>
  notLearnedCards: Set<string>
  starredItems: Set<string>
  setStarredItems: React.Dispatch<React.SetStateAction<Set<string>>>
  setVocabularyItems: React.Dispatch<React.SetStateAction<NotebookItem[]>>
  onSwipe: (direction: "left" | "right") => void
  onShadowingOpen: () => void
  onGoToList: () => void
}

export function VocabularyFlashcards({
  currentItem, currentCardIndex, setCurrentCardIndex,
  isFlipped, setIsFlipped, cardAnimation,
  flashcardItems, learnedCards, notLearnedCards,
  starredItems, setStarredItems, setVocabularyItems,
  onSwipe, onShadowingOpen, onGoToList,
}: VocabularyFlashcardsProps) {
  if (!currentItem) {
    return (
      <div className="notebook-card p-12 text-center notebook-enter">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mx-auto mb-5">
          <Brain className="h-10 w-10 text-primary-300" />
        </div>
        <h3 className="notebook-heading text-xl font-bold text-gray-900 mb-2">No cards to practice</h3>
        <p className="text-gray-400 mb-6">Add some words or select items from the list view.</p>
        <Button onClick={onGoToList} className="gap-2 rounded-full px-6 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 cursor-pointer shadow-md shadow-primary-500/20">
          <ArrowLeft className="h-4 w-4" /> Go to List
        </Button>
      </div>
    )
  }

  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation()
    setStarredItems(p => { const s = new Set(p); s.has(currentItem.id) ? s.delete(currentItem.id) : s.add(currentItem.id); return s })
  }

  const totalCards = learnedCards.size + notLearnedCards.size
  const progressPercent = flashcardItems.length > 0 ? Math.round((totalCards / flashcardItems.length) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto notebook-enter">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {notLearnedCards.size} learning
            </span>
            <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {learnedCards.size} mastered
            </span>
          </div>
          <span className="text-sm font-bold text-gray-400">{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full flex">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${flashcardItems.length > 0 ? (learnedCards.size / flashcardItems.length) * 100 : 0}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-amber-400 transition-all duration-500"
              style={{ width: `${flashcardItems.length > 0 ? (notLearnedCards.size / flashcardItems.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="cursor-pointer mb-8" onClick={() => setIsFlipped(!isFlipped)} style={{ perspective: "1200px" }}>
        <div
          className={`relative w-full h-[360px] transition-transform duration-500 ${cardAnimation}`}
          style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* Front of Card */}
          <div className="flashcard-face notebook-card p-6 !border-primary-200/60 !shadow-xl" style={{ backfaceVisibility: "hidden" }}>
            {cardAnimation === "swipe-left" && (
              <div className="absolute inset-0 bg-amber-100/60 flex items-center justify-center rounded-2xl z-10 transition-all duration-300 animate-in fade-in">
                <X className="h-40 w-40 text-amber-500 stroke-[4] animate-in zoom-in duration-300" />
              </div>
            )}
            {cardAnimation === "swipe-right" && (
              <div className="absolute inset-0 bg-emerald-100/60 flex items-center justify-center rounded-2xl z-10 transition-all duration-300 animate-in fade-in">
                <Check className="h-40 w-40 text-emerald-500 stroke-[4] animate-in zoom-in duration-300" />
              </div>
            )}

            <div className="absolute top-6 left-6 flex items-center gap-2">
              <Badge className="text-xs font-bold px-3 py-1 rounded-lg bg-primary-50 text-primary-600 border border-primary-200">{currentItem.partOfSpeech}</Badge>
              <Badge className="text-xs font-bold px-3 py-1 rounded-lg bg-primary-50 text-primary-600 border border-primary-200">{currentItem.level}</Badge>
            </div>

            <Button aria-label={starredItems.has(currentItem.id) ? "Unstar flashcard" : "Star flashcard"} size="sm" variant="ghost" className="absolute top-6 right-6 h-10 w-10 rounded-full p-0 hover:bg-yellow-50 cursor-pointer" onClick={toggleStar}>
              <Star className={`h-5 w-5 transition-colors ${starredItems.has(currentItem.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
            </Button>

            <div className="flex flex-col items-center justify-center h-full gap-2">
              <h2 className="gradient-text notebook-heading text-3xl lg:text-4xl font-extrabold">{currentItem.word}</h2>
              {currentItem.pronunciation && currentItem.pronunciation !== "/.../" && currentItem.pronunciation !== "" && (
                <p className="text-gray-400 font-mono text-lg">{currentItem.pronunciation}</p>
              )}
              <Button variant="ghost" size="icon" aria-label="Listen to pronunciation" className="h-10 w-10 mt-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer rounded-full"
                onClick={(e) => { e.stopPropagation(); speakText(currentItem.word); }}>
                <Volume2 className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Back of Card */}
          <div className="flashcard-face notebook-card p-6 overflow-hidden flex flex-col !border-primary-200/60 !shadow-xl" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="notebook-heading text-xl font-bold text-gray-900">{currentItem.word}</h2>
                  {currentItem.pronunciation && currentItem.pronunciation !== "/.../" && currentItem.pronunciation !== "" && (
                    <p className="text-sm text-gray-400 font-mono">{currentItem.pronunciation}</p>
                  )}
                </div>
                <Button aria-label={starredItems.has(currentItem.id) ? "Unstar flashcard" : "Star flashcard"} size="sm" variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-yellow-50 cursor-pointer" onClick={toggleStar}>
                  <Star className={`h-4 w-4 transition-colors ${starredItems.has(currentItem.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                </Button>
              </div>

              <div className="flex-1 space-y-2.5 overflow-y-auto mt-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-primary-50/60 rounded-xl p-3 border border-primary-100/60">
                    <h3 className="text-[10px] font-bold uppercase text-primary-500 mb-1.5 flex items-center gap-1.5 tracking-wider">
                      <BookOpen className="h-3 w-3" /> Meaning
                    </h3>
                    <div className="space-y-1">
                      {currentItem.meaning.map((m, idx) => (
                        <div key={idx} className="flex gap-1.5">
                          <div className="h-4 w-4 rounded-full bg-primary-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary-700">{idx + 1}</div>
                          <p className="text-sm leading-snug text-gray-700">{m}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100/60">
                    <h3 className="text-[10px] font-bold uppercase text-emerald-500 mb-1.5 flex items-center gap-1.5 tracking-wider">
                      <FileText className="h-3 w-3" /> Vietnamese
                    </h3>
                    <div className="space-y-1">
                      {currentItem.vietnamese.map((v, idx) => (
                        <div key={idx} className="flex gap-1.5">
                          <div className="h-4 w-4 rounded-full bg-emerald-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-emerald-700">{idx + 1}</div>
                          <p className="text-sm leading-snug text-gray-700">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-primary-50/40 rounded-xl p-3 border border-primary-100/40">
                  <h3 className="text-[10px] font-bold uppercase text-primary-500 mb-1.5 flex items-center gap-1.5 tracking-wider">
                    <Zap className="h-3 w-3" /> Examples
                  </h3>
                  <div className="space-y-1.5">
                    {currentItem.examples.map((ex, idx) => (
                      <div key={idx} className="bg-white/80 rounded-lg p-2 space-y-0.5 border border-gray-100/60">
                        <p className="text-sm italic text-gray-800">&quot;{ex.en}&quot;</p>
                        <p className="text-sm text-gray-400">&quot;{ex.vi}&quot;</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-primary-100/40">
                <Button onClick={(e) => { e.stopPropagation(); onShadowingOpen() }} variant="outline"
                  className="gap-2 bg-transparent w-full h-10 rounded-xl border-2 border-primary-200 hover:border-primary-400 hover:bg-primary-50 text-primary-500 font-semibold cursor-pointer transition-all">
                  <Mic className="h-4 w-4" /> Shadowing Practice
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <Button variant="outline" onClick={() => onSwipe("left")}
          className="gap-2 h-12 px-8 rounded-full border-2 border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-500 shadow-[0_2px_8px_rgba(251,191,36,0.25)] hover:shadow-[0_4px_12px_rgba(251,191,36,0.35)] cursor-pointer transition-all font-semibold">
          <X className="h-5 w-5" /> Still Learning
        </Button>
        <Button onClick={() => onSwipe("right")}
          className="gap-2 h-12 px-8 rounded-full border-2 border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-600 shadow-[0_2px_8px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_12px_rgba(16,185,129,0.35)] cursor-pointer transition-all font-semibold">
          <Check className="h-5 w-5" /> Got it!
        </Button>
      </div>

      {/* Navigation row */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="h-10 rounded-full hover:bg-gray-100 cursor-pointer gap-2 px-4 text-gray-500"
          onClick={() => { if (currentCardIndex > 0) { setCurrentCardIndex(currentCardIndex - 1); setIsFlipped(false) } }}
          disabled={currentCardIndex === 0}>
          <Undo2 className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-center gap-2">
          <span className="notebook-heading text-xl font-extrabold text-gray-900">{currentCardIndex + 1}</span>
          <span className="text-gray-300">/</span>
          <span className="text-xl text-gray-400">{flashcardItems.length}</span>
        </div>

        <Button variant="ghost" className="h-10 rounded-full hover:bg-gray-100 cursor-pointer gap-2 px-4 text-gray-500"
          onClick={() => { setVocabularyItems(p => [...p].sort(() => Math.random() - 0.5)); setCurrentCardIndex(0); setIsFlipped(false) }}>
          <Shuffle className="h-4 w-4" /> Shuffle
        </Button>
      </div>
    </div>
  )
}
