import type { Metadata } from 'next';
import { getCreatorSubmissions } from '@/sanity/lib/fetchers';
import SubmitClient from '@/components/SubmitClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CREATOR SUBMISSION LAB // KNITX',
  description:
    'Submit your streetwear blueprint to KNITX. Winning designs get sampled, produced, neck-tag credited, and promoted via flagship drop reels.',
};

export default async function SubmitPage() {
  const submissions = await getCreatorSubmissions();

  return <SubmitClient initialSubmissions={submissions} />;
}
