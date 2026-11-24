import { getActiveDrop, getDropProducts } from "@/sanity/lib/fetchers";
import V9VaultPageClient from "@/components/v9/V9VaultPageClient";

export const revalidate = 60;

export default async function V9VaultPage() {
  const [drop, products] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
  ]);

  return <V9VaultPageClient drop={drop} products={products} />;
}
