"use client"

import { Clock, Target, TrendingUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { CollectionWithIcon, CollectionType } from "@/hooks/notebook/types"

interface NotebookSidebarProps {
  collections: CollectionWithIcon[]
  filteredCollections: CollectionWithIcon[]
  selectedCollection: string
  collectionTypeFilter: CollectionType
  dueCount: number
  stats: { total: number; avgMastery: number }
  isLoading?: boolean
  onCollectionTypeChange: (type: CollectionType) => void
  onSelectCollection: (id: string) => void
  onNewNotebook: () => void
  onDeleteNotebook: (id: string) => void
}

export function NotebookSidebar({
  collections, filteredCollections, selectedCollection,
  collectionTypeFilter, dueCount, stats, isLoading = false,
  onCollectionTypeChange, onSelectCollection, onNewNotebook, onDeleteNotebook,
}: NotebookSidebarProps) {
  return (
    <aside className="w-72 flex-shrink-0 hidden lg:block">
      <div className="notebook-sidebar p-5 sticky top-20">
        {/* Header with gradient accent */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-primary-500 to-primary-400" />
            <h2 className="notebook-heading text-lg font-bold text-gray-900">Notebooks</h2>
          </div>
          <Badge className="bg-primary-50 text-primary-600 border border-primary-200 text-xs font-semibold px-2 py-0.5">
            {collections.length}
          </Badge>
        </div>

        {/* Type Filter Pills */}
        <div className="flex gap-1 mb-5 p-1 bg-primary-50/60 rounded-full border border-primary-100">
          {(["vocabulary", "grammar"] as const).map(type => (
            <button key={type} onClick={() => onCollectionTypeChange(type)}
              className={`flex-1 px-3 py-2 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer ${
                collectionTypeFilter === type
                  ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25"
                  : "text-gray-500 hover:text-primary-600 hover:bg-white/60"
              }`}>
              {type === "vocabulary" ? "Vocabulary" : "Grammar"}
            </button>
          ))}
        </div>

        {/* Collection List */}
        <div className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-none notebook-enter-stagger">
          {isLoading ? (
            // Skeleton loading state — prevents empty-notebook confusion on cold start
            <div className="space-y-2 py-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-1 py-1 animate-pulse">
                  <div className="h-9 w-9 rounded-xl bg-primary-100/60 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-primary-100/80 rounded-full w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCollections.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4 px-2">
              No notebooks yet. Create one below!
            </p>
          ) : (
            filteredCollections.map((collection) => (
              <div
                key={collection.id}
                className={`collection-item flex w-full items-center gap-3 group ${
                  selectedCollection === collection.id ? "collection-item-active" : ""
                }`}
              >
                <button
                  onClick={() => onSelectCollection(collection.id)}
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    selectedCollection === collection.id
                      ? "bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25"
                      : "bg-primary-50 text-primary-500"
                  }`}>
                    {collection.icon}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`font-semibold text-sm truncate ${
                      selectedCollection === collection.id ? "text-primary-700" : "text-gray-800"
                    }`}>{collection.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{collection.count} items</span>
                      <span className="text-xs text-emerald-500 font-medium">{collection.mastered} mastered</span>
                    </div>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete notebook"
                  className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all duration-200 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); onDeleteNotebook(collection.id) }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500 transition-colors" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* New Notebook Button */}
        <div className="mt-5 pt-5 border-t border-primary-100/60">
          <Button variant="outline" onClick={onNewNotebook}
            className="w-full gap-2 justify-center h-11 rounded-xl border-2 border-dashed border-primary-200 hover:border-primary-400 hover:bg-primary-50 bg-transparent cursor-pointer transition-all duration-200 text-primary-500 hover:text-primary-600 font-semibold">
            <Plus className="h-4 w-4" /> New Notebook
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="mt-5 pt-5 border-t border-primary-100/60">
          <h3 className="notebook-heading text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Stats</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2.5 rounded-xl bg-primary-50/60 border border-primary-100/60">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-3.5 w-3.5 text-primary-400" />
              </div>
              <p className="text-lg font-bold text-primary-600 leading-none">{dueCount}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Due</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
              <div className="flex items-center justify-center mb-1">
                <Target className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-emerald-600 leading-none">{stats.avgMastery}%</p>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Mastery</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <p className="text-lg font-bold text-gray-700 leading-none">{stats.total}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Total</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
