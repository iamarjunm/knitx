import type { Metadata } from "next";
import V10AtelierClient from "@/components/v10/V10AtelierClient";

export const metadata: Metadata = {
  title: "The Atelier — Sample-First, Zero Deadstock · KNITX",
  description:
    "Inside the KNITX house methodology: single-sample prototyping, private release allocation, heavyweight Indian textiles, and permanent pattern retirement.",
};

export default function V10AtelierPage() {
  return <V10AtelierClient />;
}
