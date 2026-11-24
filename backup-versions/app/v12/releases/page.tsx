import type { Metadata } from "next";
import {
  getActiveDrop,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import V12ReleasesClient from "@/components/v12/V12ReleasesClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Releases & Archive · KNITX",
  description:
    "Sequential release calendar, permanent one-of-one and small-batch tier architecture, and publicly revealed silhouettes from KNITX.",
};

export default async function V12ReleasesPage() {
  const [drop, products, candidates] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
  ]);

  return (
    <V12ReleasesClient
      drop={drop}
      products={products}
      candidateCount={candidates.length}
    />
  );
}
