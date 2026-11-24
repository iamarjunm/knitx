import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WEB_SRC = path.join(ROOT, 'web', 'src');
const BACKUP_ROOT = path.join(ROOT, 'backup-versions');

/**
 * Archives legacy UI versions (V1-V11) cleanly into /backup-versions
 * so they remain preserved in git/codebase without cluttering the live Next.js App Router.
 */
const TARGETS = [
  // Old version routes
  ['app/v2', 'app/v2'],
  ['app/v3', 'app/v3'],
  ['app/v4', 'app/v4'],
  ['app/v5', 'app/v5'],
  ['app/v6', 'app/v6'],
  ['app/v7', 'app/v7'],
  ['app/v8', 'app/v8'],
  ['app/v9', 'app/v9'],
  ['app/v10', 'app/v10'],
  ['app/v11', 'app/v11'],
  ['app/v12', 'app/v12'],
  ['app/vault', 'app/vault'],

  // Old version component folders
  ['components/v2', 'components/v2'],
  ['components/v3', 'components/v3'],
  ['components/v4', 'components/v4'],
  ['components/v5', 'components/v5'],
  ['components/v6', 'components/v6'],
  ['components/v7', 'components/v7'],
  ['components/v8', 'components/v8'],
  ['components/v9', 'components/v9'],
  ['components/v10', 'components/v10'],
  ['components/v11', 'components/v11'],
  ['components/v12', 'components/v12'],

  // Legacy V1 standalone chrome/home components (replaced by Flagship V12 main)
  ['components/HomeClient.tsx', 'components/v1/HomeClient.tsx'],
  ['components/VaultClient.tsx', 'components/v1/VaultClient.tsx'],
  ['components/VoteClient.tsx', 'components/v1/VoteClient.tsx'],
  ['components/SubmitClient.tsx', 'components/v1/SubmitClient.tsx'],
  ['components/AtelierClient.tsx', 'components/v1/AtelierClient.tsx'],
  ['components/Navbar.tsx', 'components/v1/Navbar.tsx'],
  ['components/Footer.tsx', 'components/v1/Footer.tsx'],
  ['components/VersionSwitcher.tsx', 'components/v1/VersionSwitcher.tsx'],
];

let moved = 0;

for (const [srcRel, destRel] of TARGETS) {
  const srcAbs = path.join(WEB_SRC, srcRel);
  const destAbs = path.join(BACKUP_ROOT, destRel);

  if (!fs.existsSync(srcAbs)) {
    continue;
  }

  fs.mkdirSync(path.dirname(destAbs), { recursive: true });

  if (fs.existsSync(destAbs)) {
    fs.rmSync(destAbs, { recursive: true, force: true });
  }

  fs.cpSync(srcAbs, destAbs, { recursive: true });
  fs.rmSync(srcAbs, { recursive: true, force: true });
  console.log(`[KNITX BACKUP] Archived web/src/${srcRel} -> backup-versions/${destRel}`);
  moved++;
}

console.log(`[KNITX BACKUP] Complete (${moved} legacy items archived in backup-versions/).`);
