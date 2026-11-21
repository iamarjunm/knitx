# KNITX // ULTRA-EXCLUSIVE INDIAN STREETWEAR DROP PLATFORM

KNITX is a scarcity-driven streetwear drop platform built as a clean two-app monorepo:

- `studio/` — Standalone **Sanity v3 Studio** (`projectId: ti0l507p`, `dataset: production`) managing drops, Vault pieces, mystery silhouettes, waitlist queues, community design voting, creator submissions, and sample-first Razorpay orders.
- `web/` — **Next.js** storefront with Firebase Auth, exclusive Vault access, 50% revealed / 50% mystery drop teasers, Community Arena voting, and Razorpay INR checkout.

---

## Scarcity Model

| Tier | Allocation | Price Band (INR) | Craft Standard |
| --- | --- | --- | --- |
| **Small-Batch Pieces** | 3–4 units per design | ₹2,500 – ₹4,000 | Heavyweight 400–520 GSM, numbered woven tags, sample-first production |
| **One-of-One Collector's** | 1 unit in existence | ₹5,000 – ₹10,000+ | Bespoke handwork, archival embroidery/dye, certificate of singularity |

---

## 1. Prerequisites & Install (Git Bash / Terminal)

Ensure **Node.js 18.17+** (or Node 20 LTS) is installed, then open **Git Bash** in the repository root (`knitx/`):

```bash
# Install dependencies for both Studio and Web
npm run install:all
```

Or install individually:

```bash
cd studio && npm install
cd ../web && npm install
```

---

## 2. Environment Variables

### A. Sanity Studio (`studio/.env`)

Copy `studio/.env.example` to `studio/.env` and add a **Sanity API Write Token** (Sanity Manage → Project `ti0l507p` → API → Tokens → Add API token with **Editor** permissions):

```env
SANITY_STUDIO_PROJECT_ID=ti0l507p
SANITY_STUDIO_DATASET=production
SANITY_API_WRITE_TOKEN=sk_your_sanity_editor_write_token
```

### B. Web App (`web/.env.local`)

Copy `web/.env.example` to `web/.env.local` and populate:

```env
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=ti0l507p
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=sk_your_sanity_editor_write_token

# Firebase Auth (Web App Config from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Razorpay Test Keys (Razorpay Dashboard → Test Mode → API Keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
```

> **CORS Note:** In [sanity.io/manage](https://www.sanity.io/manage) for project `ti0l507p` → **API → CORS origins**, add:
> - `http://localhost:3000` (Allow credentials)
> - `http://localhost:3333` (Allow credentials)

---

## 3. Seed Drop 001 ("MONSOON CONCRETE")

With `SANITY_API_WRITE_TOKEN` set in `studio/.env` (or exported in your shell), run:

```bash
npm run seed:studio
```

Or directly inside `studio/`:

```bash
cd studio
npx tsx scripts/seed.ts
```

This idempotently seeds (`createOrReplace`) the following documents into dataset `production`:
- **Drop 001 — MONSOON CONCRETE** (`phase: waitlist`)
- **10 Vault Pieces**:
  - **2 One-of-One Collector's Pieces** (₹7,500 and ₹9,800)
  - **8 Small-Batch Pieces** (₹2,600 – ₹3,950)
  - **5 Revealed + 5 Mystery Silhouettes** (`isMystery: true`)
- **6 Drop 002 Voting Candidates** (`designVoteCandidate`)
- **3 Sample Creator Submissions** (`creatorSubmission`)
- **Site Settings** singleton (`_id: siteSettings`) linked to Drop 001

---

## 4. Run Studio & Web Side by Side

Open two Git Bash terminals in `knitx/`:

**Terminal 1 — Sanity Studio (`http://localhost:3333`):**
```bash
npm run dev:studio
```

**Terminal 2 — Next.js Web Storefront (`http://localhost:3000`):**
```bash
npm run dev:web
```

---

## 5. Deploying Sanity Studio

To host the standalone Studio on Sanity's CDN (`*.sanity.studio`):

```bash
npm run deploy:studio
```
# knitx
