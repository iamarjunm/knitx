import type { Metadata } from "next";
import { getVoteCandidates } from "@/sanity/lib/fetchers";
import V12VoteClient from "@/components/v12/V12VoteClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Vote Next Release · Community Ballot · KNITX",
  description:
    "Cast your ballot on shortlisted garment concepts to decide which silhouettes enter physical sample cutting for the next KNITX edition.",
};

export default async function V12VotePage() {
  const candidates = await getVoteCandidates();

  return <V12VoteClient initialCandidates={candidates} />;
}
