import {
  getActiveDrop,
  getCreatorSubmissions,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import V6Experience from "@/components/v6/V6Experience";

export const revalidate = 60;

export default async function V6HomePage() {
  const [drop, products, candidates, submissions] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
    getCreatorSubmissions(),
  ]);

  return (
    <V6Experience
      drop={drop}
      products={products}
      candidates={candidates}
      submissions={submissions}
    />
  );
}
