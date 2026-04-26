import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { VOCAB_TABS, type TabType } from "@/hooks/vocab/types";

interface VocabTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearchMode: boolean;
}

export function VocabTabBar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  isSearchMode,
}: VocabTabBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 border-b border-gray-200 pb-0">
      {!isSearchMode ? (
        <div className="flex gap-8 overflow-x-auto pb-px">
          {VOCAB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as TabType)}
              className={`pb-3 px-2 text-lg font-bold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex-1" />

      <div className="relative mb-4 sm:mb-0 flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-primary-400" />
        <Input
          placeholder="Search all topics..."
          className={`pl-10 pr-10 h-9 text-sm rounded-full border-2 transition-all ${
            isSearchMode
              ? "w-80 border-primary-400 shadow-lg bg-white"
              : "w-64 border-primary-200 hover:border-primary-300"
          }`}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {isSearchMode ? (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-primary-100 transition-colors cursor-pointer"
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="h-4 w-4 text-primary-500" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
