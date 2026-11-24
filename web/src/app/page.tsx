import {
  getActiveDrop,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import FlagshipHomeClient from "@/components/flagship/FlagshipHomeClient";

export const revalidate = 30;

export default async function HomePage() {
  const [drop, products, candidates] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
  ]);

  return (
    <FlagshipHomeClient
      drop={drop}
      products={products}
      candidateCount={candidates.length}
    />
  );
}
