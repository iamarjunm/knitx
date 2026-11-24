import type { Metadata } from "next";
import { getVoteCandidates } from "@/sanity/lib/fetchers";
import FlagshipVoteClient from "@/components/flagship/FlagshipVoteClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Vote Next Drop · Community Ballot · KNITX",
  description:
    "Cast your ballot on shortlisted garment concepts to decide which silhouettes enter physical sample cutting for the next KNITX edition.",
};

export default async function VotePage() {
  const candidates = await getVoteCandidates();

  return <FlagshipVoteClient initialCandidates={candidates} />;
}
