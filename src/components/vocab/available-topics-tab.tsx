import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import {
  TopicGroupsSidebar,
  LevelsSidebar,
  TopicCard,
  SubcategoryPills,
  type TopicGroup,
} from "@/components/hub";
import { TopicCardSkeleton } from "./topic-card-skeleton";
import { Pagination } from "./pagination";
import type { VocabTopic } from "@/hooks/vocab/types";

interface AvailableTopicsTabProps {
  // Sidebar
  topicGroups: TopicGroup[];
  topicGroupsLoading: boolean;
  selectedGroup: string;
  onGroupChange: (name: string) => void;
  selectedLevels: string[];
  onLevelToggle: (level: string) => void;
  // Subcategory
  currentSubcategories: string[];
  selectedSubcategory: string;
  onSubcategoryChange: (subcategory: string) => void;
  // Topics
  topics: VocabTopic[];
  topicsLoading: boolean;
  // Pagination
  currentPage: number;
  totalPages: number;
  totalTopics: number;
  onPageChange: (page: number) => void;
  // Bookmarks
  bookmarkedTopics: string[];
  onBookmarkToggle: (topicId: string) => void;
}

export function AvailableTopicsTab({
  topicGroups,
  topicGroupsLoading,
  selectedGroup,
  onGroupChange,
  selectedLevels,
  onLevelToggle,
  currentSubcategories,
  selectedSubcategory,
  onSubcategoryChange,
  topics,
  topicsLoading,
  currentPage,
  totalPages,
  totalTopics,
  onPageChange,
  bookmarkedTopics,
  onBookmarkToggle,
}: AvailableTopicsTabProps) {
  return (
    <div className="grid lg:grid-cols-5 gap-8">
      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <TopicGroupsSidebar
          groups={topicGroups}
          selectedGroup={selectedGroup}
          onGroupChange={onGroupChange}
          showViewMore={false}
          isLoading={topicGroupsLoading}
        />
        <LevelsSidebar
          selectedLevels={selectedLevels}
          onLevelToggle={onLevelToggle}
        />
      </div>

      {/* Main content */}
      <div className="lg:col-span-4 space-y-6">
        <SubcategoryPills
          subcategories={currentSubcategories}
          selectedSubcategory={selectedSubcategory}
          onSubcategoryChange={onSubcategoryChange}
          isLoading={topicGroupsLoading}
        />

        {topicsLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TopicCardSkeleton key={i} />
            ))}
          </div>
        ) : topics.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  id={topic.id}
                  title={topic.title}
                  description={topic.description}
                  level={topic.level}
                  wordCount={topic.wordCount}
                  progress={topic.progress}
                  href={`/vocabulary-hub/${topic.id}`}
                  onNotYet={() => {}}
                  type="vocabulary"
                  isBookmarked={bookmarkedTopics.includes(topic.id)}
                  onBookmarkToggle={onBookmarkToggle}
                  thumbnail={topic.thumbnail ?? undefined}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              totalLabel={`${totalTopics} topics`}
              useEllipsis
            />
          </>
        ) : (
          <Card className="p-12 rounded-3xl border-[1.4px] border-primary-200 text-center">
            <Search className="h-16 w-16 text-primary-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              No Topics Found
            </h3>
            <p className="text-muted-foreground">
              No vocabulary topics match your current filters. Try selecting
              different levels or categories.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
