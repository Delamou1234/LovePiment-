/**
 * Benchmark upload Cloudinary — exéc : node scripts/benchmark-cloudinary-upload.mjs
 */
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config({ path: '.env.local' });

const SOURCE = 'public/images/newsletter-woman.png';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function ms(start) {
  return Math.round(performance.now() - start);
}

function uploadBuffer(buffer, folder) {
  const t0 = performance.now();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', overwrite: true },
      (err, result) => {
        if (err || !result?.secure_url) reject(err ?? new Error('upload failed'));
        else resolve({ result, durationMs: ms(t0) });
      },
    );
    stream.end(buffer);
  });
}

async function main() {
  const prefix = process.env.CLOUDINARY_FOLDER_PREFIX || 'lovepimente';
  const folder = `${prefix}/misc/benchmark`;

  const original = readFileSync(SOURCE);
  console.log(`\n📷 Image test : ${SOURCE}`);
  console.log(`   Taille originale : ${(original.length / 1024).toFixed(0)} Ko\n`);

  // 1) Compression (comme le navigateur)
  const tCompress = performance.now();
  const compressed = await sharp(original)
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const compressMs = ms(tCompress);
  console.log(`⚡ Compression WebP (max 1920px) : ${compressMs} ms → ${(compressed.length / 1024).toFixed(0)} Ko`);

  // 2) Signature (comme /api/admin/media/sign)
  const tSign = performance.now();
  const timestamp = Math.round(Date.now() / 1000);
  const folderPath = folder;
  const signature = cloudinary.utils.api_sign_request({ folder: folderPath, timestamp }, process.env.CLOUDINARY_API_SECRET);
  const signMs = ms(tSign);
  console.log(`🔐 Génération signature      : ${signMs} ms`);

  // 3) Upload direct Cloudinary (fichier compressé — flux optimisé)
  const { result: fastResult, durationMs: fastUploadMs } = await uploadBuffer(compressed, folder);
  console.log(`🚀 Upload direct (compressé) : ${fastUploadMs} ms`);
  console.log(`   URL : ${fastResult.secure_url}`);

  // 4) Comparaison : upload fichier original (ancien flux lent)
  const { result: slowResult, durationMs: slowUploadMs } = await uploadBuffer(original, `${folder}/slow`);
  console.log(`🐢 Upload original (sans opt.) : ${slowUploadMs} ms`);

  const totalFast = compressMs + signMs + fastUploadMs;
  console.log('\n──────────────────────────────────────');
  console.log(`✅ Durée totale flux optimisé : ${totalFast} ms (${(totalFast / 1000).toFixed(2)} s)`);
  console.log(`   dont compression ${compressMs} ms + signature ${signMs} ms + envoi ${fastUploadMs} ms`);
  console.log(`📉 Gain vs original seul     : ${slowUploadMs - fastUploadMs} ms économisés sur l'envoi`);
  console.log('──────────────────────────────────────\n');

  // Nettoyage des images de test sur Cloudinary
  await cloudinary.uploader.destroy(fastResult.public_id, { resource_type: 'image' });
  await cloudinary.uploader.destroy(slowResult.public_id, { resource_type: 'image' });
  console.log('🧹 Image benchmark supprimée de Cloudinary.\n');
}

main().catch((e) => {
  console.error('Erreur:', e.message || e);
  process.exit(1);
});
