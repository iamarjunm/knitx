import type { Metadata } from "next";
import { getVoteCandidates } from "@/sanity/lib/fetchers";
import V11VoteClient from "@/components/v11/V11VoteClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Community Ballot — Next Edition Curation · KNITX",
  description:
    "Review shortlisted silhouettes and cast your ballot to decide which garment concepts enter sample cutting for the next KNITX edition.",
};

export default async function V11VotePage() {
  const candidates = await getVoteCandidates();

  return <V11VoteClient initialCandidates={candidates} />;
}
