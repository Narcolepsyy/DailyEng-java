"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { VocabFlashcardStack } from "@/components/learning/VocabFlashcardStack";
import { ChevronLeft } from "lucide-react";
import { getDueItems, DueItem } from "@/actions/srs";

interface DailyReviewPageClientProps {
  userId: string;
}

export default function DailyReviewPageClient({ userId }: DailyReviewPageClientProps) {
  const router = useRouter();
  const [dueItems, setDueItems] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    getDueItems(50).then(items => {
      setDueItems(items);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load due items", err);
      setLoading(false);
    });
  }, []);

  const handleComplete = () => {
    setIsComplete(true);
  };

  const handleReviewAgain = () => {
    setCurrentIndex(0);
    setIsComplete(false);
  };

  const vocabWords = dueItems.map(item => ({
    id: item.vocabItemId,
    word: item.word,
    partOfSpeech: item.partOfSpeech,
    pronunciation: item.pronunciation,
    meaning: item.meaning,
    exampleSentence: item.exampleSentence,
  }));

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-4 h-[calc(100vh-80px)] flex flex-col">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="gap-2 -ml-2 text-slate-500 hover:text-slate-900"
            onClick={() => router.push('/vocabulary-hub')}
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Vocabulary Hub
          </Button>

          <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
            Daily Review
          </h1>
        </div>

        {/* Main Learning Content */}
        <div className="flex-1 min-h-0 bg-white rounded-xl border-2 border-border shadow-sm p-4 sm:p-6 lg:p-8 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
                <p className="mt-4 text-slate-500 font-medium">Finding words you need to review...</p>
              </div>
            </div>
          ) : isComplete ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="h-28 w-28 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-5xl mb-2">
                🏆
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">
                  Great job! You have reviewed all the due vocabulary for today.
                </h2>
                <p className="text-slate-500 max-w-lg mx-auto text-lg">
                  Please come back tomorrow.
                </p>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/vocabulary-hub')} 
                  className="px-8 py-6 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back to Hub
                </Button>
                <Button 
                  onClick={handleReviewAgain} 
                  className="px-8 py-6 rounded-xl font-medium"
                >
                  Review Again
                </Button>
              </div>
            </div>
          ) : dueItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-24 w-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-4xl mb-4">
                🎉
              </div>
              <h2 className="text-2xl font-bold text-slate-800">You're all caught up!</h2>
              <p className="text-slate-500 max-w-md">
                You have no words due for review right now. Take a break, or learn some new topics!
              </p>
              <Button onClick={() => router.push('/vocabulary-hub')} className="mt-4">
                Explore New Topics
              </Button>
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Reviewing {currentIndex + 1} of {dueItems.length}
                </span>
                <div className="h-2 flex-1 mx-4 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 rounded-full transition-all duration-300" 
                    style={{ width: `${((currentIndex) / dueItems.length) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <VocabFlashcardStack
                  words={vocabWords}
                  currentIndex={currentIndex}
                  onIndexChange={setCurrentIndex}
                  onComplete={handleComplete}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
