import type { Metadata } from "next";
import { getActiveDrop, getVoteCandidates } from "@/sanity/lib/fetchers";
import FlagshipProfileClient from "@/components/flagship/FlagshipProfileClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Member Profile · KNITX",
  description:
    "Manage your KNITX account access, waitlist position, Core wardrobe eligibility, cut-to-order garment orders, community votes, and design submissions.",
};

export default async function ProfilePage() {
  const [drop, candidates] = await Promise.all([
    getActiveDrop(),
    getVoteCandidates(),
  ]);

  return <FlagshipProfileClient drop={drop} allCandidates={candidates} />;
}
