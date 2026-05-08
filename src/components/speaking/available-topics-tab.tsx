import { TopicCard, TopicGroupsSidebar, LevelsSidebar, SubcategoryPills } from "@/components/hub";
import type { TopicGroup } from "@/components/hub";
import type { Scenario } from "@/hooks/speaking/types";
import { TopicCardGridSkeleton } from "./topic-card-grid-skeleton";
import { Pagination } from "./pagination";

interface AvailableTopicsTabProps {
  topicGroups: TopicGroup[];
  topicGroupsLoading: boolean;
  selectedGroup: string;
  onGroupChange: (name: string) => void;
  selectedLevels: string[];
  onLevelToggle: (level: string) => void;
  currentSubcategories: string[];
  selectedSubcategory: string;
  onSubcategoryChange: (sub: string) => void;
  scenarios: Scenario[];
  scenariosLoading: boolean;
  scenarioPage: number;
  scenarioTotalPages: number;
  onPageChange: (page: number) => void;
  bookmarkedTopics: string[];
  onBookmarkToggle: (topicId: string) => void;
  onScenarioClick?: (id: string) => void;
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
  scenarios,
  scenariosLoading,
  scenarioPage,
  scenarioTotalPages,
  onPageChange,
  bookmarkedTopics,
  onBookmarkToggle,
  onScenarioClick,
}: AvailableTopicsTabProps) {
  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <TopicGroupsSidebar
          groups={topicGroups}
          selectedGroup={selectedGroup}
          onGroupChange={onGroupChange}
          title="Topic Groups"
          showViewMore={false}
          isLoading={topicGroupsLoading}
        />
        <LevelsSidebar
          selectedLevels={selectedLevels}
          onLevelToggle={onLevelToggle}
        />
      </div>

      <div className="lg:col-span-4 space-y-6">
        <SubcategoryPills
          subcategories={currentSubcategories}
          selectedSubcategory={selectedSubcategory}
          onSubcategoryChange={onSubcategoryChange}
          isLoading={topicGroupsLoading}
        />

        {scenariosLoading ? (
          <TopicCardGridSkeleton
            count={12}
            gridClassName="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {scenarios.map((topic) => (
                <TopicCard
                  key={topic.id}
                  id={topic.id}
                  title={topic.title}
                  description={topic.description}
                  level={topic.level}
                  wordCount={7}
                  thumbnail={topic.image}
                  progress={topic.progress}
                  href={`/speaking-room/session/${topic.id}`}
                  onNotYet={() => {}}
                  type="speaking"
                  subcategory={topic.subcategory}
                  isBookmarked={bookmarkedTopics.includes(topic.id)}
                  onBookmarkToggle={onBookmarkToggle}
                  onClick={(id) => onScenarioClick?.(id)}
                />
              ))}
            </div>

            <Pagination
              currentPage={scenarioPage}
              totalPages={scenarioTotalPages}
              onPageChange={onPageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
