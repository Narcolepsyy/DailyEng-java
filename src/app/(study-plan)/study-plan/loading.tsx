import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 bg-muted/50" />
          <Skeleton className="h-5 w-96 bg-muted/30" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full bg-muted/50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-40 bg-muted/50" />
              <Skeleton className="h-5 w-24 bg-muted/30" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center p-4 border border-border/50 rounded-xl space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg bg-muted/50" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2 bg-muted/50" />
                  <Skeleton className="h-4 w-1/4 bg-muted/30" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full bg-muted/40" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Stats & Goals */}
        <div className="space-y-6">
          <div className="p-6 border border-border/50 rounded-2xl space-y-4">
            <Skeleton className="h-6 w-32 bg-muted/50" />
            <div className="flex justify-between items-end">
              <Skeleton className="h-12 w-20 bg-muted/50" />
              <Skeleton className="h-4 w-16 bg-muted/30" />
            </div>
            <Skeleton className="h-2 w-full rounded-full bg-muted/50" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20 bg-muted/30" />
              <Skeleton className="h-4 w-20 bg-muted/30" />
            </div>
          </div>

          <div className="p-6 border border-border/50 rounded-2xl space-y-4">
            <Skeleton className="h-6 w-32 bg-muted/50" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24 bg-muted/30" />
                  <Skeleton className="h-4 w-16 bg-muted/30" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
