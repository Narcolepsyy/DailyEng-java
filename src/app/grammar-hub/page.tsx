export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ProtectedRoute, PageIcons } from "@/components/auth/protected-route";
import { HubHero } from "@/components/hub";
import { GrammarContent, GrammarContentSkeleton } from "./grammar-content";

export default function GrammarPage() {
  // userId is resolved client-side via useAuth() inside GrammarContent
  // Server-side auth() can't read cross-origin httpOnly cookies
  return (
    <ProtectedRoute
      pageName="Grammar Hub"
      pageDescription="Master English grammar with structured lessons and practice exercises."
      pageIcon={PageIcons.grammar}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Static Hero - renders immediately */}
        <HubHero
          title="GRAMMAR HUB"
          description="Master English grammar with structured lessons."
          imageSrc="/hero-grammar.jpg"
          primaryAction={{ label: "Choose Learning Topic", href: "#topics" }}
          notification={{
            text: "Overview: 4 Topic Groups • 16 Essential Grammar Topics",
          }}
          decorativeWords={["grammar", "structure", "syntax"]}
        />

        {/* Dynamic Content - streamed with Suspense */}
        <Suspense fallback={<GrammarContentSkeleton />}>
          <GrammarContent userId={undefined} />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
