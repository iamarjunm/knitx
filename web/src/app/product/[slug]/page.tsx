import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveDrop, getDropProducts } from "@/sanity/lib/fetchers";
import { cleanFlagshipText } from "@/lib/flagship-media";
import FlagshipProductClient from "@/components/flagship/FlagshipProductClient";

export const revalidate = 30;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function findProductEntry(
  products: Awaited<ReturnType<typeof getDropProducts>>,
  rawSlug: string
) {
  const decoded = decodeURIComponent(rawSlug).trim().toLowerCase();
  const index = products.findIndex(
    (item) =>
      item.slug.toLowerCase() === decoded ||
      item._id.toLowerCase() === decoded ||
      item.serialCode.toLowerCase() === decoded
  );
  if (index === -1) return null;
  return { product: products[index], index };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [drop, products] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
  ]);

  const match = findProductEntry(products, slug);
  if (!match) {
    return {
      title: "Garment Not Found — KNITX",
      description: "Requested limited-edition silhouette could not be located.",
    };
  }

  const { product } = match;
  const cleanTitle = product.isMystery
    ? `Veiled Silhouette ${product.serialCode}`
    : cleanFlagshipText(product.title);
  const cleanDropTitle = cleanFlagshipText(drop.title);
  const cleanDescription = product.isMystery
    ? `Limited-edition silhouette from KNITX ${cleanDropTitle}. Full reveal and ordering unlock automatically for admitted accounts.`
    : cleanFlagshipText(product.description);

  return {
    title: `${cleanTitle} — KNITX ${cleanDropTitle}`,
    description: cleanDescription,
    openGraph: {
      title: `${cleanTitle} — KNITX`,
      description: cleanDescription,
      type: "website",
      locale: "en_IN",
      siteName: "KNITX",
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [drop, products] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
  ]);

  const match = findProductEntry(products, slug);
  if (!match) {
    notFound();
  }

  const relatedProducts = products
    .map((item, idx) => ({ product: item, index: idx }))
    .filter(({ product }) => product._id !== match.product._id)
    .sort((a, b) => {
      const aRevealed = a.product.isMystery ? 1 : 0;
      const bRevealed = b.product.isMystery ? 1 : 0;
      if (aRevealed !== bRevealed) return aRevealed - bRevealed;
      const aSameTier = a.product.tier === match.product.tier ? 0 : 1;
      const bSameTier = b.product.tier === match.product.tier ? 0 : 1;
      return aSameTier - bSameTier;
    })
    .slice(0, 4);

  return (
    <FlagshipProductClient
      product={match.product}
      productIndex={match.index}
      drop={drop}
      relatedProducts={relatedProducts}
    />
  );
}
