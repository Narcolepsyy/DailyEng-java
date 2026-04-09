import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "./pagination";
import { ALPHABET, CEFR_LEVELS, type DictionaryWord } from "@/hooks/vocab/types";

interface DictionaryTabProps {
  dictionarySearch: string;
  onSearchChange: (query: string) => void;
  selectedAlphabet: string | null;
  onAlphabetChange: (letter: string | null) => void;
  selectedDictLevels: string[];
  onToggleDictLevel: (level: string) => void;
  onClearDictLevels: () => void;
  filteredWordCount: number;
  paginatedWords: DictionaryWord[];
  dictPage: number;
  dictTotalPages: number;
  onPageChange: (page: number) => void;
}

export function DictionaryTab({
  dictionarySearch,
  onSearchChange,
  selectedAlphabet,
  onAlphabetChange,
  selectedDictLevels,
  onToggleDictLevel,
  onClearDictLevels,
  filteredWordCount,
  paginatedWords,
  dictPage,
  dictTotalPages,
  onPageChange,
}: DictionaryTabProps) {
  return (
    <Card className="p-8 rounded-3xl border-2 border-primary-100 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Dictionary</h3>
        <Input
          placeholder="Search words..."
          className="w-64"
          value={dictionarySearch}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Alphabet filter */}
      <div className="flex flex-wrap gap-1">
        <Button
          variant={selectedAlphabet === null ? "default" : "outline"}
          size="sm"
          className="h-8 w-10 text-xs font-semibold cursor-pointer"
          onClick={() => onAlphabetChange(null)}
        >
          All
        </Button>
        {ALPHABET.map((letter) => (
          <Button
            key={letter}
            variant={selectedAlphabet === letter ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 text-xs font-semibold cursor-pointer"
            onClick={() => onAlphabetChange(letter)}
          >
            {letter}
          </Button>
        ))}
      </div>

      {/* Level filter */}
      <div className="mb-6 mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Level:
          </span>
          {CEFR_LEVELS.map((level) => (
            <Button
              key={level}
              variant={
                selectedDictLevels.includes(level) ? "default" : "outline"
              }
              size="sm"
              className="h-8 px-3 text-xs font-semibold cursor-pointer"
              onClick={() => onToggleDictLevel(level)}
            >
              {level}
            </Button>
          ))}
          {selectedDictLevels.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground cursor-pointer"
              onClick={onClearDictLevels}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {paginatedWords.length} of {filteredWordCount} words
        {selectedAlphabet ? ` starting with "${selectedAlphabet}"` : ""}
        {selectedDictLevels.length > 0
          ? ` at level ${selectedDictLevels.join(", ")}`
          : ""}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-bold">Word</TableHead>
              <TableHead className="font-bold">Pronunciation</TableHead>
              <TableHead className="font-bold">Meaning</TableHead>
              <TableHead className="font-bold">Type</TableHead>
              <TableHead className="font-bold">Level</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedWords.length > 0 ? (
              paginatedWords.map((word) => (
                <TableRow
                  key={word.id}
                  className="hover:bg-primary-50/50 transition-colors"
                >
                  <TableCell className="font-semibold text-primary-600">
                    {word.word}
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-sm">
                    {word.pronunciation}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {word.meaning}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {word.partOfSpeech}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-primary-100 text-primary-700 text-xs">
                      {word.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit word"
                      title="Edit word"
                      className="h-8 w-8 cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No words found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={dictPage}
        totalPages={dictTotalPages}
        onPageChange={onPageChange}
      />
    </Card>
  );
}
