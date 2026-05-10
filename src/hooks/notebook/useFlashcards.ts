"use client"

import { useState, useEffect, useMemo } from "react"
import type { NotebookItem, GrammarItem, CollectionType } from "./types"

// ─── Hook ──────────────────────────────────────────

interface UseFlashcardsParams {
  currentCollectionType: CollectionType
  filteredVocabItems: NotebookItem[]
  filteredGrammarItems: GrammarItem[]
  selectedItems: Set<string>
  vocabularyItems: NotebookItem[]
  setVocabularyItems: React.Dispatch<React.SetStateAction<NotebookItem[]>>
  setGrammarItems: React.Dispatch<React.SetStateAction<GrammarItem[]>>
  sessionCompleteOpen: boolean
  setSessionCompleteOpen: (open: boolean) => void
  setIsReviewModalOpen: (open: boolean) => void
  setSelectedItems: (items: Set<string>) => void
}

export function useFlashcards({
  currentCollectionType,
  filteredVocabItems,
  filteredGrammarItems,
  selectedItems,
  vocabularyItems,
  setVocabularyItems,
  setGrammarItems,
  sessionCompleteOpen,
  setSessionCompleteOpen,
  setIsReviewModalOpen,
  setSelectedItems,
}: UseFlashcardsParams) {
  // ── Card state ──
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [cardAnimation, setCardAnimation] = useState<"" | "swipe-left" | "swipe-right">("")
  const [learnedCards, setLearnedCards] = useState<Set<string>>(new Set())
  const [notLearnedCards, setNotLearnedCards] = useState<Set<string>>(new Set())

  // ── Quiz state ──
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)

  // ── Shadowing ──
  const [currentSentence, setCurrentSentence] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  // ── Derived ──
  const flashcardItems = useMemo(() => {
    if (currentCollectionType === "grammar") return []
    return selectedItems.size > 0
      ? filteredVocabItems.filter(item => selectedItems.has(item.id))
      : filteredVocabItems
  }, [currentCollectionType, selectedItems, filteredVocabItems])

  const currentItem = flashcardItems[currentCardIndex]
  const currentGrammarItem = filteredGrammarItems[currentQuizIndex]

  // ── Auto-unflip on card change ──
  useEffect(() => { setIsFlipped(false) }, [currentCardIndex])

  // ── Keyboard navigation ──
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (sessionCompleteOpen || currentCollectionType === "grammar") return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
          return;
      }
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowDown") {
        e.preventDefault()
        setIsFlipped(prev => !prev)
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault()
        if (currentCardIndex > 0) {
          setCurrentCardIndex(currentCardIndex - 1)
          setIsFlipped(false)
        }
      }
      if (e.code === "ArrowRight") {
        e.preventDefault()
        if (currentCardIndex < flashcardItems.length - 1) {
          setCurrentCardIndex(currentCardIndex + 1)
          setIsFlipped(false)
        }
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isFlipped, currentCardIndex, flashcardItems.length, sessionCompleteOpen, currentCollectionType])

  // ── Handlers ──
  const resetSession = () => {
    setCurrentCardIndex(0)
    setLearnedCards(new Set())
    setNotLearnedCards(new Set())
    setIsFlipped(false)
    setSessionCompleteOpen(false)
    setQuizAnswers({})
    setQuizSubmitted(false)
    setCurrentQuizIndex(0)
  }

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentItem) return
    if (direction === "left") {
      setNotLearnedCards(prev => new Set(prev).add(currentItem.id))
      setLearnedCards(prev => { const s = new Set(prev); s.delete(currentItem.id); return s })
    } else {
      setLearnedCards(prev => new Set(prev).add(currentItem.id))
      setNotLearnedCards(prev => { const s = new Set(prev); s.delete(currentItem.id); return s })
      setVocabularyItems(prev => prev.map(item =>
        item.id === currentItem.id ? { ...item, masteryLevel: Math.min(100, item.masteryLevel + 10) } : item
      ))
    }
    setCardAnimation(direction === "left" ? "swipe-left" : "swipe-right")
    setTimeout(() => {
      if (currentCardIndex < flashcardItems.length - 1) setCurrentCardIndex(currentCardIndex + 1)
      else setSessionCompleteOpen(true)
      setCardAnimation("")
    }, 500)
  }

  const handleReviewAnswer = (quality: number) => {
    if (!currentItem) return
    const masteryChange = quality === 0 ? -20 : quality === 1 ? -10 : quality === 2 ? 5 : quality === 3 ? 15 : 25
    setVocabularyItems(prev => prev.map(item =>
      item.id === currentItem.id
        ? { ...item, masteryLevel: Math.max(0, Math.min(100, item.masteryLevel + masteryChange)), lastReviewed: "Just now" }
        : item
    ))
    if (currentCardIndex < flashcardItems.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setShowAnswer(false)
    } else {
      setIsReviewModalOpen(false)
      setSessionCompleteOpen(true)
    }
  }

  const startReview = () => {
    const dueItems = vocabularyItems.filter(item => item.nextReview && new Date(item.nextReview) <= new Date())
    if (dueItems.length > 0) setSelectedItems(new Set(dueItems.map(i => i.id)))
    resetSession()
    setIsReviewModalOpen(true)
  }

  const handleQuizAnswer = (itemId: string, answer: string) => {
    setQuizAnswers(prev => ({ ...prev, [itemId]: answer }))
  }

  const submitQuiz = () => {
    setQuizSubmitted(true)
    filteredGrammarItems.forEach(item => {
      const userAnswer = quizAnswers[item.id]
      const isCorrect = userAnswer === item.examples[0]?.en
      setGrammarItems(prev => prev.map(g =>
        g.id === item.id
          ? { ...g, masteryLevel: Math.max(0, Math.min(100, g.masteryLevel + (isCorrect ? 15 : -10))) }
          : g
      ))
    })
  }

  return {
    // Card
    currentCardIndex, setCurrentCardIndex,
    isFlipped, setIsFlipped,
    cardAnimation,
    learnedCards, notLearnedCards,
    flashcardItems, currentItem,

    // Quiz
    quizAnswers, quizSubmitted,
    currentQuizIndex, setCurrentQuizIndex,
    currentGrammarItem,

    // Shadowing
    currentSentence, setCurrentSentence,
    isRecording, setIsRecording,
    showAnswer, setShowAnswer,

    // Handlers
    resetSession,
    handleSwipe,
    handleReviewAnswer,
    startReview,
    handleQuizAnswer,
    submitQuiz,
  }
}
