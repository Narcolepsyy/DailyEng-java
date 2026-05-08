import SpeakingPageClient from "@/components/page/SpeakingPageClient";

export default function SpeakingPage() {
  // userId is resolved client-side via useAuth() inside SpeakingPageClient
  // Server-side auth() can't read cross-origin httpOnly cookies
  return <SpeakingPageClient userId="" />;
}

