import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT_DIR =
  'C:\\Users\\arjun\\.gemini\\antigravity\\brain\\5bcecdda-732b-4f1f-bfef-2b71f204bf60';
const TARGET_DIR = path.resolve(__dirname, '..', 'web', 'public', 'images');

// Map generated artifact images to both light-editorial filenames and legacy filenames
const ASSET_MAP = [
  // Primary light-editorial gallery filenames
  ['knitx_logo_1795283091621.jpg', 'knitx-logo-light.jpg'],
  ['hero_monsoon_1795283101171.jpg', 'hero-editorial-light.jpg'],
  ['piece_1of1_kali_1795283158050.jpg', 'look-1of1-jacket.jpg'],
  ['piece_1of1_monolith_1795283169751.jpg', 'look-1of1-knit.jpg'],
  ['look_batch_hoodie_1795284790655.jpg', 'look-batch-hoodie.jpg'],
  ['piece_batch_embroidery_1795283152535.jpg', 'look-batch-tee.jpg'],
  ['piece_mystery_silhouette_1795283115083.jpg', 'look-mystery-veil.jpg'],
  ['atelier_craft_1795283161827.jpg', 'atelier-daylight.jpg'],

  // Backwards-compatible aliases
  ['knitx_logo_1795283091621.jpg', 'knitx-logo.jpg'],
  ['hero_monsoon_1795283101171.jpg', 'hero-monsoon.jpg'],
  ['piece_1of1_kali_1795283158050.jpg', 'piece-1of1-kali.jpg'],
  ['piece_1of1_monolith_1795283169751.jpg', 'piece-1of1-monolith.jpg'],
  ['look_batch_hoodie_1795284790655.jpg', 'piece-batch-puff.jpg'],
  ['piece_batch_embroidery_1795283152535.jpg', 'piece-batch-embroidery.jpg'],
  ['piece_mystery_silhouette_1795283115083.jpg', 'piece-mystery-silhouette.jpg'],
  ['atelier_craft_1795283161827.jpg', 'atelier-craft.jpg'],
];

fs.mkdirSync(TARGET_DIR, { recursive: true });

let copied = 0;
for (const [srcName, destName] of ASSET_MAP) {
  const srcPath = path.join(ARTIFACT_DIR, srcName);
  const destPath = path.join(TARGET_DIR, destName);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    const pngAlias = destPath.replace(/\.jpg$/, '.png');
    fs.copyFileSync(srcPath, pngAlias);
    console.log(`[KNITX ASSETS] Synced -> ${destName}`);
    copied++;
  } else {
    console.warn(`[KNITX ASSETS] Missing source: ${srcPath}`);
  }
}

console.log(`[KNITX ASSETS] Done (${copied}/${ASSET_MAP.length} assets ready in web/public/images).`);
