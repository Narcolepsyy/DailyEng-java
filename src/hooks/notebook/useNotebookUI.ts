"use client"

import { useState, useMemo } from "react"
import type {
  NotebookItem, GrammarItem, CollectionWithIcon, CollectionType, ViewMode,
} from "./types"
import { getMasteryCategory } from "./types"

// ─── Hook ──────────────────────────────────────────

interface UseNotebookUIParams {
  collections: CollectionWithIcon[]
  vocabularyItems: NotebookItem[]
  grammarItems: GrammarItem[]
}

export function useNotebookUI({
  collections,
  vocabularyItems,
  grammarItems,
}: UseNotebookUIParams) {
  // ── Core UI state ──
  const [selectedCollection, setSelectedCollection] = useState<string>("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [starredItems, setStarredItems] = useState<Set<string>>(new Set())
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [collectionTypeFilter, setCollectionTypeFilter] = useState<CollectionType>("vocabulary")

  // ── Filters ──
  const [masteryFilter, setMasteryFilter] = useState<string[]>([])
  const [starredFilter, setStarredFilter] = useState<boolean | null>(null)
  const [levelFilter, setLevelFilter] = useState<string[]>([])

  // ── Dialog state ──
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [sessionCompleteOpen, setSessionCompleteOpen] = useState(false)
  const [shadowingOpen, setShadowingOpen] = useState(false)
  const [newCollectionOpen, setNewCollectionOpen] = useState(false)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [addGrammarOpen, setAddGrammarOpen] = useState(false)
  const [editItemOpen, setEditItemOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteNotebookOpen, setDeleteNotebookOpen] = useState(false)
  const [notebookToDelete, setNotebookToDelete] = useState<string | null>(null)

  // ── Form state ──
  const [newCollectionName, setNewCollectionName] = useState("")
  const [newCollectionType, setNewCollectionType] = useState<CollectionType>("vocabulary")
  const [editingItem, setEditingItem] = useState<NotebookItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({
    word: "", pronunciation: "", meaning: "", vietnamese: "",
    example: "", exampleVi: "", partOfSpeech: "noun", level: "A2", note: "", tags: "",
  })
  const [newGrammar, setNewGrammar] = useState({
    title: "", rule: "", explanation: "", category: "Tenses", level: "A2",
    exampleEn: "", exampleVi: "",
  })

  // ── Derived ──
  const currentCollectionType = useMemo(() => {
    const col = collections.find(c => c.id === selectedCollection)
    return col?.type || "vocabulary"
  }, [collections, selectedCollection])

  const filteredCollections = useMemo(() => {
    return collections.filter(c => c.type === collectionTypeFilter)
  }, [collections, collectionTypeFilter])

  const filteredVocabItems = useMemo(() => {
    // ⚡ Bolt: Pre-calculate invariant values to avoid redundant string allocation inside the loop
    const lowerSearch = searchQuery.toLowerCase()
    return vocabularyItems.filter((item) => {
      if (item.collectionId !== selectedCollection) return false
      const matchesSearch = lowerSearch === "" ||
        item.word.toLowerCase().includes(lowerSearch) ||
        item.meaning.some(m => m.toLowerCase().includes(lowerSearch)) ||
        item.vietnamese.some(v => v.toLowerCase().includes(lowerSearch))
      if (!matchesSearch) return false
      if (masteryFilter.length > 0 && !masteryFilter.includes(getMasteryCategory(item.masteryLevel))) return false
      if (starredFilter !== null && starredItems.has(item.id) !== starredFilter) return false
      if (levelFilter.length > 0 && !levelFilter.includes(item.level)) return false
      return true
    })
  }, [vocabularyItems, selectedCollection, searchQuery, masteryFilter, starredFilter, levelFilter, starredItems])

  const filteredGrammarItems = useMemo(() => {
    // ⚡ Bolt: Pre-calculate invariant values to avoid redundant string allocation inside the loop
    const lowerSearch = searchQuery.toLowerCase()
    return grammarItems.filter((item) => {
      if (item.collectionId !== selectedCollection) return false
      const matchesSearch = lowerSearch === "" ||
        item.title.toLowerCase().includes(lowerSearch) ||
        item.explanation.toLowerCase().includes(lowerSearch)
      if (!matchesSearch) return false
      if (masteryFilter.length > 0 && !masteryFilter.includes(getMasteryCategory(item.masteryLevel))) return false
      if (levelFilter.length > 0 && !levelFilter.includes(item.level)) return false
      return true
    })
  }, [grammarItems, selectedCollection, searchQuery, masteryFilter, levelFilter])

  // ── Selection helpers ──
  const selectCollection = (id: string) => {
    setSelectedCollection(id)
    setSelectedItems(new Set())
    setViewMode("list")
  }

  const resetNewItemForm = () => {
    setNewItem({
      word: "", pronunciation: "", meaning: "", vietnamese: "",
      example: "", exampleVi: "", partOfSpeech: "noun", level: "A2", note: "", tags: "",
    })
  }

  const resetNewGrammarForm = () => {
    setNewGrammar({
      title: "", rule: "", explanation: "", category: "Tenses", level: "A2",
      exampleEn: "", exampleVi: "",
    })
  }

  const resetNewCollectionForm = () => {
    setNewCollectionName("")
    setNewCollectionType("vocabulary")
  }

  return {
    // Core UI
    selectedCollection, setSelectedCollection, selectCollection,
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    starredItems, setStarredItems,
    selectedItems, setSelectedItems,
    collectionTypeFilter, setCollectionTypeFilter,

    // Filters
    masteryFilter, setMasteryFilter,
    starredFilter, setStarredFilter,
    levelFilter, setLevelFilter,

    // Dialogs
    isReviewModalOpen, setIsReviewModalOpen,
    sessionCompleteOpen, setSessionCompleteOpen,
    shadowingOpen, setShadowingOpen,
    newCollectionOpen, setNewCollectionOpen,
    addItemOpen, setAddItemOpen,
    addGrammarOpen, setAddGrammarOpen,
    editItemOpen, setEditItemOpen,
    deleteConfirmOpen, setDeleteConfirmOpen,
    deleteNotebookOpen, setDeleteNotebookOpen,
    notebookToDelete, setNotebookToDelete,

    // Forms
    newCollectionName, setNewCollectionName,
    newCollectionType, setNewCollectionType,
    editingItem, setEditingItem,
    itemToDelete, setItemToDelete,
    newItem, setNewItem,
    newGrammar, setNewGrammar,
    resetNewItemForm, resetNewGrammarForm, resetNewCollectionForm,

    // Derived
    currentCollectionType, filteredCollections,
    filteredVocabItems, filteredGrammarItems,
  }
}
