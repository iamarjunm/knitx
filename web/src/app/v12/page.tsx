import {
  getActiveDrop,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import V12HomeClient from "@/components/v12/V12HomeClient";

export const revalidate = 30;

export default async function V12HomePage() {
  const [drop, products, candidates] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
  ]);

  return (
    <V12HomeClient
      drop={drop}
      products={products}
      candidateCount={candidates.length}
    />
  );
}
