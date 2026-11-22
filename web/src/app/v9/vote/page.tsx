import { getVoteCandidates } from "@/sanity/lib/fetchers";
import V9VotePageClient from "@/components/v9/V9VotePageClient";

export const revalidate = 60;

export default async function V9VotePage() {
  const candidates = await getVoteCandidates();
  return <V9VotePageClient initialCandidates={candidates} />;
}
