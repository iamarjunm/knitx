import { defineQuery } from "next-sanity";

export const ACTIVE_DROP_QUERY = defineQuery(`
  *[_type == "drop"] | order(_createdAt desc)[0] {
    _id,
    dropNumber,
    title,
    subtitle,
    phase,
    launchDate,
    manifesto,
    waitlistCount,
    totalSlots
  }
`);

export const ALL_PRODUCTS_QUERY = defineQuery(`
  *[_type == "product"] | order(tier desc, serialCode asc) {
    _id,
    title,
    "slug": slug.current,
    serialCode,
    tier,
    priceInr,
    totalUnits,
    remainingUnits,
    isMystery,
    gsmWeight,
    fabric,
    craftsmanship,
    sizes,
    description,
    "image": coalesce(mainImage, image),
    imageUrl,
    silhouetteImage,
    silhouetteUrl,
    creatorCredit,
    productionDays
  }
`);

export const VOTE_CANDIDATES_QUERY = defineQuery(`
  *[_type == "designVoteCandidate"] | order(votesCount desc) {
    _id,
    title,
    code,
    creatorName,
    creatorHandle,
    tierSuggestion,
    description,
    craftsmanship,
    "image": coalesce(conceptImage, image),
    imageUrl,
    votesCount
  }
`);

export const SUBMISSIONS_QUERY = defineQuery(`
  *[_type == "creatorSubmission"] | order(_createdAt desc) {
    _id,
    title,
    creatorName,
    creatorHandle,
    category,
    craftsmanshipNotes,
    "image": coalesce(mockupImage, image),
    imageUrl,
    "createdAt": coalesce(createdAt, _createdAt),
    status
  }
`);

export const WAITLIST_BY_UID_QUERY = defineQuery(`
  *[_type == "waitlistEntry" && (firebaseUid == $uid || uid == $uid || email == $email)][0] {
    _id,
    email,
    name,
    "uid": coalesce(firebaseUid, uid),
    position,
    "totalInQueue": coalesce(totalInQueue, position + 14),
    status,
    accessCode,
    "joinedAt": coalesce(joinedAt, _createdAt)
  }
`);
