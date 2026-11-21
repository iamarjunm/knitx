import {defineField, defineType} from 'sanity'
import {UsersIcon} from '@sanity/icons'

export const waitlistEntry = defineType({
  name: 'waitlistEntry',
  title: 'Waitlist Entry',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'firebaseUid',
      title: 'Firebase UID',
      type: 'string',
      description: 'Authenticated Firebase user ID linking this queue spot to the collector account.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Collector Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'position',
      title: 'Queue Position (#)',
      type: 'number',
      description: 'Sequential rank in the drop waitlist.',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
    defineField({
      name: 'status',
      title: 'Vault Access Status',
      type: 'string',
      initialValue: 'queued',
      options: {
        list: [
          {title: 'Queued (Waiting)', value: 'queued'},
          {title: 'Invited (Access Code Sent)', value: 'invited'},
          {title: 'Entered (Vault Unlocked)', value: 'entered'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'accessCode',
      title: 'Vault Access Code',
      type: 'string',
      description: 'Unique drop unlock key, e.g. "KX-VAULT-8F4A".',
    }),
    defineField({
      name: 'joinedAt',
      title: 'Joined At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Queue Position (Ascending)',
      name: 'positionAsc',
      by: [{field: 'position', direction: 'asc'}],
    },
    {
      title: 'Joined At (Newest)',
      name: 'joinedAtDesc',
      by: [{field: 'joinedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      position: 'position',
      name: 'name',
      email: 'email',
      status: 'status',
      accessCode: 'accessCode',
    },
    prepare({position, name, email, status, accessCode}) {
      const statusLabel = status ? status.toUpperCase() : 'QUEUED'
      const codePart = accessCode ? ` • ${accessCode}` : ''
      return {
        title: `#${position ?? '?'} — ${name ?? 'Anonymous Collector'}`,
        subtitle: `${statusLabel}${codePart} • ${email ?? ''}`,
      }
    },
  },
})
