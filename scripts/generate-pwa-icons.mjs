/**
 * Génère les icônes PWA (192, 512, maskable, Apple) depuis les SVG sources.
 * Usage : npm run icons:pwa
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const iconsDir = path.join(root, 'public', 'icons');

const jobs = [
  { input: 'source-app-icon.svg', output: 'icon-192.png', size: 192 },
  { input: 'source-app-icon.svg', output: 'icon-512.png', size: 512 },
  { input: 'source-maskable.svg', output: 'icon-maskable-512.png', size: 512 },
  { input: 'source-app-icon.svg', output: 'apple-touch-icon.png', size: 180 },
];

async function main() {
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  for (const job of jobs) {
    const inputPath = path.join(iconsDir, job.input);
    const outputPath = path.join(iconsDir, job.output);
    await sharp(inputPath)
      .resize(job.size, job.size, { fit: 'cover' })
      .png({ compressionLevel: 9, quality: 100 })
      .toFile(outputPath);
    console.log(`✓ ${job.output} (${job.size}px)`);
  }

  // Copie racine pour compatibilité Apple / favicons
  await sharp(path.join(iconsDir, 'source-app-icon.svg'))
    .resize(512, 512)
    .png()
    .toFile(path.join(root, 'public', 'icon.png'));

  console.log('✓ public/icon.png');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
