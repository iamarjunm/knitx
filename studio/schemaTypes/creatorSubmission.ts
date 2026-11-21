import {defineField, defineType} from 'sanity'
import {UploadIcon} from '@sanity/icons'

export const creatorSubmission = defineType({
  name: 'creatorSubmission',
  title: 'Creator Submission',
  type: 'document',
  icon: UploadIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Design Concept Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(100),
    }),
    defineField({
      name: 'creatorName',
      title: 'Creator Full Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'creatorHandle',
      title: 'Creator Social Handle',
      type: 'string',
      description: 'Instagram / Behance / X handle, e.g. "@meera.textiles".',
    }),
    defineField({
      name: 'email',
      title: 'Creator Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'category',
      title: 'Garment Category',
      type: 'string',
      options: {
        list: [
          {title: 'Heavyweight Hoodie', value: 'Heavyweight Hoodie'},
          {title: 'Boxy Graphic Tee', value: 'Boxy Graphic Tee'},
          {title: '1-of-1 Archive Outerwear', value: '1-of-1 Archive Outerwear'},
          {title: 'Technical Outerwear / Jacket', value: 'Technical Outerwear'},
          {title: 'Distressed Knit', value: 'Distressed Knit'},
          {title: 'Archival Knitwear', value: 'Archival Knitwear'},
          {title: 'Utility Bottoms', value: 'Utility Bottoms'},
          {title: 'Utility Cargo / Bottoms', value: 'Utility Cargo / Bottoms'},
          {title: 'Collector Accessory', value: 'Collector Accessory'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'craftsmanshipNotes',
      title: 'Craftsmanship & Construction Notes',
      type: 'text',
      rows: 5,
      description: 'Fabric GSM, dye process, embroidery placement, hardware, and sizing intent.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mockupImage',
      title: 'Mockup / Tech Pack Visual',
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
      name: 'imageUrl',
      title: 'Fallback / Template Visual URL',
      type: 'string',
      description: 'Optional relative or CDN path when a creator selects a studio silhouette template.',
    }),
    defineField({
      name: 'status',
      title: 'Curation Status',
      type: 'string',
      initialValue: 'pending',
      options: {
        list: [
          {title: 'Pending Atelier Review', value: 'pending'},
          {title: 'Approved for Community Vote', value: 'approved_for_vote'},
          {title: 'Selected for Drop Production', value: 'selected'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'createdAt',
      title: 'Submitted At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Submitted At (Newest)',
      name: 'createdAtDesc',
      by: [{field: 'createdAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      creatorName: 'creatorName',
      creatorHandle: 'creatorHandle',
      category: 'category',
      status: 'status',
      media: 'mockupImage',
    },
    prepare({title, creatorName, creatorHandle, category, status, media}) {
      const statusLabel = status ? status.toUpperCase().replace(/_/g, ' ') : 'PENDING'
      return {
        title: title ?? 'Untitled Submission',
        subtitle: `${statusLabel} • ${category ?? 'Garment'} • ${creatorName ?? ''} (${creatorHandle ?? 'no handle'})`,
        media,
      }
    },
  },
})
