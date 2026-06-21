import { parse } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const PLACEHOLDER_KEYS = new Set([
  '',
  'VOTRE_CLE_ICI',
  'your_api_key_here',
  'xxx',
]);

function isValidKey(key: string | undefined): key is string {
  return Boolean(key && !PLACEHOLDER_KEYS.has(key));
}

/** Lit la clé directement depuis .env.local (fiable même si process.env est obsolète). */
function readKeyFromEnvLocal(): string | undefined {
  const localPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(localPath)) return undefined;

  try {
    const parsed = parse(readFileSync(localPath, 'utf8'));
    const candidates = [
      parsed.GEMINI_API_KEY,
      parsed.GOOGLE_GENERATIVE_AI_API_KEY,
      parsed.GOOGLE_API_KEY,
    ];
    for (const c of candidates) {
      const trimmed = c?.trim();
      if (isValidKey(trimmed)) return trimmed;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function getGeminiApiKey(): string | undefined {
  const fromProcess = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_API_KEY,
  ]
    .map((v) => v?.trim())
    .find(isValidKey);

  if (fromProcess) return fromProcess;

  const fromFile = readKeyFromEnvLocal();
  if (fromFile) {
    // Synchronise process.env pour les autres appels du même process
    process.env.GEMINI_API_KEY = fromFile;
    return fromFile;
  }

  return undefined;
}

export function getGeminiModel(): string {
  const fromProcess = process.env.GEMINI_MODEL?.trim();
  if (fromProcess) return fromProcess;

  const localPath = resolve(process.cwd(), '.env.local');
  if (existsSync(localPath)) {
    try {
      const parsed = parse(readFileSync(localPath, 'utf8'));
      if (parsed.GEMINI_MODEL?.trim()) return parsed.GEMINI_MODEL.trim();
    } catch {
      // ignore
    }
  }

  return 'gemini-2.0-flash';
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}
