import type { Metadata } from 'next';
import { getActiveDrop, getDropProducts } from '@/sanity/lib/fetchers';
import VaultClient from '@/components/VaultClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'EXCLUSIVE VAULT // KNITX DROP 001',
  description:
    'Enter the KNITX sealed vault. Declassify mystery archive pieces, claim 1-of-1 collector garments, and allocate small-batch made-to-order streetwear.',
};

export default async function VaultPage() {
  const [drop, products] = await Promise.all([
    getActiveDrop(),
    getDropProducts(),
  ]);

  return <VaultClient drop={drop} products={products} />;
}
