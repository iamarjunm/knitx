import type { Metadata } from "next";
import V11AtelierClient from "@/components/v11/V11AtelierClient";

export const metadata: Metadata = {
  title: "The Atelier — Sample-First, Zero Deadstock · KNITX",
  description:
    "Inside the KNITX house methodology: single-sample prototyping, heavyweight Indian textiles, artisanal Ari chain-stitching, and permanent pattern retirement.",
};

export default function V11AtelierPage() {
  return <V11AtelierClient />;
}
