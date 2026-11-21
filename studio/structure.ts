import type {StructureResolver} from 'sanity/structure'
import {
  CogIcon,
  RocketIcon,
  TagIcon,
  StarIcon,
  CubeIcon,
  EyeClosedIcon,
  UsersIcon,
  ClockIcon,
  UnlockIcon,
  SparklesIcon,
  ThListIcon,
  UploadIcon,
  PackageIcon,
} from '@sanity/icons'

export const SINGLETON_TYPES = new Set<string>(['siteSettings'])

export const structure: StructureResolver = (S) =>
  S.list()
    .title('KNITX // COMMAND')
    .items([
      // 1. Site Settings (Singleton)
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings'),
        ),

      S.divider(),

      // 2. Active Drops
      S.listItem()
        .title('Active Drops')
        .icon(RocketIcon)
        .schemaType('drop')
        .child(
          S.documentTypeList('drop')
            .title('Active Drops')
            .defaultOrdering([{field: 'dropNumber', direction: 'desc'}]),
        ),

      // 3. Vault Catalog
      S.listItem()
        .title('Vault Catalog')
        .icon(TagIcon)
        .child(
          S.list()
            .title('Vault Catalog')
            .items([
              S.listItem()
                .title('All Pieces')
                .icon(TagIcon)
                .schemaType('product')
                .child(
                  S.documentTypeList('product')
                    .title('All Vault Pieces')
                    .defaultOrdering([{field: 'serialCode', direction: 'asc'}]),
                ),
              S.divider(),
              S.listItem()
                .title("One-of-One Collector's")
                .icon(StarIcon)
                .schemaType('product')
                .child(
                  S.documentList()
                    .title("One-of-One Collector's Pieces")
                    .schemaType('product')
                    .filter('_type == "product" && tier == "one-of-one"')
                    .defaultOrdering([{field: 'priceInr', direction: 'desc'}]),
                ),
              S.listItem()
                .title('Small-Batch Pieces')
                .icon(CubeIcon)
                .schemaType('product')
                .child(
                  S.documentList()
                    .title('Small-Batch Pieces (3–4 Units)')
                    .schemaType('product')
                    .filter('_type == "product" && tier == "small-batch"')
                    .defaultOrdering([{field: 'serialCode', direction: 'asc'}]),
                ),
              S.listItem()
                .title('Mystery Silhouettes')
                .icon(EyeClosedIcon)
                .schemaType('product')
                .child(
                  S.documentList()
                    .title('Mystery Silhouettes (Unrevealed 50%)')
                    .schemaType('product')
                    .filter('_type == "product" && isMystery == true')
                    .defaultOrdering([{field: 'serialCode', direction: 'asc'}]),
                ),
            ]),
        ),

      S.divider(),

      // 4. Waitlist Queue
      S.listItem()
        .title('Waitlist Queue')
        .icon(UsersIcon)
        .child(
          S.list()
            .title('Waitlist Queue')
            .items([
              S.listItem()
                .title('All Entries')
                .icon(UsersIcon)
                .schemaType('waitlistEntry')
                .child(
                  S.documentTypeList('waitlistEntry')
                    .title('All Waitlist Entries')
                    .defaultOrdering([{field: 'position', direction: 'asc'}]),
                ),
              S.divider(),
              S.listItem()
                .title('Queued')
                .icon(ClockIcon)
                .schemaType('waitlistEntry')
                .child(
                  S.documentList()
                    .title('Queued Members')
                    .schemaType('waitlistEntry')
                    .filter('_type == "waitlistEntry" && status == "queued"')
                    .defaultOrdering([{field: 'position', direction: 'asc'}]),
                ),
              S.listItem()
                .title('Invited / Unlocked')
                .icon(UnlockIcon)
                .schemaType('waitlistEntry')
                .child(
                  S.documentList()
                    .title('Invited & Vault-Unlocked Members')
                    .schemaType('waitlistEntry')
                    .filter('_type == "waitlistEntry" && status in ["invited", "entered"]')
                    .defaultOrdering([{field: 'position', direction: 'asc'}]),
                ),
            ]),
        ),

      // 5. Community Arena
      S.listItem()
        .title('Community Arena')
        .icon(SparklesIcon)
        .child(
          S.list()
            .title('Community Arena')
            .items([
              S.listItem()
                .title('Voting Candidates')
                .icon(ThListIcon)
                .schemaType('designVoteCandidate')
                .child(
                  S.documentTypeList('designVoteCandidate')
                    .title('Design Voting Candidates')
                    .defaultOrdering([{field: 'votesCount', direction: 'desc'}]),
                ),
              S.listItem()
                .title('Creator Submissions')
                .icon(UploadIcon)
                .schemaType('creatorSubmission')
                .child(
                  S.documentTypeList('creatorSubmission')
                    .title('Creator Design Submissions')
                    .defaultOrdering([{field: 'createdAt', direction: 'desc'}]),
                ),
            ]),
        ),

      S.divider(),

      // 6. Orders & Sample-First Fulfillment
      S.listItem()
        .title('Orders & Sample-First Fulfillment')
        .icon(PackageIcon)
        .schemaType('order')
        .child(
          S.documentTypeList('order')
            .title('Orders & Sample-First Fulfillment')
            .defaultOrdering([{field: 'createdAt', direction: 'desc'}]),
        ),
    ])
