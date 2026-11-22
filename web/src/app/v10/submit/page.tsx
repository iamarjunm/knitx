import type { Metadata } from "next";
import { getCreatorSubmissions } from "@/sanity/lib/fetchers";
import V10SubmitClient from "@/components/v10/V10SubmitClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Creator Residency — Future Editions · KNITX",
  description:
    "Submit original garment silhouettes for upcoming KNITX releases. Community-selected designs are sampled, produced in strictly limited runs, and credited prominently.",
};

export default async function V10SubmitPage() {
  const submissions = await getCreatorSubmissions();

  return <V10SubmitClient initialSubmissions={submissions} />;
}
