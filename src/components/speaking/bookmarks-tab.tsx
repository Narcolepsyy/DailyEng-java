import { Bookmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TopicCard } from "@/components/hub";
import type { Scenario } from "@/hooks/speaking/types";
import { Pagination } from "./pagination";
import { useTranslation } from "@/hooks/use-translation";

interface BookmarksTabProps {
  bookmarkedTopicsList: Scenario[];
  bookmarkLoading: boolean;
  bookmarkPage: number;
  bookmarkTotalPages: number;
  onPageChange: (page: number) => void;
  onBookmarkToggle: (topicId: string) => void;
  onBrowseTopics: () => void;
  onScenarioClick?: (id: string) => void;
}

export function BookmarksTab({
  bookmarkedTopicsList,
  bookmarkLoading,
  bookmarkPage,
  bookmarkTotalPages,
  onPageChange,
  onBookmarkToggle,
  onBrowseTopics,
  onScenarioClick,
}: BookmarksTabProps) {
  const { t } = useTranslation();

  if (bookmarkLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-12 rounded-3xl border-[1.4px] border-primary-200 text-center bg-white">
          <div className="animate-pulse space-y-4">
            <div className="h-16 w-16 bg-primary-100 rounded-full mx-auto" />
            <div className="h-6 w-48 bg-gray-200 rounded mx-auto" />
            <div className="h-4 w-64 bg-gray-100 rounded mx-auto" />
          </div>
        </Card>
      </div>
    );
  }

  if (bookmarkedTopicsList.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-12 rounded-3xl border-[1.4px] border-primary-200 text-center bg-white">
          <Bookmark className="h-16 w-16 text-primary-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            {t("speaking_hub.bookmarks.empty_title")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t("speaking_hub.bookmarks.empty_desc")}
          </p>
          <Button
            variant="default"
            onClick={onBrowseTopics}
            className="cursor-pointer"
          >
            {t("speaking_hub.bookmarks.browse_topics")}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bookmark className="h-6 w-6 text-primary-600 fill-primary-600" />
        <h2 className="text-xl font-bold text-foreground">
          {t("speaking_hub.bookmarks.your_bookmarks")} ({bookmarkedTopicsList.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {bookmarkedTopicsList.map((topic) => (
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
            isBookmarked={true}
            onBookmarkToggle={onBookmarkToggle}
            onClick={(id) => onScenarioClick?.(id)}
          />
        ))}
      </div>

      <Pagination
        currentPage={bookmarkPage}
        totalPages={bookmarkTotalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
