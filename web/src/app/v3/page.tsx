import {
  getActiveDrop,
  getCreatorSubmissions,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import V3Experience from "@/components/v3/V3Experience";

export const revalidate = 60;

export default async function V3HomePage() {
  const [drop, products, candidates, submissions] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
    getCreatorSubmissions(),
  ]);

  return (
    <V3Experience
      drop={drop}
      products={products}
      candidates={candidates}
      submissions={submissions}
    />
  );
}

