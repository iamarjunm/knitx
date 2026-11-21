import {defineArrayMember, defineField, defineType} from 'sanity'
import {TagIcon} from '@sanity/icons'

export const product = defineType({
  name: 'product',
  title: 'Vault Piece',
  type: 'document',
  icon: TagIcon,
  groups: [
    {name: 'identity', title: 'Identity & Scarcity', default: true},
    {name: 'craft', title: 'Fabric & Craftsmanship'},
    {name: 'media', title: 'Visuals & Silhouette'},
    {name: 'fulfillment', title: 'Sample-First Production'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Piece Title',
      type: 'string',
      group: 'identity',
      validation: (Rule) => Rule.required().min(2).max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'identity',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'serialCode',
      title: 'Serial Code',
      type: 'string',
      group: 'identity',
      description: 'Archival edition code stitched on the woven label, e.g. "KX-001-1OF1-01".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'drop',
      title: 'Assigned Drop',
      type: 'reference',
      group: 'identity',
      to: [{type: 'drop'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tier',
      title: 'Scarcity Tier',
      type: 'string',
      group: 'identity',
      initialValue: 'small-batch',
      options: {
        list: [
          {title: 'Small-Batch Piece (3–4 units • ₹2,500–₹4,000)', value: 'small-batch'},
          {title: "One-of-One Collector's Piece (1 unit • ₹5,000–₹10,000+)", value: 'one-of-one'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'priceInr',
      title: 'Price (INR ₹)',
      type: 'number',
      group: 'identity',
      description: 'Retail price in Indian Rupees (whole INR).',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
    defineField({
      name: 'totalUnits',
      title: 'Total Units in Existence',
      type: 'number',
      group: 'identity',
      description: 'Strictly 1 for One-of-One, or 3–4 for Small-Batch.',
      initialValue: 4,
      validation: (Rule) => Rule.required().integer().min(1).max(10),
    }),
    defineField({
      name: 'remainingUnits',
      title: 'Remaining Units Available',
      type: 'number',
      group: 'identity',
      initialValue: 4,
      validation: (Rule) =>
        Rule.required()
          .integer()
          .min(0)
          .custom((remaining, context) => {
            const total = (context.document as {totalUnits?: number} | undefined)?.totalUnits
            if (typeof remaining === 'number' && typeof total === 'number' && remaining > total) {
              return 'Remaining units cannot exceed total units in existence.'
            }
            return true
          }),
    }),
    defineField({
      name: 'isMystery',
      title: 'Mystery Silhouette Lock (50% Unrevealed)',
      type: 'boolean',
      group: 'identity',
      description:
        'When enabled, the storefront masks full photos and renders the redacted silhouette teaser until Vault unlock.',
      initialValue: false,
    }),
    defineField({
      name: 'gsmWeight',
      title: 'Fabric GSM Weight',
      type: 'string',
      group: 'craft',
      description: 'e.g. "520 GSM Heavy French Terry" or "320 GSM Combed Jersey".',
    }),
    defineField({
      name: 'fabric',
      title: 'Fabric Composition',
      type: 'string',
      group: 'craft',
      description: 'e.g. "100% Organic Tiruppur Loopback Cotton, Pre-shrunk".',
    }),
    defineField({
      name: 'craftsmanship',
      title: 'Craftsmanship Details',
      type: 'array',
      group: 'craft',
      of: [defineArrayMember({type: 'string'})],
      description: 'Bullet list of construction techniques, washes, embroidery, hardware, and numbering.',
    }),
    defineField({
      name: 'sizes',
      title: 'Available Sizes',
      type: 'array',
      group: 'craft',
      of: [defineArrayMember({type: 'string'})],
      initialValue: ['S', 'M', 'L', 'XL'],
      options: {
        list: [
          {title: 'XS', value: 'XS'},
          {title: 'S', value: 'S'},
          {title: 'M', value: 'M'},
          {title: 'L', value: 'L'},
          {title: 'XL', value: 'XL'},
          {title: 'XXL', value: 'XXL'},
          {title: 'FREE / ONE SIZE', value: 'OS'},
        ],
      },
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'description',
      title: 'Editorial Description',
      type: 'text',
      rows: 4,
      group: 'craft',
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Garment Image',
      type: 'image',
      group: 'media',
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
      name: 'silhouetteImage',
      title: 'Mystery Silhouette Image',
      type: 'image',
      group: 'media',
      description: 'High-contrast dark silhouette used when Mystery Lock is active.',
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
      name: 'gallery',
      title: 'Detail & Lookbook Gallery',
      type: 'array',
      group: 'media',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'creatorCredit',
      title: 'Creator / Atelier Credit',
      type: 'string',
      group: 'fulfillment',
      description: 'e.g. "KNITX ATELIER // BENGALURU" or community designer credit.',
    }),
    defineField({
      name: 'productionDays',
      title: 'Sample-First Production Lead Time (Days)',
      type: 'number',
      group: 'fulfillment',
      description: 'Made-to-order atelier turnaround in business days after Razorpay confirmation.',
      initialValue: 14,
      validation: (Rule) => Rule.required().integer().min(3).max(45),
    }),
  ],
  orderings: [
    {
      title: 'Serial Code (A–Z)',
      name: 'serialCodeAsc',
      by: [{field: 'serialCode', direction: 'asc'}],
    },
    {
      title: 'Price (High to Low)',
      name: 'priceDesc',
      by: [{field: 'priceInr', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      serialCode: 'serialCode',
      tier: 'tier',
      priceInr: 'priceInr',
      remainingUnits: 'remainingUnits',
      totalUnits: 'totalUnits',
      isMystery: 'isMystery',
      media: 'mainImage',
    },
    prepare({title, serialCode, tier, priceInr, remainingUnits, totalUnits, isMystery, media}) {
      const tierBadge = tier === 'one-of-one' ? '1-OF-1' : 'SMALL-BATCH'
      const mysteryFlag = isMystery ? ' • MYSTERY' : ''
      const priceLabel = typeof priceInr === 'number' ? `₹${priceInr.toLocaleString('en-IN')}` : '₹—'
      return {
        title: `${serialCode ?? 'KX'} — ${title ?? 'Untitled Piece'}`,
        subtitle: `${tierBadge} • ${priceLabel} • ${remainingUnits ?? 0}/${totalUnits ?? 0} left${mysteryFlag}`,
        media,
      }
    },
  },
})
