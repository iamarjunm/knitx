import type { Metadata } from "next";
import { getCreatorSubmissions } from "@/sanity/lib/fetchers";
import FlagshipSubmitClient from "@/components/flagship/FlagshipSubmitClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Creator Residency & Submissions · KNITX",
  description:
    "Submit original garment silhouettes for upcoming KNITX editions. Community-selected concepts enter sample cutting and numbered production.",
};

export default async function SubmitPage() {
  const submissions = await getCreatorSubmissions();

  return <FlagshipSubmitClient initialSubmissions={submissions} />;
}
