import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveDrop } from "@/sanity/lib/fetchers";
import { CORE_COLLECTION_GARMENTS } from "@/lib/core-catalog";
import FlagshipCoreProductClient from "@/components/flagship/FlagshipCoreProductClient";

export const revalidate = 30;

interface CoreProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ color?: string }>;
}

function findCoreGarment(rawSlug: string) {
  const normalized = decodeURIComponent(rawSlug).trim().toLowerCase();
  return (
    CORE_COLLECTION_GARMENTS.find(
      (item) =>
        item._id.toLowerCase() === normalized ||
        item.serialCode.toLowerCase() === normalized
    ) || null
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const garment = findCoreGarment(slug);

  if (!garment) {
    return {
      title: "Core Garment Not Found — KNITX CORE",
      description: "Requested KNITX CORE silhouette could not be located.",
    };
  }

  return {
    title: `${garment.title} — KNITX CORE`,
    description: `${garment.gsmWeight} ${garment.fabric}. ${garment.description}`,
    openGraph: {
      title: `${garment.title} — KNITX CORE`,
      description: garment.description,
      type: "website",
      locale: "en_IN",
      siteName: "KNITX",
    },
  };
}

export default async function CoreProductDetailPage({
  params,
  searchParams,
}: CoreProductPageProps) {
  const [{ slug }, { color }, drop] = await Promise.all([
    params,
    searchParams,
    getActiveDrop(),
  ]);

  const garment = findCoreGarment(slug);
  if (!garment) {
    notFound();
  }

  const relatedGarments = CORE_COLLECTION_GARMENTS.filter(
    (item) => item._id !== garment._id
  ).slice(0, 4);

  return (
    <FlagshipCoreProductClient
      garment={garment}
      drop={drop}
      initialColor={color}
      relatedGarments={relatedGarments}
    />
  );
}
