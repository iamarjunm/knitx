import {
  getActiveDrop,
  getCreatorSubmissions,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import V5Experience from "@/components/v5/V5Experience";

export const revalidate = 60;

export default async function V5HomePage() {
  const [drop, products, candidates, submissions] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
    getCreatorSubmissions(),
  ]);

  return (
    <V5Experience
      drop={drop}
      products={products}
      candidates={candidates}
      submissions={submissions}
    />
  );
}
