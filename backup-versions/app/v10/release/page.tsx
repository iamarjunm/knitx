import type { Metadata } from "next";
import { getActiveDrop, getDropProducts } from "@/sanity/lib/fetchers";
import V10ReleaseClient from "@/components/v10/V10ReleaseClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Private Release · KNITX",
  description:
    "Enter the KNITX private edition room to view all numbered silhouettes, inspect fabric specifications, and reserve limited-run garments.",
};

export default async function V10ReleasePage() {
  const [drop, products] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
  ]);

  return <V10ReleaseClient drop={drop} products={products} />;
}
