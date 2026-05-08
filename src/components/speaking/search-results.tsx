import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TopicCard } from "@/components/hub";
import { TopicCardGridSkeleton } from "./topic-card-grid-skeleton";

// ─── Types ─────────────────────────────────────────

interface SearchResultsProps {
  query: string;
  results: {
    id: string;
    title: string;
    description: string;
    level: string;
    image: string;
    progress: number;
    subcategory?: string;
  }[];
  isLoading: boolean;
  bookmarkedTopics: string[];
  onBookmarkToggle: (topicId: string) => void;
  onClearSearch: () => void;
  onScenarioClick?: (id: string) => void;
}

// ─── Component ─────────────────────────────────────

export function SearchResults({
  query,
  results,
  isLoading,
  bookmarkedTopics,
  onBookmarkToggle,
  onClearSearch,
  onScenarioClick,
}: SearchResultsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Search Results for &quot;{query}&quot; ({results.length} found)
        </h2>
      </div>
      {isLoading ? (
        <TopicCardGridSkeleton count={8} />
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((topic) => (
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
      ) : (
        <Card className="p-12 rounded-3xl border-2 border-primary-100 text-center bg-white">
          <Search className="h-16 w-16 text-primary-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            No Topics Found
          </h3>
          <p className="text-muted-foreground mb-6">
            Try searching with different keywords or check your spelling.
          </p>
          <Button
            variant="default"
            onClick={onClearSearch}
            className="cursor-pointer"
          >
            Clear Search
          </Button>
        </Card>
      )}
    </div>
  );
}
