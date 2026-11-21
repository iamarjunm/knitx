import fs from 'node:fs'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const studioRoot = path.resolve(__dirname, '..')
const monorepoRoot = path.resolve(studioRoot, '..')

function parseEnvFile(filePath) {
  const vars = {}
  if (!fs.existsSync(filePath)) return vars
  const raw = fs.readFileSync(filePath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    vars[key] = val
  }
  return vars
}

const envVars = {
  ...process.env,
  ...parseEnvFile(path.join(studioRoot, '.env')),
  ...parseEnvFile(path.join(studioRoot, '.env.local')),
}

if (!envVars.SANITY_AUTH_TOKEN && envVars.SANITY_API_WRITE_TOKEN) {
  envVars.SANITY_AUTH_TOKEN = envVars.SANITY_API_WRITE_TOKEN
}

function run(cmd, args, cwd, label) {
  console.log(`\n[KNITX PUBLISH] ${label}...`)
  const res = spawnSync(cmd, args, {
    cwd,
    env: envVars,
    stdio: 'inherit',
    shell: true,
  })
  if (res.status !== 0) {
    console.error(`[KNITX PUBLISH] Step failed: ${label} (exit code ${res.status})`)
    process.exit(res.status ?? 1)
  }
}

// 1. Sync generated images into web/public/images
run('node', ['scripts/sync-assets.mjs'], monorepoRoot, 'Syncing generated KNITX visuals')

// 2. Deploy all 7 schemas to Sanity project ti0l507p
run('npx', ['sanity', 'schema', 'deploy'], studioRoot, 'Publishing Sanity schemas (ti0l507p)')

// 3. Seed Drop 001, 10 products, 6 vote candidates, 3 submissions, siteSettings + CDN assets
run('npx', ['tsx', 'scripts/seed.ts'], studioRoot, 'Uploading CDN assets & seeding production dataset')

console.log('\n[KNITX PUBLISH] All schemas published and production dataset seeded cleanly!\n')
