import {defineField, defineType} from 'sanity'
import {RocketIcon} from '@sanity/icons'

export const drop = defineType({
  name: 'drop',
  title: 'Drop',
  type: 'document',
  icon: RocketIcon,
  groups: [
    {name: 'core', title: 'Core Identity', default: true},
    {name: 'editorial', title: 'Editorial & Media'},
    {name: 'allocation', title: 'Queue & Allocation'},
  ],
  fields: [
    defineField({
      name: 'dropNumber',
      title: 'Drop Number',
      type: 'string',
      group: 'core',
      description: 'Three-digit sequence code, e.g. "001", "002".',
      validation: (Rule) => Rule.required().max(10),
    }),
    defineField({
      name: 'title',
      title: 'Drop Title',
      type: 'string',
      group: 'core',
      description: 'Collection name in uppercase, e.g. "MONSOON CONCRETE".',
      validation: (Rule) => Rule.required().min(2).max(80),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'core',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      group: 'core',
      description: 'Short editorial tagline displayed under the drop title.',
    }),
    defineField({
      name: 'phase',
      title: 'Drop Phase',
      type: 'string',
      group: 'core',
      initialValue: 'waitlist',
      options: {
        list: [
          {title: 'Teaser (50% Silhouette Lock)', value: 'teaser'},
          {title: 'Community Voting Open', value: 'voting'},
          {title: 'Waitlist Queue Active', value: 'waitlist'},
          {title: 'Vault Live (Unlocked)', value: 'live'},
          {title: 'Sold Out / Archived', value: 'sold_out'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'launchDate',
      title: 'Vault Launch Date & Time',
      type: 'datetime',
      group: 'allocation',
      description: 'Target IST/UTC timestamp when Vault doors open.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'manifesto',
      title: 'Drop Manifesto',
      type: 'text',
      rows: 5,
      group: 'editorial',
      description: 'Design philosophy, material origin, and cultural story behind the capsule.',
    }),
    defineField({
      name: 'teaserVideoUrl',
      title: 'Teaser Video URL',
      type: 'url',
      group: 'editorial',
      description: 'Optional looping MP4 / Mux / Vimeo editorial teaser URL.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      group: 'editorial',
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
      name: 'totalSlots',
      title: 'Total Vault Access Slots',
      type: 'number',
      group: 'allocation',
      description: 'Total collector slots invited into the Vault for this drop.',
      initialValue: 150,
      validation: (Rule) => Rule.required().integer().positive(),
    }),
    defineField({
      name: 'waitlistCount',
      title: 'Current Waitlist Count',
      type: 'number',
      group: 'allocation',
      description: 'Live count of verified waitlist entrants (incremented by storefront API).',
      initialValue: 0,
      validation: (Rule) => Rule.required().integer().min(0),
    }),
  ],
  orderings: [
    {
      title: 'Drop Number (Newest)',
      name: 'dropNumberDesc',
      by: [{field: 'dropNumber', direction: 'desc'}],
    },
    {
      title: 'Launch Date (Soonest)',
      name: 'launchDateAsc',
      by: [{field: 'launchDate', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      dropNumber: 'dropNumber',
      title: 'title',
      phase: 'phase',
      waitlistCount: 'waitlistCount',
      totalSlots: 'totalSlots',
      media: 'heroImage',
    },
    prepare({dropNumber, title, phase, waitlistCount, totalSlots, media}) {
      const phaseLabel = phase ? phase.toUpperCase().replace('_', ' ') : 'DRAFT'
      return {
        title: `DROP ${dropNumber ?? '---'} // ${title ?? 'Untitled'}`,
        subtitle: `${phaseLabel} • ${waitlistCount ?? 0} queued / ${totalSlots ?? 0} slots`,
        media,
      }
    },
  },
})
