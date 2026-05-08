"use client"

import { ProtectedRoute, PageIcons } from "@/components/auth/protected-route";
import { HubHero } from "@/components/hub";
import { useVocabPage } from "@/hooks/useVocabPage";
import { VocabTabBar } from "@/components/vocab/tab-bar";
import { SearchResults } from "@/components/vocab/search-results";
import { AvailableTopicsTab } from "@/components/vocab/available-topics-tab";
import { BookmarksTab } from "@/components/vocab/bookmarks-tab";
import { DictionaryTab } from "@/components/vocab/dictionary-tab";

// ─── Props ─────────────────────────────────────────

interface VocabPageClientProps {
  userId: string;
}

// ─── Component ─────────────────────────────────────

export default function VocabPageClient({ userId }: VocabPageClientProps) {
  const {
    activeTab,
    setActiveTab,
    filter,
    bookmarks,
    search,
    dictionary,
  } = useVocabPage({ userId });

  return (
    <ProtectedRoute
      pageName="Vocabulary Hub"
      pageDescription="Expand your vocabulary with structured topics and interactive flashcards."
      pageIcon={PageIcons.vocabulary}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <HubHero
          title="VOCABULARY HUB"
          description="Expand your vocabulary with structured topics and interactive flashcards."
          imageSrc="/hero-vocabulary.jpg"
          primaryAction={{ label: "Choose Learning Topic", href: "#topics" }}
          notification={{
            text: "Overview: 7 Topic Groups • 140+ Vocabulary Topics",
          }}
          decorativeWords={["lexicon", "fluency", "expression"]}
        />

        <div id="topics" className="scroll-mt-24">
          <VocabTabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchQuery={search.searchQuery}
            onSearchChange={search.setSearchQuery}
            isSearchMode={search.isSearchMode}
          />
        </div>

        <div className="mt-6">
          <TabContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            search={search}
            filter={filter}
            bookmarks={bookmarks}
            dictionary={dictionary}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}

// ─── Tab Content Router ────────────────────────────

type VocabPageState = ReturnType<typeof useVocabPage>;

function TabContent({
  activeTab,
  setActiveTab,
  search,
  filter,
  bookmarks,
  dictionary,
}: VocabPageState) {
  if (search.isSearchMode) {
    return (
      <SearchResults
        query={search.searchQuery}
        results={search.searchResults}
        isLoading={search.isSearching}
        bookmarkedTopics={bookmarks.bookmarkedTopics}
        onBookmarkToggle={bookmarks.handleBookmarkToggle}
        onClearSearch={() => search.setSearchQuery("")}
      />
    );
  }

  switch (activeTab) {
    case "topics":
      return (
        <AvailableTopicsTab
          topicGroups={filter.topicGroups}
          topicGroupsLoading={filter.topicGroupsLoading}
          selectedGroup={filter.selectedGroup}
          onGroupChange={filter.handleGroupChange}
          selectedLevels={filter.selectedLevels}
          onLevelToggle={filter.toggleLevel}
          currentSubcategories={filter.currentSubcategories}
          selectedSubcategory={filter.selectedSubcategory}
          onSubcategoryChange={filter.handleSubcategoryChange}
          topics={filter.topics}
          topicsLoading={filter.topicsLoading}
          currentPage={filter.currentPage}
          totalPages={filter.totalPages}
          totalTopics={filter.totalTopics}
          onPageChange={filter.setCurrentPage}
          bookmarkedTopics={bookmarks.bookmarkedTopics}
          onBookmarkToggle={bookmarks.handleBookmarkToggle}
        />
      );

    case "bookmarks":
      return (
        <BookmarksTab
          bookmarkedTopicsList={bookmarks.bookmarkedTopicsList}
          onBookmarkToggle={bookmarks.handleBookmarkToggle}
          onBrowseTopics={() => setActiveTab("topics")}
        />
      );



    case "dictionary":
      return (
        <DictionaryTab
          dictionarySearch={dictionary.dictionarySearch}
          onSearchChange={dictionary.setDictionarySearch}
          selectedAlphabet={dictionary.selectedAlphabet}
          onAlphabetChange={dictionary.setSelectedAlphabet}
          selectedDictLevels={dictionary.selectedDictLevels}
          onToggleDictLevel={dictionary.toggleDictLevel}
          onClearDictLevels={dictionary.clearDictLevels}
          filteredWordCount={dictionary.filteredDictionaryWords.length}
          paginatedWords={dictionary.paginatedWords}
          dictPage={dictionary.dictPage}
          dictTotalPages={dictionary.dictTotalPages}
          onPageChange={dictionary.setDictPage}
        />
      );

    default:
      return null;
  }
}
