"use client"

import { BookOpen, Volume2, Star, Edit, Trash2, Search, Filter, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { NotebookItem } from "@/hooks/notebook/types"
import { MASTERY_LEVELS, speakText } from "@/hooks/notebook/types"

// ─── Helpers ───────────────────────────────────────

function getMasteryLevel(mastery: number): string {
  if (mastery >= 80) return "mastered"
  if (mastery >= 50) return "high"
  if (mastery >= 25) return "mid"
  return "low"
}

function getLevelBadgeClass(level: string): string {
  const l = level.toLowerCase()
  if (l === "a1" || l === "a2") return "level-badge-a1"
  if (l === "b1" || l === "b2") return "level-badge-b1"
  if (l === "c1" || l === "c2") return "level-badge-c1"
  return "bg-gray-100 text-gray-600"
}

// ─── Component ─────────────────────────────────────

interface VocabularyListViewProps {
  filteredVocabItems: NotebookItem[]
  selectedItems: Set<string>
  setSelectedItems: (items: Set<string>) => void
  starredItems: Set<string>
  setStarredItems: React.Dispatch<React.SetStateAction<Set<string>>>
  searchQuery: string
  setSearchQuery: (query: string) => void
  masteryFilter: string[]
  setMasteryFilter: (filter: string[]) => void
  starredFilter: boolean | null
  setStarredFilter: (filter: boolean | null) => void
  levelFilter: string[]
  setLevelFilter: (filter: string[]) => void
  onEdit: (item: NotebookItem) => void
  onDelete: (id: string) => void
  onAddItem: () => void
}

export function VocabularyListView({
  filteredVocabItems, selectedItems, setSelectedItems,
  starredItems, setStarredItems,
  searchQuery, setSearchQuery,
  masteryFilter, setMasteryFilter,
  starredFilter, setStarredFilter,
  levelFilter, setLevelFilter,
  onEdit, onDelete, onAddItem,
}: VocabularyListViewProps) {
  const hasActiveFilters = masteryFilter.length > 0 || starredFilter !== null || levelFilter.length > 0

  return (
    <div className="notebook-card p-5 lg:p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <Checkbox
            id="select-all"
            checked={selectedItems.size === filteredVocabItems.length && filteredVocabItems.length > 0}
            onCheckedChange={(checked) => setSelectedItems(checked ? new Set(filteredVocabItems.map(i => i.id)) : new Set())}
            className="h-5 w-5 border-2 cursor-pointer"
          />
          <label htmlFor="select-all" className="text-sm font-semibold text-gray-600 cursor-pointer">Select All</label>
          {selectedItems.size > 0 && (
            <Badge className="bg-primary-100 text-primary-700 border border-primary-200 text-xs font-bold">{selectedItems.size}</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 h-9 w-52 text-sm rounded-full border-primary-200 hover:border-primary-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Filter words" className="h-9 w-9 relative rounded-full hover:bg-primary-50 cursor-pointer">
                <Filter className="h-4 w-4 text-gray-500" />
                {hasActiveFilters && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary-500 border-2 border-white" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-primary-100">
              <DropdownMenuLabel className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Progress</DropdownMenuLabel>
              {MASTERY_LEVELS.map((level) => (
                <DropdownMenuCheckboxItem key={level.value} checked={masteryFilter.includes(level.value)}
                  onCheckedChange={(c) => setMasteryFilter(c ? [...masteryFilter, level.value] : masteryFilter.filter(m => m !== level.value))}>
                  <div className={`h-3 w-3 rounded-full ${level.color} mr-2`} />{level.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Level</DropdownMenuLabel>
              {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                <DropdownMenuCheckboxItem key={level} checked={levelFilter.includes(level)}
                  onCheckedChange={(c) => setLevelFilter(c ? [...levelFilter, level] : levelFilter.filter(l => l !== level))}>{level}</DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={starredFilter === true} onCheckedChange={(c) => setStarredFilter(c ? true : null)}>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-2" /> Starred
              </DropdownMenuCheckboxItem>
              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <Button variant="ghost" size="sm" onClick={() => { setMasteryFilter([]); setStarredFilter(null); setLevelFilter([]) }}
                    className="w-full text-gray-500 cursor-pointer">
                    <X className="h-4 w-4 mr-2" /> Clear All
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Vocabulary Cards */}
      <div className="space-y-2 notebook-enter-stagger">
        {filteredVocabItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 rounded-xl border border-primary-100/60 hover:border-primary-200 transition-all duration-200 group hover:shadow-sm"
          >
            <Checkbox
              checked={selectedItems.has(item.id)}
              onCheckedChange={(c) => { const s = new Set(selectedItems); c ? s.add(item.id) : s.delete(item.id); setSelectedItems(s) }}
              className="cursor-pointer flex-shrink-0"
            />

            {/* Word & Pronunciation */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="notebook-heading text-base font-bold text-gray-900 truncate">{item.word}</h3>
                {item.pronunciation && item.pronunciation !== "/.../" && item.pronunciation !== "" && (
                  <span className="text-xs text-gray-400 font-mono">{item.pronunciation}</span>
                )}
                <Button variant="ghost" size="icon" aria-label="Listen to pronunciation" className="h-6 w-6 text-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                  onClick={() => speakText(item.word)}>
                  <Volume2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-sm text-gray-500 truncate">{item.vietnamese.slice(0, 2).join(", ")}</p>
            </div>

            {/* Level Badge */}
            <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-md border-0 ${getLevelBadgeClass(item.level)}`}>
              {item.level}
            </Badge>

            {/* Mastery Bar */}
            <div className="w-20 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-gray-500">{item.masteryLevel}%</span>
              </div>
              <div className="mastery-bar">
                <div
                  className="mastery-bar-fill"
                  data-level={getMasteryLevel(item.masteryLevel)}
                  style={{ width: `${item.masteryLevel}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Button variant="ghost" size="icon" aria-label={starredItems.has(item.id) ? "Unstar word" : "Star word"} className="h-8 w-8 rounded-full hover:bg-yellow-50 cursor-pointer"
                onClick={() => setStarredItems(p => { const s = new Set(p); s.has(item.id) ? s.delete(item.id) : s.add(item.id); return s })}>
                <Star className={`h-4 w-4 transition-colors ${starredItems.has(item.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Edit word" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => onEdit(item)}>
                <Edit className="h-3.5 w-3.5 text-gray-400" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Delete word" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all cursor-pointer"
                onClick={() => onDelete(item.id)}>
                <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredVocabItems.length === 0 && (
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-primary-300" />
          </div>
          <p className="text-gray-400 font-medium">No words found. Add some words to get started!</p>
        </div>
      )}

      {/* Add Word Button */}
      <div className="mt-5 pt-5 border-t border-primary-100/40">
        <Button onClick={onAddItem} variant="outline"
          className="w-full gap-2 h-11 rounded-xl border-2 border-dashed border-primary-200 hover:border-primary-400 hover:bg-primary-50 bg-transparent cursor-pointer transition-all duration-200 text-primary-500 hover:text-primary-600 font-semibold">
          <Plus className="h-4 w-4" /> Add Word
        </Button>
      </div>
    </div>
  )
}
