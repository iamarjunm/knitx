import {defineArrayMember, defineField, defineType} from 'sanity'
import {SparklesIcon} from '@sanity/icons'

export const designVoteCandidate = defineType({
  name: 'designVoteCandidate',
  title: 'Design Vote Candidate',
  type: 'document',
  icon: SparklesIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Concept Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(100),
    }),
    defineField({
      name: 'code',
      title: 'Candidate Code',
      type: 'string',
      description: 'Arena ballot code, e.g. "D02-CAND-01".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'creatorName',
      title: 'Creator Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'creatorHandle',
      title: 'Creator Handle',
      type: 'string',
      description: 'Instagram or X handle, e.g. "@kabir.drapes".',
    }),
    defineField({
      name: 'tierSuggestion',
      title: 'Proposed Scarcity Tier',
      type: 'string',
      initialValue: 'small-batch',
      options: {
        list: [
          {title: 'Small-Batch (3–4 Units)', value: 'small-batch'},
          {title: 'One-of-One Collector Piece (1 Unit)', value: 'one-of-one'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Concept Brief',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'craftsmanship',
      title: 'Craftsmanship & Material Specs',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      description: 'Key construction tags shown on the voting card.',
    }),
    defineField({
      name: 'conceptImage',
      title: 'Concept Mockup / Sketch',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'votesCount',
      title: 'Votes Count',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'voterUids',
      title: 'Voter Firebase UIDs',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      initialValue: [],
      description: 'Deduplicated list of Firebase UIDs that have cast a vote for this candidate.',
    }),
    defineField({
      name: 'status',
      title: 'Ballot Status',
      type: 'string',
      initialValue: 'voting',
      options: {
        list: [
          {title: 'Active Voting', value: 'voting'},
          {title: 'Selected Winner (Into Sample Production)', value: 'winner'},
          {title: 'Archived', value: 'archived'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Most Votes',
      name: 'votesDesc',
      by: [{field: 'votesCount', direction: 'desc'}],
    },
    {
      title: 'Candidate Code (A–Z)',
      name: 'codeAsc',
      by: [{field: 'code', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      code: 'code',
      title: 'title',
      creatorHandle: 'creatorHandle',
      votesCount: 'votesCount',
      status: 'status',
      tierSuggestion: 'tierSuggestion',
      media: 'conceptImage',
    },
    prepare({code, title, creatorHandle, votesCount, status, tierSuggestion, media}) {
      const tierLabel = tierSuggestion === 'one-of-one' ? '1-OF-1' : 'SMALL-BATCH'
      const statusLabel = status ? status.toUpperCase() : 'VOTING'
      return {
        title: `${code ?? 'CAND'} // ${title ?? 'Untitled Concept'}`,
        subtitle: `${votesCount ?? 0} votes • ${statusLabel} • ${tierLabel} • ${creatorHandle ?? ''}`,
        media,
      }
    },
  },
})
