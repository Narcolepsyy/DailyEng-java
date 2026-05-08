"use client";

import dynamic from "next/dynamic";

// ─── Lazy-loaded skeleton components ───────────────
// Each skeleton matches the route's loading.tsx layout exactly.
// Dynamic imports keep the main bundle light.

const SpeakingSkeleton = dynamic(() => import("@/app/speaking-room/loading"), {
  loading: () => <SkeletonFallback />,
});
const VocabSkeleton = dynamic(() => import("@/app/vocabulary-hub/loading"), {
  loading: () => <SkeletonFallback />,
});
const GrammarSkeleton = dynamic(() => import("@/app/grammar-hub/loading"), {
  loading: () => <SkeletonFallback />,
});
const NotebookSkeleton = dynamic(() => import("@/app/notebook/loading"), {
  loading: () => <SkeletonFallback />,
});
const PlacementTestSkeleton = dynamic(
  () => import("@/app/placement-test/loading"),
  { loading: () => <SkeletonFallback /> }
);

// ─── Route → Skeleton mapping ──────────────────────

interface RouteSkeletonEntry {
  prefix: string;
  Component: React.ComponentType;
}

const ROUTE_SKELETONS: RouteSkeletonEntry[] = [
  { prefix: "/speaking-room", Component: SpeakingSkeleton },
  { prefix: "/vocabulary-hub", Component: VocabSkeleton },
  { prefix: "/grammar-hub", Component: GrammarSkeleton },
  { prefix: "/notebook", Component: NotebookSkeleton },
  { prefix: "/placement-test", Component: PlacementTestSkeleton },
];

// ─── Public API ────────────────────────────────────

interface SkeletonRouterProps {
  targetPath: string;
}

/**
 * Renders the skeleton component that matches `targetPath`.
 * Falls back to a minimal pulse animation for unknown routes.
 */
export function SkeletonRouter({ targetPath }: SkeletonRouterProps) {
  const entry = ROUTE_SKELETONS.find((r) => targetPath.startsWith(r.prefix));

  if (entry) {
    const { Component } = entry;
    return <Component />;
  }

  return <SkeletonFallback />;
}

// ─── Shared minimal fallback ───────────────────────

function SkeletonFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse space-y-4 w-full max-w-7xl px-4">
        <div className="h-8 w-48 rounded-lg bg-gray-200" />
        <div className="h-4 w-72 rounded bg-gray-100" />
        <div className="grid grid-cols-3 gap-6 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-gray-100 border border-gray-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
