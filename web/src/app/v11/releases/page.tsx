import type { Metadata } from "next";
import {
  getActiveDrop,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import V11ReleasesClient from "@/components/v11/V11ReleasesClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Releases & Archive — Sequential Edition Calendar · KNITX",
  description:
    "Explore the KNITX sequential multi-release calendar, permanent one-of-one and small-batch tier specifications, and current edition silhouettes.",
};

export default async function V11ReleasesPage() {
  const [drop, products, candidates] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
  ]);

  return (
    <V11ReleasesClient
      drop={drop}
      products={products}
      candidateCount={candidates.length}
    />
  );
}
