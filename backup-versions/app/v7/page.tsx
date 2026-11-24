import {
  getActiveDrop,
  getCreatorSubmissions,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import V7Experience from "@/components/v7/V7Experience";

export const revalidate = 60;

export default async function V7HomePage() {
  const [drop, products, candidates, submissions] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
    getCreatorSubmissions(),
  ]);

  return (
    <V7Experience
      drop={drop}
      products={products}
      candidates={candidates}
      submissions={submissions}
    />
  );
}
