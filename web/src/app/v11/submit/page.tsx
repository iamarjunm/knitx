import type { Metadata } from "next";
import { getCreatorSubmissions } from "@/sanity/lib/fetchers";
import V11SubmitClient from "@/components/v11/V11SubmitClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Creator Residency — Submission Studio · KNITX",
  description:
    "Submit original garment silhouettes for upcoming KNITX editions. Selected dossiers enter community voting, studio sampling, and numbered micro-run production.",
};

export default async function V11SubmitPage() {
  const submissions = await getCreatorSubmissions();

  return <V11SubmitClient initialSubmissions={submissions} />;
}
