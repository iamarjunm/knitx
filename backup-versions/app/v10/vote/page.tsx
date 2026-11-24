import type { Metadata } from "next";
import { getVoteCandidates } from "@/sanity/lib/fetchers";
import V10VoteClient from "@/components/v10/V10VoteClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Next Release Ballot — Community Curation · KNITX",
  description:
    "Review shortlisted silhouettes and cast your ballot to decide which concepts enter sample cutting for the next KNITX release.",
};

export default async function V10VotePage() {
  const candidates = await getVoteCandidates();

  return <V10VoteClient initialCandidates={candidates} />;
}
