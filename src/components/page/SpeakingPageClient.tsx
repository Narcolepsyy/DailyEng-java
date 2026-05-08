"use client";

import { ProtectedRoute, PageIcons } from "@/components/auth/protected-route";
import { HubHero } from "@/components/hub/hub-hero";
import type { TopicGroup } from "@/components/hub/topic-groups-sidebar";
import { useSpeakingPage } from "@/hooks/useSpeakingPage";
import dynamic from "next/dynamic";
import { SessionSkeleton } from "@/components/speaking/session-skeleton";
import { SpeakingTabBar } from "@/components/speaking/tab-bar";
import { SparkleLoadingOverlay } from "@/components/speaking/sparkle-loading-overlay";

// --- Dynamic Imports for Heavy Client Components ---
const SearchResults = dynamic(() => import("@/components/speaking/search-results").then(m => m.SearchResults));
const CreateScenarioDialog = dynamic(() => import("@/components/speaking/create-scenario-dialog").then(m => m.CreateScenarioDialog));
const AvailableTopicsTab = dynamic(() => import("@/components/speaking/available-topics-tab").then(m => m.AvailableTopicsTab));
const BookmarksTab = dynamic(() => import("@/components/speaking/bookmarks-tab").then(m => m.BookmarksTab));
const CustomTopicsTab = dynamic(() => import("@/components/speaking/custom-topics-tab").then(m => m.CustomTopicsTab));
const HistoryTab = dynamic(() => import("@/components/speaking/history-tab").then(m => m.HistoryTab));
import { useTranslation } from "@/hooks/use-translation";

// ─── Props ─────────────────────────────────────────

export interface SpeakingPageClientProps {
  initialTopicGroups?: TopicGroup[];
  userId: string;
  initialBookmarkIds?: string[];
}

// ─── Component ─────────────────────────────────────

export default function SpeakingPageClient({
  initialTopicGroups = [],
  userId,
  initialBookmarkIds = [],
}: SpeakingPageClientProps) {
  const {
    activeTab,
    setActiveTab,
    router,
    search,
    filter,
    bookmarks,
    customTopics,
    history,
    navigatingToSessionId,
    setNavigatingToSessionId,
  } = useSpeakingPage({ initialTopicGroups, userId, initialBookmarkIds });

  const { t } = useTranslation();

  if (navigatingToSessionId) {
    return (
      <div className="min-h-screen bg-background">
        <SessionSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {customTopics.isGenerating ? (
        <SparkleLoadingOverlay message={customTopics.generatingMessage} />
      ) : null}

      <ProtectedRoute
        pageName={t("speaking_hub.page_name")}
        pageDescription={t("speaking_hub.page_description")}
        pageIcon={PageIcons.speaking}
      >
        <div className="flex flex-col mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <HubHero
            title={t("speaking_hub.title")}
            description={t("speaking_hub.description")}
            imageSrc="/hero-speaking.jpg"
            primaryAction={{ label: "Choose Learning Topic", href: "#topics" }}
            notification={{
              text: "Overview: 7 Topic Groups • 168 Speaking Topics",
            }}
            decorativeWords={["speaking", "fluency", "practice"]}
          />

          <div id="topics" className="scroll-mt-24 w-full">
            <SpeakingTabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchQuery={search.searchQuery}
              onSearchChange={search.setSearchQuery}
              isSearchMode={search.isSearchMode}
            />
          </div>

          <TabContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            router={router}
            search={search}
            filter={filter}
            bookmarks={bookmarks}
            customTopics={customTopics}
            history={history}
            navigatingToSessionId={navigatingToSessionId}
            setNavigatingToSessionId={setNavigatingToSessionId}
          />
        </div>
      </ProtectedRoute>

      <CreateScenarioDialog
        open={customTopics.isDialogOpen}
        onOpenChange={customTopics.setIsDialogOpen}
        topicPrompt={customTopics.topicPrompt}
        onTopicPromptChange={customTopics.setTopicPrompt}
        isCreating={customTopics.isCreating}
        onCreateScenario={customTopics.handleCreateScenario}
      />
    </div>
  );
}

// ─── Tab Content Router ────────────────────────────

type SpeakingPageState = ReturnType<typeof useSpeakingPage> & {
  navigatingToSessionId: string | null;
  setNavigatingToSessionId: (id: string | null) => void;
};

function TabContent({
  activeTab,
  setActiveTab,
  router,
  search,
  filter,
  bookmarks,
  customTopics,
  history,
  navigatingToSessionId,
  setNavigatingToSessionId,
}: SpeakingPageState) {
  if (search.isSearchMode) {
    return (
      <SearchResults
        query={search.searchQuery}
        results={search.searchResults}
        isLoading={search.searchLoading}
        bookmarkedTopics={bookmarks.bookmarkedTopics}
        onBookmarkToggle={bookmarks.handleBookmarkToggle}
        onClearSearch={() => search.setSearchQuery("")}
        onScenarioClick={(id) => setNavigatingToSessionId(id)}
      />
    );
  }

  switch (activeTab) {
    case "available":
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
          onSubcategoryChange={filter.setSelectedSubcategory}
          scenarios={filter.scenarios}
          scenariosLoading={filter.scenariosLoading}
          scenarioPage={filter.scenarioPage}
          scenarioTotalPages={filter.scenarioTotalPages}
          onPageChange={filter.setScenarioPage}
          bookmarkedTopics={bookmarks.bookmarkedTopics}
          onBookmarkToggle={bookmarks.handleBookmarkToggle}
          onScenarioClick={(id) => setNavigatingToSessionId(id)}
        />
      );

    case "bookmarks":
      return (
        <BookmarksTab
          bookmarkedTopicsList={bookmarks.bookmarkedTopicsList}
          bookmarkLoading={bookmarks.bookmarkLoading}
          bookmarkPage={bookmarks.bookmarkPage}
          bookmarkTotalPages={bookmarks.bookmarkTotalPages}
          onPageChange={bookmarks.setBookmarkPage}
          onBookmarkToggle={bookmarks.handleBookmarkToggle}
          onBrowseTopics={() => setActiveTab("available")}
          onScenarioClick={(id) => setNavigatingToSessionId(id)}
        />
      );

    case "custom":
      return (
        <CustomTopicsTab
          onFreeTalk={customTopics.handleFreeTalk}
          onOpenDialog={() => customTopics.setIsDialogOpen(true)}
          onSurpriseMe={customTopics.handleSurpriseMe}
          customScenarios={customTopics.customScenarios}
          customScenariosLoading={customTopics.customScenariosLoading}
          bookmarkedTopics={bookmarks.bookmarkedTopics}
          onBookmarkToggle={bookmarks.handleBookmarkToggle}
          onScenarioClick={(id) => setNavigatingToSessionId(id)}
          onDeleteScenario={customTopics.handleDeleteScenario}
        />
      );

    case "history":
      return (
        <HistoryTab
          historySessions={history.historySessions}
          historyStats={history.historyStats}
          historyLoading={history.historyLoading}
          historyStatsLoading={history.historyStatsLoading}
          historyPage={history.historyPage}
          historyTotalPages={history.historyTotalPages}
          historyRatingFilter={history.historyRatingFilter}
          onPageChange={history.setHistoryPage}
          onRatingFilterChange={history.setHistoryRatingFilter}
          onSessionClick={(scenarioId, sessionId) =>
            router.push(
              `/speaking-room/session/${scenarioId}?session=${sessionId}&from=history`
            )
          }
          onDeleteSession={history.handleDeleteSession}
        />
      );

    default:
      return null;
  }
}
