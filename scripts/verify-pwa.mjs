import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'public/sw.js',
  'public/icons/icon-192.png',
  'public/icons/icon-512.png',
  'public/icons/icon-maskable-512.png',
  'public/icons/apple-touch-icon.png',
  'public/icons/source-app-icon.svg',
  'src/app/manifest.ts',
];

let ok = true;

for (const file of requiredFiles) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.error(`✗ Manquant : ${file}`);
    ok = false;
  } else {
    console.log(`✓ ${file}`);
  }
}

const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');
const checks = [
  ['Service worker install', /addEventListener\('install'/],
  ['Service worker fetch', /addEventListener\('fetch'/],
  ['Stratégie navigation hors ligne', /networkFirstNavigation/],
  ['Cache assets Next.js', /\/_next\/static\//],
  ['Cache CSS (cache-first)', /isNextStaticAsset/],
  ['Précache CSS depuis HTML', /precacheLinkedAssetsFromHtml/],
  ['Requêtes RSC Next.js', /isRscRequest/],
  ['Page offline precache', /\/offline/],
];

for (const [label, pattern] of checks) {
  if (pattern.test(sw)) {
    console.log(`✓ ${label}`);
  } else {
    console.error(`✗ ${label}`);
    ok = false;
  }
}

console.log('\nHors ligne (attendu) :');
console.log('  • Pages déjà visitées en ligne : HTML + CSS en cache');
console.log('  • CSS / polices /_next/static/ : cache-first (affichage préservé)');
console.log('  • Accueil / page offline : fallback garanti avec styles');
console.log('  • Panier, commande, API : nécessitent internet');
console.log('  • Première visite sans réseau : page /offline (styles si precache OK)');

process.exit(ok ? 0 : 1);
