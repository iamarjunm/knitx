import type { Metadata } from "next";
import { getActiveDrop, getDropProducts } from "@/sanity/lib/fetchers";
import FlagshipDropsClient from "@/components/flagship/FlagshipDropsClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Private Drop · KNITX",
  description:
    "Sign in with your admitted KNITX account to view the current limited-edition drop, inspect fabric weights, and reserve cut-to-order garments.",
};

export default async function DropsPage() {
  const [drop, products] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
  ]);

  return <FlagshipDropsClient drop={drop} products={products} />;
}
