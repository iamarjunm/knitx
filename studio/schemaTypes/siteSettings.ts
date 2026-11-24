import {defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'brandName',
      title: 'Brand Name',
      type: 'string',
      initialValue: 'KNITX',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'activeDrop',
      title: 'Active Featured Drop',
      type: 'reference',
      to: [{type: 'drop'}],
      description: 'Primary drop powering the storefront hero, Vault countdown, and catalog.',
    }),
    defineField({
      name: 'announcementTicker',
      title: 'Announcement Ticker',
      type: 'string',
      description: 'Top marquee text shown across the storefront.',
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Atelier Contact Email',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'customizerConfig',
      title: 'Admin Storefront Customizer JSON',
      type: 'text',
      rows: 6,
      description: 'Managed automatically by the KNITX Admin Portal (/admin).',
    }),
  ],
  preview: {
    select: {
      brandName: 'brandName',
      dropTitle: 'activeDrop.title',
      dropNumber: 'activeDrop.dropNumber',
    },
    prepare({brandName, dropTitle, dropNumber}) {
      return {
        title: `${brandName ?? 'KNITX'} // Site Settings`,
        subtitle: dropTitle ? `Active: DROP ${dropNumber ?? ''} — ${dropTitle}` : 'No active drop linked',
      }
    },
  },
})
