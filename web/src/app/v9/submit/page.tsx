import { getCreatorSubmissions } from "@/sanity/lib/fetchers";
import V9SubmitPageClient from "@/components/v9/V9SubmitPageClient";

export const revalidate = 60;

export default async function V9SubmitPage() {
  const submissions = await getCreatorSubmissions();
  return <V9SubmitPageClient initialSubmissions={submissions} />;
}
