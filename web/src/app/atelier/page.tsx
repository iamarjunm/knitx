import type { Metadata } from 'next';
import AtelierClient from '@/components/AtelierClient';

export const metadata: Metadata = {
  title: 'SAMPLE-FIRST ATELIER // KNITX ARCHITECTURE',
  description:
    'Zero deadstock. Zero mass production. Explore KNITX lean Sample-First drop architecture, 420–480 GSM fabrics, and Mumbai studio craftsmanship.',
};

export default function AtelierPage() {
  return <AtelierClient />;
}
