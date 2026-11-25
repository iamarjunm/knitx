import type { Metadata } from "next";
import { getActiveDrop } from "@/sanity/lib/fetchers";
import FlagshipCoreClient from "@/components/flagship/FlagshipCoreClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "KNITX CORE — Heavyweight Essential Wardrobe",
  description:
    "Signature heavyweight 320–480 GSM mineral-dyed wardrobe essentials crafted in India with subtle KNITX branding. Opens two weeks after Drop 1 for admitted Drop 1 and community waitlist accounts.",
};

export default async function CorePage() {
  const drop = await getActiveDrop();

  return <FlagshipCoreClient drop={drop} />;
}
