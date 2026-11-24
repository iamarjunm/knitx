import type { Metadata } from "next";
import {
  getActiveDrop,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import FlagshipArchiveClient from "@/components/flagship/FlagshipArchiveClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Editions & Archive · KNITX",
  description:
    "Sequential multi-drop and KNITX CORE calendar, permanent house tier architecture, and publicly revealed collector silhouettes.",
};

export default async function ArchivePage() {
  const [drop, products, candidates] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
  ]);

  return (
    <FlagshipArchiveClient
      drop={drop}
      products={products}
      candidateCount={candidates.length}
    />
  );
}
