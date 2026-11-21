import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@sanity/client'

// Load studio/.env and studio/.env.local if present (without overriding existing env vars)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const studioRoot = path.resolve(__dirname, '..')
const monorepoRoot = path.resolve(studioRoot, '..')

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return
  const raw = fs.readFileSync(filePath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.join(studioRoot, '.env'))
loadEnvFile(path.join(studioRoot, '.env.local'))

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ti0l507p'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN

if (!token) {
  console.error(
    '\n[KNITX SEED] Missing SANITY_API_WRITE_TOKEN.\n' +
    'Add your Sanity Editor token to studio/.env:\n' +
    '  SANITY_API_WRITE_TOKEN=sk...\n',
  )
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-03-01',
  token,
  useCdn: false,
})

type ImageKey =
  | 'hero'
  | 'kali'
  | 'monolith'
  | 'puff'
  | 'embroidery'
  | 'mystery'
  | 'atelier'
  | 'logo'

const LOCAL_IMAGE_SOURCES: Record<ImageKey, string[]> = {
  logo: [
    path.join(monorepoRoot, 'web', 'public', 'images', 'knitx-logo.jpg'),
    'C:\\Users\\arjun\\.gemini\\antigravity\\brain\\5bcecdda-732b-4f1f-bfef-2b71f204bf60\\knitx_logo_1795283091621.jpg',
  ],
  hero: [
    path.join(monorepoRoot, 'web', 'public', 'images', 'hero-monsoon.jpg'),
    'C:\\Users\\arjun\\.gemini\\antigravity\\brain\\5bcecdda-732b-4f1f-bfef-2b71f204bf60\\hero_monsoon_1795283101171.jpg',
  ],
  kali: [
    path.join(monorepoRoot, 'web', 'public', 'images', 'piece-1of1-kali.jpg'),
    'C:\\Users\\arjun\\.gemini\\antigravity\\brain\\5bcecdda-732b-4f1f-bfef-2b71f204bf60\\piece_1of1_kali_1795283158050.jpg',
  ],
  monolith: [
    path.join(monorepoRoot, 'web', 'public', 'images', 'piece-1of1-monolith.jpg'),
    'C:\\Users\\arjun\\.gemini\\antigravity\\brain\\5bcecdda-732b-4f1f-bfef-2b71f204bf60\\piece_1of1_monolith_1795283169751.jpg',
  ],
  puff: [
    path.join(monorepoRoot, 'web', 'public', 'images', 'look-batch-hoodie.jpg'),
    'C:\\Users\\arjun\\.gemini\\antigravity\\brain\\5bcecdda-732b-4f1f-bfef-2b71f204bf60\\look_batch_hoodie_1795284790655.jpg',
    'C:\\Users\\arjun\\.gemini\\antigravity\\brain\\5bcecdda-732b-4f1f-bfef-2b71f204bf60\\piece_batch_puff_1795283098023.jpg',
  ],
  embroidery: [
    path.join(monorepoRoot, 'web', 'public', 'images', 'piece-batch-embroidery.jpg'),
    'C:\\Users\\arjun\\.gemini\\antigravity\\brain\\5bcecdda-732b-4f1f-bfef-2b71f204bf60\\piece_batch_embroidery_1795283152535.jpg',
  ],
  mystery: [
    path.join(monorepoRoot, 'web', 'public', 'images', 'piece-mystery-silhouette.jpg'),
    'C:\\Users\\arjun\\.gemini\\antigravity\\brain\\5bcecdda-732b-4f1f-bfef-2b71f204bf60\\piece_mystery_silhouette_1795283115083.jpg',
  ],
  atelier: [
    path.join(monorepoRoot, 'web', 'public', 'images', 'atelier-craft.jpg'),
    'C:\\Users\\arjun\\.gemini\\antigravity\\brain\\5bcecdda-732b-4f1f-bfef-2b71f204bf60\\atelier_craft_1795283161827.jpg',
  ],
}

interface SanityImageRef {
  _type: 'image'
  asset: { _type: 'reference'; _ref: string }
  alt: string
}

async function uploadAssets(): Promise<Partial<Record<ImageKey, string>>> {
  const uploaded: Partial<Record<ImageKey, string>> = {}
  const keys = Object.keys(LOCAL_IMAGE_SOURCES) as ImageKey[]

  for (const key of keys) {
    const existingPath = LOCAL_IMAGE_SOURCES[key].find((candidate) => fs.existsSync(candidate))
    if (!existingPath) {
      console.warn(`[KNITX SEED] Skipped missing local image for "${key}"`)
      continue
    }

    try {
      const buffer = fs.readFileSync(existingPath)
      const asset = await client.assets.upload('image', buffer, {
        filename: `knitx-${key}.jpg`,
        contentType: 'image/jpeg',
      })
      uploaded[key] = asset._id
      console.log(`[KNITX SEED] Uploaded CDN asset "${key}" -> ${asset._id}`)
    } catch (err) {
      console.warn(`[KNITX SEED] Failed uploading "${key}":`, err)
    }
  }

  return uploaded
}

function makeImageField(
  assets: Partial<Record<ImageKey, string>>,
  key: ImageKey,
  alt: string,
): SanityImageRef | undefined {
  const ref = assets[key]
  if (!ref) return undefined
  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: ref },
    alt,
  }
}

const DROP_001_ID = 'drop-001-monsoon-concrete'
const launchDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

async function seed(): Promise<void> {
  console.log(`\n[KNITX SEED] Connecting to Sanity project "${projectId}" (dataset: "${dataset}")...`)

  const assets = await uploadAssets()

  const drop001 = {
    _id: DROP_001_ID,
    _type: 'drop',
    dropNumber: '001',
    title: 'MONSOON CONCRETE',
    slug: { _type: 'slug', current: 'monsoon-concrete' },
    subtitle: 'Brutalist rain-washed silhouettes engineered in 480–560 GSM Tiruppur loopback.',
    phase: 'waitlist',
    launchDate,
    manifesto:
      'DROP 001 // MONSOON CONCRETE captures the collision of wet basalt, raw brutalist concrete, and Indian handcraft. Every piece is cut sample-first after Vault confirmation—never mass-produced, never restocked. Half the archive is exposed today; the remaining 50% stays sealed in silhouette until the Vault unlocks for verified waitlist members.',
    teaserVideoUrl: '',
    heroImage: makeImageField(assets, 'hero', 'KNITX Drop 001 Monsoon Concrete Hero Editorial'),
    totalSlots: 2500,
    waitlistCount: 1842,
  }

  const mysteryImg = makeImageField(
    assets,
    'mystery',
    'Classified KNITX Drop 001 Mystery Silhouette',
  )

  const products = [
    // === ONE-OF-ONE COLLECTOR'S PIECES (2 total: 1 revealed, 1 mystery) ===
    {
      _id: 'product-kx-001-1of1-01',
      _type: 'product',
      title: 'KALI ARCHIVE BOMBER 01/01',
      slug: { _type: 'slug', current: 'kali-archive-bomber-01-01' },
      serialCode: 'KX-1O1-01',
      drop: { _type: 'reference', _ref: DROP_001_ID },
      tier: 'one-of-one',
      priceInr: 9800,
      totalUnits: 1,
      remainingUnits: 1,
      isMystery: false,
      gsmWeight: '480 GSM Heavy French Terry + Waxed Panels',
      fabric: '100% Organic Tiruppur Loopback Cotton with hand-painted archival patchwork',
      craftsmanship: [
        'Strictly 1 unit in existence — accompanied by signed steel-engraved singularity plate',
        'Hand-painted crimson & bone Devanagari-inspired brutalist strokes',
        'Raw paneled construction with oxidized solid silver hardware',
        'Individually numbered 01/01 woven provenance label',
      ],
      sizes: ['OS'],
      description:
        'An architectural monsoon outer shell built as a singular wearable sculpture. Cut boxy with articulated sleeves, raw seam patchwork, and hand-painted brushstrokes that can never be replicated.',
      mainImage: makeImageField(assets, 'kali', 'KALI ARCHIVE BOMBER 01/01'),
      creatorCredit: 'KNITX STUDIO // INDIA',
      productionDays: 14,
    },
    {
      _id: 'product-kx-001-1of1-02',
      _type: 'product',
      title: 'MONOLITH DISTRESSED KNIT 01/01',
      slug: { _type: 'slug', current: 'monolith-distressed-knit-01-01' },
      serialCode: 'KX-1O1-02',
      drop: { _type: 'reference', _ref: DROP_001_ID },
      tier: 'one-of-one',
      priceInr: 7500,
      totalUnits: 1,
      remainingUnits: 1,
      isMystery: true,
      gsmWeight: '540 GSM 5-Gauge Distressed Cotton Knit',
      fabric: 'Multi-ply combed charcoal & ash cotton yarn with hand-stitched metallic wire threadwork',
      craftsmanship: [
        '1-of-1 Vault Crown Piece — sealed in silhouette until Vault unlock',
        '24 hours of hand-stitched oxidized silver metallic thread motifs',
        'Deliberate raw frayed hems and hand-tacked archival hem passport (NO. 0001/0001)',
        'Delivered in matte-black collector garment box with signed certificate',
      ],
      sizes: ['OS'],
      description:
        'Sealed behind the Mystery Silhouette until your waitlist number is called. Museum-grade avant-garde distressed knitwear engineered as a true one-of-one collector artifact.',
      mainImage: makeImageField(assets, 'monolith', 'MONOLITH DISTRESSED KNIT 01/01'),
      silhouetteImage: mysteryImg,
      creatorCredit: 'KNITX ATELIER × KARIGAR COLLECTIVE',
      productionDays: 16,
    },

    // === SMALL-BATCH PIECES (8 total: 4 revealed, 4 mystery | ₹2,600–₹3,950) ===
    {
      _id: 'product-kx-001-sb-01',
      _type: 'product',
      title: 'MONOLITH 420GSM PUFF HOODIE',
      slug: { _type: 'slug', current: 'monolith-420gsm-puff-hoodie' },
      serialCode: 'KX-SB-01',
      drop: { _type: 'reference', _ref: DROP_001_ID },
      tier: 'small-batch',
      priceInr: 3850,
      totalUnits: 4,
      remainingUnits: 3,
      isMystery: false,
      gsmWeight: '420 GSM Heavy French Terry',
      fabric: '100% Organic Tiruppur Loopback Cotton, Double-Washed & Pre-Shrunk',
      craftsmanship: [
        'Strictly 4 numbered pieces worldwide (01/04 – 04/04 woven hem tag)',
        'Architectural 3D high-density bone & acid-volt puff print across chest and sleeves',
        'Double-layered structured sculptural hood with zero drawcord minimalism',
        'Dropped boxy shoulder cut with heavyweight 2x2 ribbed cuffs',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      description:
        'Engineered to hold a rigid architectural silhouette right off the hanger. Heavy 420 GSM loopback finished with raised industrial puff typography.',
      mainImage: makeImageField(assets, 'puff', 'MONOLITH 420GSM PUFF HOODIE'),
      creatorCredit: 'KNITX STUDIO // INDIA',
      productionDays: 10,
    },
    {
      _id: 'product-kx-001-sb-02',
      _type: 'product',
      title: 'STEPWELL GRID CHAIN-STITCH TEE',
      slug: { _type: 'slug', current: 'stepwell-grid-chain-stitch-tee' },
      serialCode: 'KX-SB-02',
      drop: { _type: 'reference', _ref: DROP_001_ID },
      tier: 'small-batch',
      priceInr: 2600,
      totalUnits: 4,
      remainingUnits: 2,
      isMystery: false,
      gsmWeight: '340 GSM Heavy Combed Jersey',
      fabric: '100% Ring-Spun Washed Charcoal Cotton Jersey, Enzyme Softened',
      craftsmanship: [
        'Strictly 4 units cut sample-first with individually stamped edition label',
        'Dense raised bone-white & crimson chain-stitch stepwell grid embroidery',
        '3.5 cm heavyweight ribbed mock-collar engineered never to lose tension',
        'Boxy cropped architectural silhouette with dropped sleeves',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      description:
        'Heavyweight washed charcoal tee uniting Indian stepwell geometry with industrial chain-stitch embroidery. Soft on skin, sculptural in drape.',
      mainImage: makeImageField(assets, 'embroidery', 'STEPWELL GRID CHAIN-STITCH TEE'),
      creatorCredit: 'KNITX STUDIO // INDIA',
      productionDays: 8,
    },
    {
      _id: 'product-kx-001-sb-03',
      _type: 'product',
      title: 'MONSOON DRAINAGE UTILITY CARGO',
      slug: { _type: 'slug', current: 'monsoon-drainage-utility-cargo' },
      serialCode: 'KX-SB-03',
      drop: { _type: 'reference', _ref: DROP_001_ID },
      tier: 'small-batch',
      priceInr: 3950,
      totalUnits: 3,
      remainingUnits: 2,
      isMystery: false,
      gsmWeight: '380 GSM Ripstop Cotton-Nylon Blend',
      fabric: '72% Cotton / 28% Water-Repellent Technical Ripstop',
      craftsmanship: [
        'Ultra-short 3-unit batch with serialized interior woven passport label',
        'Articulated double-dart knee architecture for wide-leg stacking',
        '6 gusseted storm pockets with matte black paracord cinch toggles at hem',
        'DWR monsoon-mist finish with reinforced bar-tack stress points',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      description:
        'Wide-cut utilitarian trousers built for heavy city downpours. Technical water-shedding ripstop meets sculptural streetwear volume.',
      mainImage: makeImageField(assets, 'puff', 'MONSOON DRAINAGE UTILITY CARGO'),
      creatorCredit: 'KNITX STUDIO LAB',
      productionDays: 12,
    },
    {
      _id: 'product-kx-001-sb-04',
      _type: 'product',
      title: 'STATIC GRID DISTRESSED KNIT CREW',
      slug: { _type: 'slug', current: 'static-grid-distressed-knit-crew' },
      serialCode: 'KX-SB-04',
      drop: { _type: 'reference', _ref: DROP_001_ID },
      tier: 'small-batch',
      priceInr: 3400,
      totalUnits: 4,
      remainingUnits: 4,
      isMystery: false,
      gsmWeight: '460 GSM 5-Gauge Jacquard Cotton Knit',
      fabric: '100% Combed Heavy Multi-Ply Cotton Yarn (Zero Acrylic)',
      craftsmanship: [
        '4-unit small-batch production knit on computerized flat-bed machines',
        'Custom brutalist static-noise jacquard pattern knitted directly into yarn',
        'Deliberate ladder-dropped hem ribs and exposed reverse-linked shoulder seams',
        'Hand-tacked oxidized steel KNITX bar at back neck',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      description:
        'Breathable all-cotton heavy jacquard knitwear designed for cool monsoon nights. Tactile brutalist geometry rendered in charcoal, bone, and wet slate.',
      mainImage: makeImageField(assets, 'monolith', 'STATIC GRID DISTRESSED KNIT CREW'),
      creatorCredit: 'KNITX × AANYA VERMA',
      productionDays: 12,
    },
    {
      _id: 'product-kx-001-sb-05',
      _type: 'product',
      title: 'OXIDIZED REBAR ZIP-UP WORK JACKET',
      slug: { _type: 'slug', current: 'oxidized-rebar-zip-up-work-jacket' },
      serialCode: 'KX-SB-05',
      drop: { _type: 'reference', _ref: DROP_001_ID },
      tier: 'small-batch',
      priceInr: 3900,
      totalUnits: 3,
      remainingUnits: 3,
      isMystery: true,
      gsmWeight: '440 GSM Heavy Duck Canvas',
      fabric: '100% Unbleached Indian Duck Canvas, Rust-Pigment Overdyed',
      craftsmanship: [
        'Mystery Silhouette Piece — 3 units only, unlocked exclusively inside the Vault',
        'Cropped boxy workwear cut with dropped shoulder pleats and storm collar',
        'Hand-sprayed iron-oxide patina echoing exposed monsoon rebar',
        'Heavy-gauge antique gunmetal zipper and triple-needle felled seams',
      ],
      sizes: ['M', 'L', 'XL'],
      description:
        'Redacted from public preview. A cropped heavy duck canvas work jacket overdyed in wet concrete charcoal and subtle oxidized rust undertones.',
      mainImage: makeImageField(assets, 'kali', 'OXIDIZED REBAR ZIP-UP WORK JACKET'),
      silhouetteImage: mysteryImg,
      creatorCredit: 'KNITX STUDIO // INDIA',
      productionDays: 14,
    },
    {
      _id: 'product-kx-001-sb-06',
      _type: 'product',
      title: 'ACID RAIN LAYERED LONG-SLEEVE',
      slug: { _type: 'slug', current: 'acid-rain-layered-long-sleeve' },
      serialCode: 'KX-SB-06',
      drop: { _type: 'reference', _ref: DROP_001_ID },
      tier: 'small-batch',
      priceInr: 2850,
      totalUnits: 4,
      remainingUnits: 4,
      isMystery: true,
      gsmWeight: '310 GSM Thermal Waffle + 280 GSM Jersey',
      fabric: '100% Cotton Double-Layer Construction (Jersey Shell + Waffle Sleeves)',
      craftsmanship: [
        'Mystery Silhouette Piece — 4 units worldwide',
        'Integrated raw-hem thermal waffle undersleeves with thumb-slit cuffs',
        'Hand-tied potassium spray acid wash creating storm-cloud tonal marbling',
        'Reflective 3M micro-typographic spec table along left forearm',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      description:
        'Locked behind the 50% Mystery Veil. A dual-texture layered long-sleeve fusing vintage grunge layering with technical monochrome Indian streetwear.',
      mainImage: makeImageField(assets, 'embroidery', 'ACID RAIN LAYERED LONG-SLEEVE'),
      silhouetteImage: mysteryImg,
      creatorCredit: 'KNITX STUDIO // INDIA',
      productionDays: 10,
    },
    {
      _id: 'product-kx-001-sb-07',
      _type: 'product',
      title: 'CONCRETE SEAM WIDE SWEATPANT',
      slug: { _type: 'slug', current: 'concrete-seam-wide-sweatpant' },
      serialCode: 'KX-SB-07',
      drop: { _type: 'reference', _ref: DROP_001_ID },
      tier: 'small-batch',
      priceInr: 3200,
      totalUnits: 4,
      remainingUnits: 3,
      isMystery: true,
      gsmWeight: '500 GSM Heavy Loopback French Terry',
      fabric: '100% Organic Tiruppur Cotton, Unbrushed Architectural Terry',
      craftsmanship: [
        'Mystery Silhouette Piece — 4 numbered units only',
        'Spiral-twisted exposed overlock leg seams with raw architectural flange',
        'Deep concealed zip pockets with oxidized metal pull tabs',
        'Wide open-hem silhouette engineered to drape cleanly over chunky boots',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      description:
        'Sealed until Vault access. Heavy 500 GSM spiral-seam loungewear re-engineered into crisp sculptural wide-leg trousers.',
      mainImage: makeImageField(assets, 'puff', 'CONCRETE SEAM WIDE SWEATPANT'),
      silhouetteImage: mysteryImg,
      creatorCredit: 'KNITX STUDIO // INDIA',
      productionDays: 10,
    },
    {
      _id: 'product-kx-001-sb-08',
      _type: 'product',
      title: 'DECONSTRUCTED SASHIKO UTILITY VEST',
      slug: { _type: 'slug', current: 'deconstructed-sashiko-utility-vest' },
      serialCode: 'KX-SB-08',
      drop: { _type: 'reference', _ref: DROP_001_ID },
      tier: 'small-batch',
      priceInr: 3650,
      totalUnits: 3,
      remainingUnits: 3,
      isMystery: true,
      gsmWeight: '410 GSM Indigo-Charcoal Sashiko Weave',
      fabric: '100% Heavy Textured Cotton Sashiko Loomed in Gujarat',
      craftsmanship: [
        'Mystery Silhouette Piece — 3 units in existence',
        'Asymmetric chest holster pocket + rear architectural map compartment',
        'Hand-dipped charcoal over-dye over deep indigo warp threads that fade with wear',
        'Adjustable side webbing straps with matte anodized aluminum G-hooks',
      ],
      sizes: ['M', 'L', 'XL'],
      description:
        'Unrevealed Vault piece crafted from heavy textured Sashiko cotton weave. Designed as a modular mid-layer over oversized hoodies or heavyweight tees.',
      mainImage: makeImageField(assets, 'monolith', 'DECONSTRUCTED SASHIKO UTILITY VEST'),
      silhouetteImage: mysteryImg,
      creatorCredit: 'KNITX × ROHAN KULKARNI',
      productionDays: 13,
    },
  ]

  const designVoteCandidates = [
    {
      _id: 'vote-d02-cand-01',
      _type: 'designVoteCandidate',
      title: 'DECCAN BASALT CROPPED BOMBER',
      code: 'D02-V01',
      creatorName: 'Kabir Deshmukh',
      creatorHandle: '@kabir.drapes',
      tierSuggestion: 'one-of-one',
      description:
        'Ultra-cropped heavy nylon-cotton flight jacket featuring hand-pleated volcanic basalt textures across the sleeves and an interior silk-screened Deccan contour map.',
      craftsmanship: ['490 GSM Waxed Twill', 'Hand-Pleated Sleeves', 'Oxidized Brass Zip', 'Quilt Lining'],
      conceptImage: makeImageField(assets, 'kali', 'DECCAN BASALT CROPPED BOMBER'),
      votesCount: 842,
      voterUids: [],
      status: 'voting',
    },
    {
      _id: 'vote-d02-cand-02',
      _type: 'designVoteCandidate',
      title: 'ARCHWAY RELIEF HEAVY HOODIE',
      code: 'D02-V02',
      creatorName: 'Meera Nair',
      creatorHandle: '@meera.textiles',
      tierSuggestion: 'small-batch',
      description:
        'Double-layered 540 GSM charcoal hoodie with tonal trapunto embossed archways inspired by brutalist stone colonnades.',
      craftsmanship: ['540 GSM Loopback', 'Trapunto Relief Embroidery', 'Cold Pigment Wash'],
      conceptImage: makeImageField(assets, 'puff', 'KALA GHODA ARCHITECTURAL HOODIE'),
      votesCount: 718,
      voterUids: [],
      status: 'voting',
    },
    {
      _id: 'vote-d02-cand-03',
      _type: 'designVoteCandidate',
      title: 'NEON MANDI THERMAL MESH KNIT',
      code: 'D02-V03',
      creatorName: 'Zoya Siddiqui',
      creatorHandle: '@zoya.looms',
      tierSuggestion: 'small-batch',
      description:
        'Open-gauge distressed fisherman knit layered over sheer dyed cotton gauze, juxtaposing raw charcoal twine with flashes of acid-volt thread.',
      craftsmanship: ['3-Gauge Distressed Cotton Knit', 'Hand-Dyed Accent Weft', 'Exposed Linking'],
      conceptImage: makeImageField(assets, 'monolith', 'NEON MANDI THERMAL MESH KNIT'),
      votesCount: 626,
      voterUids: [],
      status: 'voting',
    },
    {
      _id: 'vote-d02-cand-04',
      _type: 'designVoteCandidate',
      title: 'CHANDIGARH BRUTALIST CHAIN-STITCH TEE',
      code: 'D02-V04',
      creatorName: 'Devansh Gill',
      creatorHandle: '@devansh.pattern',
      tierSuggestion: 'small-batch',
      description:
        'Boxy 360 GSM tee modeled on Le Corbusier concrete brise-soleil shadows—raised crimson chain-stitch geometry and acid-washed shoulders.',
      craftsmanship: ['360 GSM Heavy Jersey', 'Chain-Stitch Embroidery', 'Enzyme Wash'],
      conceptImage: makeImageField(assets, 'embroidery', 'CHANDIGARH BRUTALIST CHAIN-STITCH TEE'),
      votesCount: 591,
      voterUids: [],
      status: 'voting',
    },
    {
      _id: 'vote-d02-cand-05',
      _type: 'designVoteCandidate',
      title: 'BANYAN ROOT HAND-LOOMED CAPE SHELL',
      code: 'D02-V05',
      creatorName: 'Ananya Chatterjee',
      creatorHandle: '@ananya.archive',
      tierSuggestion: 'one-of-one',
      description:
        'A singular modular poncho-jacket crafted from raw unbleached Kala cotton, overdyed in fermented iron-tannin black with cascading hand-knotted fringe seams.',
      craftsmanship: ['Hand-Loomed Kutch Kala Cotton', 'Iron-Tannin Vat Dye', 'Modular Snap Hood'],
      conceptImage: makeImageField(assets, 'mystery', 'BANYAN ROOT HAND-LOOMED CAPE SHELL'),
      votesCount: 464,
      voterUids: [],
      status: 'voting',
    },
    {
      _id: 'vote-d02-cand-06',
      _type: 'designVoteCandidate',
      title: 'METRO TRANSIT REFLECTIVE BOX TEE',
      code: 'D02-V06',
      creatorName: 'Rishi Menon',
      creatorHandle: '@rishi.grid',
      tierSuggestion: 'small-batch',
      description:
        'Heavy 350 GSM sun-faded tarmac jersey featuring heat-reactive transit schematic graphics that emerge under camera flash and urban streetlights.',
      craftsmanship: ['350 GSM Combed Jersey', '3M Glass-Bead Reflective Print', 'Sun-Bleach Wash'],
      conceptImage: makeImageField(assets, 'embroidery', 'METRO TRANSIT REFLECTIVE BOX TEE'),
      votesCount: 384,
      voterUids: [],
      status: 'voting',
    },
  ]

  const creatorSubmissions = [
    {
      _id: 'submission-sample-01',
      _type: 'creatorSubmission',
      title: 'KONKAN COAST SALT-WASHED DENIM ANORAK',
      creatorName: 'Siddharth Rao',
      creatorHandle: '@sid.constructs',
      email: 'siddharth.rao@example.com',
      category: '1-of-1 Archive Outerwear',
      craftsmanshipNotes:
        '14oz raw indigo-black Indian selvedge denim treated with sea-salt enzyme bath to create crystalline tide-line fading. Half-zip storm placket with oversized front map pouch and oxidized copper rivets.',
      mockupImage: makeImageField(assets, 'kali', 'KONKAN COAST SALT-WASHED DENIM ANORAK'),
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'submission-sample-02',
      _type: 'creatorSubmission',
      title: 'STEPWELL GEOMETRY JACQUARD CARDIGAN',
      creatorName: 'Tara Malhotra',
      creatorHandle: '@tara.knitlab',
      email: 'tara.malhotra@example.com',
      category: 'Distressed Knit',
      craftsmanshipNotes:
        '480 GSM 7-gauge 100% mercerized cotton knit inspired by Chand Baori stepwells. Dropped boxy shoulders, asymmetric horn buttons, and double-ribbed architectural placket.',
      mockupImage: makeImageField(assets, 'monolith', 'STEPWELL GEOMETRY JACQUARD CARDIGAN'),
      status: 'approved_for_vote',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'submission-sample-03',
      _type: 'creatorSubmission',
      title: 'OLD DELHI COPPER-WIRE PATCHWORK HOODIE',
      creatorName: 'Aarav Khanna',
      creatorHandle: '@aarav.atelier',
      email: 'aarav.khanna@example.com',
      category: 'Heavyweight Hoodie',
      craftsmanshipNotes:
        'Heavy 450 GSM loopback hoodie featuring modular elbow panels stitched with oxidized copper metallic thread and 3D puff coordinates. Proposed as a Small-Batch Piece.',
      mockupImage: makeImageField(assets, 'puff', 'OLD DELHI COPPER-WIRE PATCHWORK HOODIE'),
      status: 'selected',
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  const siteSettings = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    brandName: 'KNITX',
    activeDrop: { _type: 'reference', _ref: DROP_001_ID },
    announcementTicker:
      'DROP 001 // MONSOON CONCRETE — WAITLIST OPEN • 50% REVEALED / 50% SEALED IN SILHOUETTE • STRICTLY 1–4 UNITS PER DESIGN • SAMPLE-FIRST INDIAN STREETWEAR',
    instagramUrl: 'https://instagram.com/knitx.archive',
    contactEmail: 'atelier@knitx.in',
  }

  const tx = client.transaction()

  // 1. Seed Drop 001
  tx.createOrReplace(drop001)

  // 2. Seed all 10 Vault Products (2 One-of-One + 8 Small-Batch; 5 Revealed + 5 Mystery)
  for (const item of products) {
    tx.createOrReplace(item)
  }

  // 3. Seed 6 Drop 002 Voting Candidates
  for (const candidate of designVoteCandidates) {
    tx.createOrReplace(candidate)
  }

  // 4. Seed 3 Sample Creator Submissions
  for (const submission of creatorSubmissions) {
    tx.createOrReplace(submission)
  }

  // 5. Seed Site Settings Singleton
  tx.createOrReplace(siteSettings)

  await tx.commit()

  const oneOfOneCount = products.filter((p) => p.tier === 'one-of-one').length
  const smallBatchCount = products.filter((p) => p.tier === 'small-batch').length
  const mysteryCount = products.filter((p) => p.isMystery).length

  console.log('\n[KNITX SEED] Seed completed successfully:')
  console.log(`  • CDN Assets:        ${Object.keys(assets).length} uploaded to cdn.sanity.io`)
  console.log(`  • Drop:              1 (DROP 001 // MONSOON CONCRETE)`)
  console.log(
    `  • Products:          ${products.length} (${oneOfOneCount} One-of-One, ${smallBatchCount} Small-Batch, ${mysteryCount} Mystery Silhouettes)`,
  )
  console.log(`  • Vote Candidates:   ${designVoteCandidates.length} (Drop 002 Arena)`)
  console.log(`  • Submissions:       ${creatorSubmissions.length} (Creator Intake)`)
  console.log(`  • Site Settings:     1 (Singleton linked to Drop 001)\n`)
}

seed().catch((error: unknown) => {
  console.error('[KNITX SEED] Failed to seed dataset:', error)
  process.exit(1)
})
