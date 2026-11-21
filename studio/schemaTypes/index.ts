import type {SchemaTypeDefinition} from 'sanity'

import {drop} from './drop'
import {product} from './product'
import {waitlistEntry} from './waitlistEntry'
import {designVoteCandidate} from './designVoteCandidate'
import {creatorSubmission} from './creatorSubmission'
import {order} from './order'
import {siteSettings} from './siteSettings'

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettings,
  drop,
  product,
  waitlistEntry,
  designVoteCandidate,
  creatorSubmission,
  order,
]
