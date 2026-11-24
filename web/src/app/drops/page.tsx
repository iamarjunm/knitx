import type { Metadata } from "next";
import { getActiveDrop, getDropProducts } from "@/sanity/lib/fetchers";
import FlagshipDropsClient from "@/components/flagship/FlagshipDropsClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Private Drop · KNITX",
  description:
    "Enter the KNITX private drop room to unveil all numbered silhouettes, inspect fabric weights, and reserve 1–4 unit limited-run garments.",
};

export default async function DropsPage() {
  const [drop, products] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
  ]);

  return <FlagshipDropsClient drop={drop} products={products} />;
}
