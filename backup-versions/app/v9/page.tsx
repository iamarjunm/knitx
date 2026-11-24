import { getActiveDrop, getDropProducts } from "@/sanity/lib/fetchers";
import V9HomeClient from "@/components/v9/V9HomeClient";

export const revalidate = 60;

export default async function V9HomePage() {
  const [drop, products] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
  ]);

  return <V9HomeClient drop={drop} products={products} />;
}
