#!/usr/bin/env node
/**
 * Vérifie que Orange Money est correctement configuré avant déploiement.
 * Usage : node scripts/verify-orange-money.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function chargerEnv() {
  for (const fichier of ['.env.local', '.env']) {
    const chemin = resolve(root, fichier);
    if (!existsSync(chemin)) continue;
    const contenu = readFileSync(chemin, 'utf8');
    for (const ligne of contenu.split('\n')) {
      const trimmed = ligne.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const cle = trimmed.slice(0, eq).trim();
      let valeur = trimmed.slice(eq + 1).trim();
      if (
        (valeur.startsWith('"') && valeur.endsWith('"')) ||
        (valeur.startsWith("'") && valeur.endsWith("'"))
      ) {
        valeur = valeur.slice(1, -1);
      }
      if (!process.env[cle]) process.env[cle] = valeur;
    }
  }
}

chargerEnv();

const manques = [];
const avertissements = [];

function requis(nom) {
  const v = process.env[nom]?.trim();
  if (!v) manques.push(nom);
  return v;
}

const clientId = requis('ORANGE_MONEY_CLIENT_ID');
const clientSecret = requis('ORANGE_MONEY_CLIENT_SECRET');
const merchantKey = requis('ORANGE_MONEY_MERCHANT_KEY');
const countryCode = process.env.ORANGE_MONEY_COUNTRY_CODE?.trim() || 'gn';
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');

if (!appUrl) {
  manques.push('NEXT_PUBLIC_APP_URL');
} else {
  if (/localhost|127\.0\.0\.1/i.test(appUrl)) {
    avertissements.push(
      'NEXT_PUBLIC_APP_URL pointe vers localhost — Orange Money exige une URL publique HTTPS.',
    );
  } else if (!/^https:\/\//i.test(appUrl)) {
    manques.push('NEXT_PUBLIC_APP_URL (doit être en https://)');
  }
}

if (countryCode !== 'dev' && countryCode !== 'gn') {
  avertissements.push(
    `ORANGE_MONEY_COUNTRY_CODE="${countryCode}" — attendu "dev" (sandbox) ou "gn" (production Guinée).`,
  );
}

console.log('\n=== Vérification Orange Money — Love Piment& ===\n');
console.log(`  Client ID     : ${clientId ? `${clientId.slice(0, 6)}…` : '❌ manquant'}`);
console.log(`  Client Secret : ${clientSecret ? '✅ renseigné' : '❌ manquant'}`);
console.log(`  Merchant Key  : ${merchantKey ? '✅ renseigné' : '❌ manquant'}`);
console.log(`  Pays / env    : ${countryCode}`);
console.log(`  App URL       : ${appUrl || '❌ manquant'}`);
console.log(`  Webhook       : ${appUrl ? `${appUrl}/api/webhook-orange-money` : '—'}`);
console.log(`  Return URL    : ${appUrl ? `${appUrl}/commande/confirmation?id=<commandeId>` : '—'}`);

if (avertissements.length) {
  console.log('\n⚠️  Avertissements :');
  for (const msg of avertissements) console.log(`   • ${msg}`);
}

if (manques.length) {
  console.log('\n❌ Configuration incomplète. Variables manquantes :');
  for (const m of manques) console.log(`   • ${m}`);
  console.log('\nRenseignez ces valeurs dans .env.local puis relancez ce script.\n');
  process.exit(1);
}

console.log('\n✅ Configuration Orange Money prête.\n');
console.log('Prochaines étapes :');
console.log('  1. npm run db:migrate');
console.log('  2. Déployer avec NEXT_PUBLIC_APP_URL en HTTPS');
console.log('  3. Tester un paiement sandbox (ORANGE_MONEY_COUNTRY_CODE=dev)\n');
