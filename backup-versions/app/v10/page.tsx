import {
  getActiveDrop,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import V10HomeClient from "@/components/v10/V10HomeClient";

export const revalidate = 30;

export default async function V10HomePage() {
  const [drop, products, candidates] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
  ]);

  return (
    <V10HomeClient
      drop={drop}
      products={products}
      candidateCount={candidates.length}
    />
  );
}
