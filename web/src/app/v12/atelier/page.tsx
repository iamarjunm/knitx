import type { Metadata } from "next";
import V12AtelierClient from "@/components/v12/V12AtelierClient";

export const metadata: Metadata = {
  title: "The Atelier — 0% Deadstock · KNITX",
  description:
    "Inside the KNITX sample-first studio methodology: single-sample prototyping, heavyweight Indian textiles, artisanal chain-stitching, and permanent pattern retirement.",
};

export default function V12AtelierPage() {
  return <V12AtelierClient />;
}
