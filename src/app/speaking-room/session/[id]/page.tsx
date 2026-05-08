export const dynamic = "force-dynamic";

import SpeakingSessionClient from "@/components/page/SpeakingSessionClient";
import type {
  InitialTurn,
  LearningRecord,
} from "@/components/page/SpeakingSessionClient";
import { getScenarioById } from "@/actions/speaking";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SpeakingSessionPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch real scenario from database (public data, no auth needed)
  const scenario = await getScenarioById(id);
  const initialTurns: InitialTurn[] = [];

  // Learning records will be fetched client-side using userId from useAuth()
  // Server-side auth() can't read cross-origin httpOnly cookies

  return (
    <SpeakingSessionClient
      scenario={scenario}
      initialTurns={initialTurns}
      learningRecords={[]}
      scenarioId={scenario ? scenario.id : id}
    />
  );
}
