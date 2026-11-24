import type { Metadata } from "next";
import { getActiveDrop, getDropProducts } from "@/sanity/lib/fetchers";
import V11ReleaseClient from "@/components/v11/V11ReleaseClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Private Release · KNITX",
  description:
    "Enter the KNITX private edition room to view all numbered silhouettes, inspect fabric specifications, and reserve limited-run garments.",
};

export default async function V11ReleasePage() {
  const [drop, products] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
  ]);

  return <V11ReleaseClient drop={drop} products={products} />;
}
