import type { Metadata } from 'next';
import { getVoteCandidates } from '@/sanity/lib/fetchers';
import VoteClient from '@/components/VoteClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'COMMUNITY VOTING ARENA // KNITX DROP 002',
  description:
    'Vote on upcoming KNITX Drop 002 silhouettes. Top 4 concepts enter Sample-First production with creator neck-tag attribution.',
};

export default async function VotePage() {
  const candidates = await getVoteCandidates();

  return <VoteClient initialCandidates={candidates} />;
}
