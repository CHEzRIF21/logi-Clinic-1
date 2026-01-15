import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const viteCacheDir = path.join(projectRoot, 'node_modules', '.vite');

try {
  if (fs.existsSync(viteCacheDir)) {
    fs.rmSync(viteCacheDir, { recursive: true, force: true });
    // eslint-disable-next-line no-console
    console.log(`[ok] Cache Vite supprimé: ${viteCacheDir}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[skip] Aucun cache Vite trouvé: ${viteCacheDir}`);
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.error(`[error] Impossible de supprimer le cache Vite: ${viteCacheDir}`);
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
}

