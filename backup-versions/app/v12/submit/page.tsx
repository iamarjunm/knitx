import type { Metadata } from "next";
import { getCreatorSubmissions } from "@/sanity/lib/fetchers";
import V12SubmitClient from "@/components/v12/V12SubmitClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Creator Submissions · KNITX",
  description:
    "Submit original garment silhouettes for upcoming KNITX editions. Community-selected concepts enter sample cutting and numbered production.",
};

export default async function V12SubmitPage() {
  const submissions = await getCreatorSubmissions();

  return <V12SubmitClient initialSubmissions={submissions} />;
}
