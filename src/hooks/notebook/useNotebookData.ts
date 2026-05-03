"use client"

import { useState, useEffect, useMemo, useTransition, useCallback } from "react"
import { createNotebook, deleteNotebook, createNotebookItem, deleteNotebookItem, getNotebooks, getNotebookItems } from "@/actions/notebook"
import { useAuth } from "@/contexts/AuthContext"
import type {
  NotebookItem, GrammarItem, CollectionData, CollectionWithIcon, CollectionType,
} from "./types"
import { getCollectionIcon } from "./types"

// ─── Hook ──────────────────────────────────────────

interface UseNotebookDataParams {
  collectionsData: CollectionData[]
  initialVocab: NotebookItem[]
  initialGrammar: GrammarItem[]
}

export function useNotebookData({
  collectionsData,
  initialVocab,
  initialGrammar,
}: UseNotebookDataParams) {
  const { user } = useAuth()
  // ── Data state ──
  const [vocabularyItems, setVocabularyItems] = useState<NotebookItem[]>(initialVocab)
  const [grammarItems, setGrammarItems] = useState<GrammarItem[]>(initialGrammar)
  const [collections, setCollections] = useState<CollectionWithIcon[]>(
    collectionsData.map(c => ({ ...c, icon: getCollectionIcon(c.type) }))
  )

  const [isPending, startTransition] = useTransition()

  // ── Fetch real notebook data from backend on mount ──
  useEffect(() => {
    if (!user?.id) return

    getNotebooks().then(async (notebooks) => {
      if (notebooks.length === 0) return

      // Add user notebooks to collections
      const userCollections: CollectionWithIcon[] = notebooks.map(nb => ({
        id: nb.id,
        name: nb.name,
        count: nb.count,
        mastered: nb.mastered,
        color: nb.color,
        type: nb.type as CollectionType,
        icon: getCollectionIcon(nb.type as CollectionType),
      }))
      setCollections(prev => {
        const existingIds = new Set(prev.map(c => c.id))
        const newOnes = userCollections.filter(c => !existingIds.has(c.id))
        return [...prev, ...newOnes]
      })

      // Fetch items for each vocabulary notebook
      const vocabNotebooks = notebooks.filter(nb => nb.type === "vocabulary")
      const allItems: NotebookItem[] = []
      for (const nb of vocabNotebooks) {
        const items = await getNotebookItems(nb.id)
        allItems.push(...items.map(item => ({
          id: item.id,
          word: item.word,
          pronunciation: item.pronunciation || "/.../",
          meaning: item.meaning,
          vietnamese: item.vietnamese,
          examples: item.examples,
          partOfSpeech: item.partOfSpeech || "noun",
          level: item.level || "A2",
          note: item.note || undefined,
          tags: item.tags,
          collectionId: item.notebookId,
          masteryLevel: item.masteryLevel,
          lastReviewed: item.lastReviewed || undefined,
          nextReview: item.nextReview || undefined,
        })))
      }
      if (allItems.length > 0) {
        setVocabularyItems(prev => [...prev, ...allItems])
      }
    }).catch(err => {
      console.warn("[useNotebookData] Failed to fetch notebooks:", err)
    })
  }, [user?.id])

  // ── Update collection counts when items change ──
  useEffect(() => {
    // ⚡ Bolt: Replace O(N*M) filter inside map with O(N) hash map grouping
    // This prevents performance degradation when vocabularyItems grows to thousands of words.
    const vocabCounts = new Map<string, { count: number, mastered: number }>()
    vocabularyItems.forEach(i => {
      const stats = vocabCounts.get(i.collectionId) || { count: 0, mastered: 0 }
      stats.count += 1
      if (i.masteryLevel >= 80) stats.mastered += 1
      vocabCounts.set(i.collectionId, stats)
    })

    const grammarCounts = new Map<string, { count: number, mastered: number }>()
    grammarItems.forEach(i => {
      const stats = grammarCounts.get(i.collectionId) || { count: 0, mastered: 0 }
      stats.count += 1
      if (i.masteryLevel >= 80) stats.mastered += 1
      grammarCounts.set(i.collectionId, stats)
    })

    setCollections(prev => prev.map(c => {
      const stats = c.type === "vocabulary" ? vocabCounts.get(c.id) : grammarCounts.get(c.id)
      return {
        ...c,
        count: stats?.count || 0,
        mastered: stats?.mastered || 0
      }
    }))
  }, [vocabularyItems, grammarItems])

  // ── Due count ──
  const dueCount = useMemo(() => {
    const nowTime = new Date().getTime()
    // ⚡ Bolt: Replace .filter(...).length with a single in-place .reduce() loop to prevent unnecessary GC overhead
    return vocabularyItems.reduce((count, item) => {
      if (item.nextReview && new Date(item.nextReview).getTime() <= nowTime) {
        return count + 1
      }
      return count
    }, 0)
  }, [vocabularyItems])

  // ── Stats ──
  // ⚡ Bolt: Wrap getStats in useCallback to prevent stats from being recalculated on every render in useNotebookPage
  const getStats = useCallback((collectionType: CollectionType, selectedCollection: string) => {
    const items = collectionType === "vocabulary"
      ? vocabularyItems.filter(i => i.collectionId === selectedCollection)
      : grammarItems.filter(i => i.collectionId === selectedCollection)

    // ⚡ Bolt: Replace multiple O(N) filters and reduce with a single O(N) pass
    let mastered = 0
    let learning = 0
    let newItems = 0
    let masterySum = 0

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      masterySum += item.masteryLevel

      if (item.masteryLevel >= 80) mastered++
      else if (item.masteryLevel >= 20) learning++
      else newItems++
    }

    const total = items.length
    const avgMastery = total > 0 ? Math.round(masterySum / total) : 0

    return { total, mastered, learning, newItems, avgMastery }
  }, [vocabularyItems, grammarItems])

  // ── CRUD Handlers ──

  const handleAddCollection = async (
    name: string,
    type: CollectionType,
    onSuccess: () => void,
  ) => {
    if (!name.trim()) return

    startTransition(async () => {
      const result = await createNotebook({ name, type, color: "primary" })

      if (result.success && result.notebook) {
        setCollections(prev => [...prev, {
          ...result.notebook!,
          type: result.notebook!.type as CollectionType,
          icon: getCollectionIcon(result.notebook!.type as CollectionType),
        }])
      } else {
        const newId = `${type}-${Date.now()}`
        setCollections(prev => [...prev, {
          id: newId, name, count: 0, mastered: 0, color: "primary",
          type, icon: getCollectionIcon(type),
        }])
      }
      onSuccess()
    })
  }

  const handleAddItem = async (
    selectedCollection: string,
    newItem: {
      word: string; pronunciation: string; meaning: string; vietnamese: string
      example: string; exampleVi: string; partOfSpeech: string; level: string
      note: string; tags: string
    },
    onSuccess: () => void,
  ) => {
    if (!newItem.word.trim()) return

    const meaningArr = newItem.meaning.split("\n").filter(Boolean)
    const vietnameseArr = newItem.vietnamese.split("\n").filter(Boolean)
    const examplesArr = newItem.example ? [{ en: newItem.example, vi: newItem.exampleVi }] : []
    const tagsArr = newItem.tags.split(",").map(t => t.trim()).filter(Boolean)

    startTransition(async () => {
      const result = await createNotebookItem({
        notebookId: selectedCollection,
        word: newItem.word,
        pronunciation: newItem.pronunciation || "/.../",
        meaning: meaningArr,
        vietnamese: vietnameseArr,
        examples: examplesArr,
        partOfSpeech: newItem.partOfSpeech,
        level: newItem.level,
        note: newItem.note || undefined,
        tags: tagsArr,
      })

      if (result.success && result.item) {
        const item: NotebookItem = {
          id: result.item.id,
          word: result.item.word,
          pronunciation: result.item.pronunciation || "/.../",
          meaning: result.item.meaning,
          vietnamese: result.item.vietnamese,
          examples: result.item.examples,
          partOfSpeech: result.item.partOfSpeech || "noun",
          level: result.item.level || "A2",
          note: result.item.note || undefined,
          tags: result.item.tags,
          collectionId: result.item.notebookId,
          masteryLevel: result.item.masteryLevel,
          nextReview: result.item.nextReview || undefined,
        }
        setVocabularyItems(prev => [...prev, item])
      } else {
        const item: NotebookItem = {
          id: `v${Date.now()}`, word: newItem.word, pronunciation: newItem.pronunciation || "/.../",
          meaning: meaningArr, vietnamese: vietnameseArr, examples: examplesArr,
          partOfSpeech: newItem.partOfSpeech, level: newItem.level, note: newItem.note,
          tags: tagsArr, collectionId: selectedCollection, masteryLevel: 0,
          nextReview: new Date().toISOString(),
        }
        setVocabularyItems(prev => [...prev, item])
      }
      onSuccess()
    })
  }

  const handleAddGrammar = (
    selectedCollection: string,
    newGrammar: {
      title: string; rule: string; explanation: string; category: string
      level: string; exampleEn: string; exampleVi: string
    },
    onSuccess: () => void,
  ) => {
    if (!newGrammar.title.trim()) return
    const item: GrammarItem = {
      id: `g${Date.now()}`, title: newGrammar.title, rule: newGrammar.rule,
      explanation: newGrammar.explanation, category: newGrammar.category, level: newGrammar.level,
      examples: newGrammar.exampleEn ? [{ en: newGrammar.exampleEn, vi: newGrammar.exampleVi }] : [],
      collectionId: selectedCollection, masteryLevel: 0,
    }
    setGrammarItems(prev => [...prev, item])
    onSuccess()
  }

  const handleEditItem = (editingItem: NotebookItem | null, onSuccess: () => void) => {
    if (!editingItem) return
    setVocabularyItems(prev => prev.map(item => item.id === editingItem.id ? editingItem : item))
    onSuccess()
  }

  const handleDeleteItem = async (itemId: string | null, onSuccess: () => void) => {
    if (!itemId) return

    startTransition(async () => {
      await deleteNotebookItem(itemId)
      setVocabularyItems(prev => prev.filter(item => item.id !== itemId))
      setGrammarItems(prev => prev.filter(item => item.id !== itemId))
      onSuccess()
    })
  }

  const handleDeleteNotebook = async (notebookId: string | null, onSuccess: () => void) => {
    if (!notebookId) return

    startTransition(async () => {
      await deleteNotebook(notebookId)
      setVocabularyItems(prev => prev.filter(item => item.collectionId !== notebookId))
      setGrammarItems(prev => prev.filter(item => item.collectionId !== notebookId))
      setCollections(prev => prev.filter(c => c.id !== notebookId))
      onSuccess()
    })
  }

  return {
    vocabularyItems,
    setVocabularyItems,
    grammarItems,
    setGrammarItems,
    collections,
    isPending,
    dueCount,
    getStats,
    handleAddCollection,
    handleAddItem,
    handleAddGrammar,
    handleEditItem,
    handleDeleteItem,
    handleDeleteNotebook,
  }
}
