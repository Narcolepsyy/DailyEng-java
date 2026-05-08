import VocabPageClient from "@/components/page/VocabPageClient";

export default function VocabPage() {
  // userId is resolved client-side via useAuth() inside VocabPageClient
  // Server-side auth() can't read cross-origin httpOnly cookies
  return <VocabPageClient userId="" />;
}
