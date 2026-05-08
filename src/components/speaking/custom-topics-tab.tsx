import { useState } from "react";
import { Gift, MessageSquarePlus, MessageCircle, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TopicCard } from "@/components/hub";
import type { Scenario } from "@/hooks/speaking/types";
import { TopicCardGridSkeleton } from "./topic-card-grid-skeleton";
import { useTranslation } from "@/hooks/use-translation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CustomTopicsTabProps {
  onFreeTalk: () => void;
  onOpenDialog: () => void;
  onSurpriseMe: () => void;
  customScenarios: Scenario[];
  customScenariosLoading: boolean;
  bookmarkedTopics: string[];
  onBookmarkToggle: (topicId: string) => void;
  onScenarioClick?: (id: string) => void;
  onDeleteScenario?: (id: string) => void;
}

export function CustomTopicsTab({
  onFreeTalk,
  onOpenDialog,
  onSurpriseMe,
  customScenarios,
  customScenariosLoading,
  bookmarkedTopics,
  onBookmarkToggle,
  onScenarioClick,
  onDeleteScenario,
}: CustomTopicsTabProps) {
  const { t } = useTranslation();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      onDeleteScenario?.(pendingDeleteId);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 rounded-3xl border-2 border-primary-100 bg-white">
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-1">{t("speaking_hub.custom.create_title")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("speaking_hub.custom.create_desc")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <ActionCard
            onClick={onFreeTalk}
            icon={<MessageCircle className="h-6 w-6 text-emerald-600" />}
            title={t("speaking_hub.custom.free_talk")}
            description={t("speaking_hub.custom.free_talk_desc")}
            colorScheme="emerald"
          />
          <ActionCard
            onClick={onOpenDialog}
            icon={<MessageSquarePlus className="h-6 w-6 text-primary-600" />}
            title={t("speaking_hub.custom.create_scenario")}
            description={t("speaking_hub.custom.create_scenario_desc")}
            colorScheme="primary"
          />
          <ActionCard
            onClick={onSurpriseMe}
            icon={<Gift className="h-6 w-6 text-primary-600" />}
            title={t("speaking_hub.custom.surprise_me")}
            description={t("speaking_hub.custom.surprise_me_desc")}
            colorScheme="primary"
          />
        </div>
      </Card>

      <h3 className="text-xl font-bold mt-8 mb-4">{t("speaking_hub.custom.your_scenarios")}</h3>

      {customScenariosLoading ? (
        <TopicCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4">
          {customScenarios.map((topic) => (
            <div key={topic.id} className="relative group/card">
              <TopicCard
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
              {/* Delete button — visible on hover */}
              {onDeleteScenario && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPendingDeleteId(topic.id);
                  }}
                  title="Delete scenario"
                  className="absolute top-3 left-3 z-20 p-2 rounded-full bg-white/90 text-red-500 shadow-md border border-red-100 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {customScenarios.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">
              {t("speaking_hub.custom.no_scenarios")}
            </p>
          )}
        </div>
      )}

      {/* Confirm delete dialog */}
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete custom scenario?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the scenario and all associated sessions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Internal sub-component ─────────────────────────

interface ActionCardProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  colorScheme: "emerald" | "primary";
}

function ActionCard({
  onClick,
  icon,
  title,
  description,
  colorScheme,
}: ActionCardProps) {
  const borderColor =
    colorScheme === "emerald"
      ? "border-emerald-200 hover:border-emerald-400"
      : "border-primary-200 hover:border-primary-400";
  const bgColor =
    colorScheme === "emerald" ? "bg-emerald-50/50" : "bg-primary-50/50";
  const iconBg =
    colorScheme === "emerald"
      ? "bg-emerald-100 group-hover:bg-emerald-200"
      : "bg-primary-100 group-hover:bg-primary-200";

  return (
    <Card
      onClick={onClick}
      className={`p-6 rounded-2xl border-2 border-dashed ${borderColor} ${bgColor} transition-colors cursor-pointer group`}
    >
      <div className="text-center">
        <div
          className={`w-12 h-12 mx-auto mb-4 rounded-xl ${iconBg} flex items-center justify-center transition-colors`}
        >
          {icon}
        </div>
        <h4 className="font-bold mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
