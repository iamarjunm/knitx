import {
  getActiveDrop,
  getDropProducts,
  getVoteCandidates,
} from "@/sanity/lib/fetchers";
import HomeClient from "@/components/HomeClient";

export const revalidate = 60;

export default async function HomePage() {
  const [drop, products, candidates] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
    getVoteCandidates(),
  ]);

  return (
    <HomeClient drop={drop} products={products} candidates={candidates} />
  );
}
