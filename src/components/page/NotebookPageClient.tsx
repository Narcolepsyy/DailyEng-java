"use client"

import { GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProtectedRoute, PageIcons } from "@/components/auth/protected-route"
import {
  useNotebookPage,
  type NotebookPageClientProps,
  type CollectionType,
} from "@/hooks/useNotebookPage"

// Re-export types for downstream consumers
export type {
  MasteryLevel, CollectionType, NotebookItem, GrammarItem,
  CollectionData, NotebookPageClientProps,
} from "@/hooks/useNotebookPage"
export { MASTERY_LEVELS } from "@/hooks/useNotebookPage"

// Lazy-loaded view components
import { NotebookSidebar } from "@/components/notebook/NotebookSidebar"
import { WelcomeScreen } from "@/components/notebook/WelcomeScreen"
import { VocabularyListView } from "@/components/notebook/VocabularyListView"
import { GrammarListView } from "@/components/notebook/GrammarListView"
import { VocabularyFlashcards } from "@/components/notebook/VocabularyFlashcards"
import { GrammarQuiz } from "@/components/notebook/GrammarQuiz"
import { StatisticsView } from "@/components/notebook/StatisticsView"
import { NotebookDialogs } from "@/components/notebook/NotebookDialogs"

// ─── Component ─────────────────────────────────────

export default function NotebookPageClient({
  collections: collectionsData,
  vocabularyItems: initialVocab,
  grammarItems: initialGrammar,
}: NotebookPageClientProps) {
  const state = useNotebookPage({
    collectionsData,
    initialVocab,
    initialGrammar,
  })

  return (
    <ProtectedRoute pageName="Notebook" pageDescription="Save and organize your vocabulary and grammar." pageIcon={PageIcons.notebook}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex gap-6 min-h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <NotebookSidebar
            collections={state.collections}
            filteredCollections={state.filteredCollections}
            selectedCollection={state.selectedCollection}
            collectionTypeFilter={state.collectionTypeFilter}
            dueCount={state.dueCount}
            stats={state.stats}
            isLoading={state.isLoadingNotebooks}
            onCollectionTypeChange={(type) => { state.setCollectionTypeFilter(type); state.setSelectedCollection("") }}
            onSelectCollection={state.selectCollection}
            onNewNotebook={() => state.setNewCollectionOpen(true)}
            onDeleteNotebook={(id) => { state.setNotebookToDelete(id); state.setDeleteNotebookOpen(true) }}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Pill Tabs */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex gap-1 p-1 bg-primary-50/60 rounded-full border border-primary-100">
                {[
                  { value: "list", label: state.collectionTypeFilter === "vocabulary" ? "List View" : "All Rules" },
                  { value: "flashcards", label: state.collectionTypeFilter === "vocabulary" ? "Flashcards" : "Quizzes" },
                  { value: "statistics", label: "Statistics" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => state.setViewMode(tab.value as "list" | "flashcards" | "statistics")}
                    className={`notebook-tab whitespace-nowrap ${
                      state.viewMode === tab.value ? "notebook-tab-active" : ""
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {state.viewMode === "list" && state.selectedItems.size > 0 && state.currentCollectionType === "vocabulary" && (
                  <Button onClick={state.startPractice}
                    className="gap-2 rounded-full h-10 px-5 cursor-pointer bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-md shadow-primary-500/20 transition-all duration-200">
                    <GraduationCap className="h-4 w-4" /> Practice ({state.selectedItems.size})
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 notebook-enter">
              <ViewContent state={state} />
            </div>
          </div>
        </div>

        <NotebookDialogs
          isReviewModalOpen={state.isReviewModalOpen}
          setIsReviewModalOpen={state.setIsReviewModalOpen}
          currentItem={state.currentItem}
          currentCardIndex={state.currentCardIndex}
          flashcardItemsLength={state.flashcardItems.length}
          showAnswer={state.showAnswer}
          setShowAnswer={state.setShowAnswer}
          onReviewAnswer={state.handleReviewAnswer}
          sessionCompleteOpen={state.sessionCompleteOpen}
          setSessionCompleteOpen={state.setSessionCompleteOpen}
          learnedCards={state.learnedCards}
          notLearnedCards={state.notLearnedCards}
          onResetSession={state.resetSession}
          onReviewUnmastered={() => { state.setCurrentCardIndex(0); state.setSessionCompleteOpen(false); state.setIsFlipped(false) }}
          onGoToList={() => { state.setSessionCompleteOpen(false); state.setViewMode("list") }}
          shadowingOpen={state.shadowingOpen}
          setShadowingOpen={state.setShadowingOpen}
          currentSentence={state.currentSentence}
          setCurrentSentence={state.setCurrentSentence}
          isRecording={state.isRecording}
          setIsRecording={state.setIsRecording}
          newCollectionOpen={state.newCollectionOpen}
          setNewCollectionOpen={state.setNewCollectionOpen}
          newCollectionName={state.newCollectionName}
          setNewCollectionName={state.setNewCollectionName}
          newCollectionType={state.newCollectionType}
          setNewCollectionType={state.setNewCollectionType}
          onAddCollection={() => {
            state.handleAddCollection(state.newCollectionName, state.newCollectionType, () => {
              state.resetNewCollectionForm()
              state.setNewCollectionOpen(false)
            })
          }}
          addItemOpen={state.addItemOpen}
          setAddItemOpen={state.setAddItemOpen}
          newItem={state.newItem}
          setNewItem={state.setNewItem}
          onAddItem={() => {
            state.handleAddItem(state.selectedCollection, state.newItem, () => {
              state.resetNewItemForm()
              state.setAddItemOpen(false)
            })
          }}
          addGrammarOpen={state.addGrammarOpen}
          setAddGrammarOpen={state.setAddGrammarOpen}
          newGrammar={state.newGrammar}
          setNewGrammar={state.setNewGrammar}
          onAddGrammar={() => {
            state.handleAddGrammar(state.selectedCollection, state.newGrammar, () => {
              state.resetNewGrammarForm()
              state.setAddGrammarOpen(false)
            })
          }}
          editItemOpen={state.editItemOpen}
          setEditItemOpen={state.setEditItemOpen}
          editingItem={state.editingItem}
          setEditingItem={state.setEditingItem}
          onEditItem={() => {
            state.handleEditItem(state.editingItem, () => {
              state.setEditingItem(null)
              state.setEditItemOpen(false)
            })
          }}
          deleteConfirmOpen={state.deleteConfirmOpen}
          setDeleteConfirmOpen={state.setDeleteConfirmOpen}
          onDeleteItem={() => {
            state.handleDeleteItem(state.itemToDelete, () => {
              state.setItemToDelete(null)
              state.setDeleteConfirmOpen(false)
            })
          }}
          deleteNotebookOpen={state.deleteNotebookOpen}
          setDeleteNotebookOpen={state.setDeleteNotebookOpen}
          onDeleteNotebook={() => {
            state.handleDeleteNotebook(state.notebookToDelete, () => {
              state.setNotebookToDelete(null)
              state.setDeleteNotebookOpen(false)
              // Select first available
              const remaining = state.collections.filter(c => c.id !== state.notebookToDelete)
              state.setSelectedCollection(remaining.length > 0 ? remaining[0].id : "")
            })
          }}
        />
      </div>
    </ProtectedRoute>
  )
}

// ─── View Content Router ───────────────────────────

function ViewContent({ state }: { state: ReturnType<typeof useNotebookPage> }) {
  if (!state.selectedCollection) {
    return <WelcomeScreen collectionTypeFilter={state.collectionTypeFilter} />
  }

  if (state.viewMode === "statistics") {
    return (
      <StatisticsView
        currentCollectionType={state.currentCollectionType}
        selectedCollection={state.selectedCollection}
        vocabularyItems={state.vocabularyItems}
        grammarItems={state.grammarItems}
        stats={state.stats}
        dueCount={state.dueCount}
        onStartReview={state.startReview}
      />
    )
  }

  if (state.viewMode === "flashcards") {
    if (state.currentCollectionType === "grammar") {
      return (
        <GrammarQuiz
          filteredGrammarItems={state.filteredGrammarItems}
          quizAnswers={state.quizAnswers}
          quizSubmitted={state.quizSubmitted}
          onQuizAnswer={state.handleQuizAnswer}
          onSubmitQuiz={state.submitQuiz}
          onResetSession={state.resetSession}
          onGoToList={() => state.setViewMode("list")}
        />
      )
    }

    return (
      <VocabularyFlashcards
        currentItem={state.currentItem}
        currentCardIndex={state.currentCardIndex}
        setCurrentCardIndex={state.setCurrentCardIndex}
        isFlipped={state.isFlipped}
        setIsFlipped={state.setIsFlipped}
        cardAnimation={state.cardAnimation}
        flashcardItems={state.flashcardItems}
        learnedCards={state.learnedCards}
        notLearnedCards={state.notLearnedCards}
        starredItems={state.starredItems}
        setStarredItems={state.setStarredItems}
        setVocabularyItems={state.setVocabularyItems}
        onSwipe={state.handleSwipe}
        onShadowingOpen={() => { state.setShadowingOpen(true); state.setCurrentSentence(0) }}
        onGoToList={() => state.setViewMode("list")}
      />
    )
  }

  // list view
  if (state.currentCollectionType === "grammar") {
    return (
      <GrammarListView
        filteredGrammarItems={state.filteredGrammarItems}
        searchQuery={state.searchQuery}
        setSearchQuery={state.setSearchQuery}
        levelFilter={state.levelFilter}
        setLevelFilter={state.setLevelFilter}
        onDelete={(id) => { state.setItemToDelete(id); state.setDeleteConfirmOpen(true) }}
        onAddGrammar={() => state.setAddGrammarOpen(true)}
      />
    )
  }

  return (
    <VocabularyListView
      filteredVocabItems={state.filteredVocabItems}
      selectedItems={state.selectedItems}
      setSelectedItems={state.setSelectedItems}
      starredItems={state.starredItems}
      setStarredItems={state.setStarredItems}
      searchQuery={state.searchQuery}
      setSearchQuery={state.setSearchQuery}
      masteryFilter={state.masteryFilter}
      setMasteryFilter={state.setMasteryFilter}
      starredFilter={state.starredFilter}
      setStarredFilter={state.setStarredFilter}
      levelFilter={state.levelFilter}
      setLevelFilter={state.setLevelFilter}
      onEdit={(item) => { state.setEditingItem(item); state.setEditItemOpen(true) }}
      onDelete={(id) => { state.setItemToDelete(id); state.setDeleteConfirmOpen(true) }}
      onAddItem={() => state.setAddItemOpen(true)}
    />
  )
}
