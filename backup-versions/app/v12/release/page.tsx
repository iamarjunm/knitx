import type { Metadata } from "next";
import { getActiveDrop, getDropProducts } from "@/sanity/lib/fetchers";
import V12ReleaseClient from "@/components/v12/V12ReleaseClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Private Release · KNITX",
  description:
    "Enter the KNITX private release to view all numbered silhouettes, inspect fabric specs, and claim limited-run pieces.",
};

export default async function V12ReleasePage() {
  const [drop, products] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
  ]);

  return <V12ReleaseClient drop={drop} products={products} />;
}
