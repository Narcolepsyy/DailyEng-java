export const dynamic = "force-dynamic";

import VocabTopicPageClient from "@/components/page/VocabTopicPageClient";
import { getVocabTopicById } from "@/actions/vocab";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ topicId: string }>;
}

export default async function TopicDetailPage({ params }: PageProps) {
  const { topicId } = await params;

  // Fetch topic data without userId (cross-origin cookies not available server-side)
  // User-specific progress will be loaded client-side
  const data = await getVocabTopicById(topicId, undefined);

  if (!data) {
    notFound();
  }

  const { vocab, ...topic } = data;

  return (
    <VocabTopicPageClient
      topicId={topicId}
      topic={topic}
      vocab={vocab}
    />
  );
}
