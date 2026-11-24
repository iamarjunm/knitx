import {
  getActiveDrop,
  getCreatorSubmissions,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import V4Experience from "@/components/v4/V4Experience";

export const revalidate = 60;

export default async function V4HomePage() {
  const [drop, products, candidates, submissions] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
    getCreatorSubmissions(),
  ]);

  return (
    <V4Experience
      drop={drop}
      products={products}
      candidates={candidates}
      submissions={submissions}
    />
  );
}
