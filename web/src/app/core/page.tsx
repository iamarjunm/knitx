import type { Metadata } from "next";
import { getActiveDrop } from "@/sanity/lib/fetchers";
import FlagshipCoreClient from "@/components/flagship/FlagshipCoreClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "KNITX CORE — Heavyweight Essential Wardrobe",
  description:
    "Unbranded 320–480 GSM mineral-dyed wardrobe essentials crafted in India. Opens two weeks after Drop 1 for Drop 1 and community waitlist members.",
};

export default async function CorePage() {
  const drop = await getActiveDrop();

  return <FlagshipCoreClient drop={drop} />;
}
