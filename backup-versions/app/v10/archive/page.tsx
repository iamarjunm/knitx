import type { Metadata } from "next";
import {
  getActiveDrop,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import V10ArchiveClient from "@/components/v10/V10ArchiveClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Editions & Archive · KNITX",
  description:
    "Explore the KNITX sequential release schedule, permanent one-of-one and small-batch edition architecture, and current publicly revealed silhouettes.",
};

export default async function V10ArchivePage() {
  const [drop, products, candidates] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
  ]);

  return (
    <V10ArchiveClient
      drop={drop}
      products={products}
      candidateCount={candidates.length}
    />
  );
}
