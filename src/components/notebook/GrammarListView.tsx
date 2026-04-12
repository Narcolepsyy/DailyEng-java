"use client"

import { FileText, Volume2, Trash2, Search, Filter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { GrammarItem } from "@/hooks/notebook/types"
import { speakText } from "@/hooks/notebook/types"

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

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    Tenses: "border-l-primary-500 bg-primary-50/30",
    Conditionals: "border-l-amber-500 bg-amber-50/30",
    Voice: "border-l-teal-500 bg-teal-50/30",
    Clauses: "border-l-violet-500 bg-violet-50/30",
    Speech: "border-l-rose-500 bg-rose-50/30",
  }
  return map[category] || "border-l-gray-400 bg-gray-50/30"
}

// ─── Component ─────────────────────────────────────

interface GrammarListViewProps {
  filteredGrammarItems: GrammarItem[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  levelFilter: string[]
  setLevelFilter: (filter: string[]) => void
  onDelete: (id: string) => void
  onAddGrammar: () => void
}

export function GrammarListView({
  filteredGrammarItems, searchQuery, setSearchQuery,
  levelFilter, setLevelFilter, onDelete, onAddGrammar,
}: GrammarListViewProps) {
  return (
    <div className="notebook-card p-5 lg:p-6">
      {/* Search + Filter Bar */}
      <div className="flex items-center gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search grammar rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 h-9 text-sm rounded-full border-primary-200 hover:border-primary-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Filter by level" title="Filter by level" className="h-9 w-9 rounded-full hover:bg-primary-50 cursor-pointer relative">
              <Filter className="h-4 w-4 text-gray-500" />
              {levelFilter.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary-500 border-2 border-white" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-primary-100">
            <DropdownMenuLabel className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Level</DropdownMenuLabel>
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
              <DropdownMenuCheckboxItem key={level} checked={levelFilter.includes(level)}
                onCheckedChange={(c) => setLevelFilter(c ? [...levelFilter, level] : levelFilter.filter(l => l !== level))}>{level}</DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Grammar Cards */}
      <div className="space-y-3 notebook-enter-stagger">
        {filteredGrammarItems.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-xl border-l-4 border border-primary-100/60 hover:border-primary-200/80 transition-all duration-200 group hover:shadow-sm ${getCategoryColor(item.category)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge className="bg-primary-100 text-primary-700 text-[10px] font-bold border-0">{item.category}</Badge>
                  <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-md border-0 ${getLevelBadgeClass(item.level)}`}>{item.level}</Badge>
                </div>
                <h3 className="notebook-heading text-lg font-bold text-gray-900">{item.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Mastery Bar */}
                <div className="w-16">
                  <div className="flex items-center justify-end mb-1">
                    <span className="text-[10px] font-semibold text-gray-400">{item.masteryLevel}%</span>
                  </div>
                  <div className="mastery-bar">
                    <div
                      className="mastery-bar-fill"
                      data-level={getMasteryLevel(item.masteryLevel)}
                      style={{ width: `${item.masteryLevel}%` }}
                    />
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="Delete grammar rule" title="Delete grammar rule"
                  className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all cursor-pointer"
                  onClick={() => onDelete(item.id)}>
                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </Button>
              </div>
            </div>

            {/* Rule Formula */}
            <div className="bg-white/80 rounded-lg p-3 mb-3 border border-primary-100/40">
              <p className="text-sm font-mono font-semibold text-primary-700">{item.rule}</p>
            </div>

            <p className="text-sm text-gray-500 mb-3 leading-relaxed">{item.explanation}</p>

            {/* Examples */}
            {item.examples.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Examples</h4>
                {item.examples.map((ex, idx) => (
                  <div key={idx} className="bg-white/60 rounded-lg p-2.5 space-y-0.5 border border-gray-100/60">
                    <p className="text-sm text-gray-800 flex items-center gap-2">
                      <span className="text-primary-400">→</span> {ex.en}
                      <Button variant="ghost" size="icon" aria-label="Listen to pronunciation" title="Listen to pronunciation" className="h-6 w-6 cursor-pointer" onClick={() => speakText(ex.en)}>
                        <Volume2 className="h-3 w-3 text-gray-400" />
                      </Button>
                    </p>
                    <p className="text-sm text-gray-400 pl-5">{ex.vi}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredGrammarItems.length === 0 && (
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-primary-300" />
          </div>
          <p className="text-gray-400 font-medium">No grammar rules found. Add some rules to get started!</p>
        </div>
      )}

      {/* Add Rule Button */}
      <div className="mt-5 pt-5 border-t border-primary-100/40">
        <Button onClick={onAddGrammar} variant="outline"
          className="w-full gap-2 h-11 rounded-xl border-2 border-dashed border-primary-200 hover:border-primary-400 hover:bg-primary-50 bg-transparent cursor-pointer transition-all duration-200 text-primary-500 hover:text-primary-600 font-semibold">
          <Plus className="h-4 w-4" /> Add Rule
        </Button>
      </div>
    </div>
  )
}
