import {
  getActiveDrop,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import V11HomeClient from "@/components/v11/V11HomeClient";

export const revalidate = 30;

export default async function V11HomePage() {
  const [drop, products, candidates] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
  ]);

  return (
    <V11HomeClient
      drop={drop}
      products={products}
      candidateCount={candidates.length}
    />
  );
}
