import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { getGeminiApiKey, getGeminiModel, isGeminiConfigured } from './env';

export { isGeminiConfigured, getGeminiApiKey, getGeminiModel };

export class GeminiApiError extends Error {
  invalidKey: boolean;

  constructor(message: string, invalidKey = false) {
    super(message);
    this.name = 'GeminiApiError';
    this.invalidKey = invalidKey;
  }
}

function isInvalidKeyError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return (
    text.includes('API key not valid') ||
    text.includes('API_KEY_INVALID') ||
    text.includes('API key expired')
  );
}

function wrapGeminiError(error: unknown): never {
  if (isInvalidKeyError(error)) {
    throw new GeminiApiError(
      'Clé API Gemini invalide. Créez-en une nouvelle sur https://aistudio.google.com/apikey',
      true,
    );
  }
  throw error instanceof Error ? error : new Error(String(error));
}

const MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

function getModelWithFallback(preferred?: string) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new GeminiApiError('GEMINI_API_KEY manquant dans .env.local');
  }

  const models = [
    preferred ?? getGeminiModel(),
    ...MODEL_FALLBACKS,
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  const genAI = new GoogleGenerativeAI(apiKey);
  return { genAI, models };
}

async function generateWithFallback(
  buildRequest: (model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>) => Promise<{ response: { text: () => string } }>,
): Promise<string> {
  const { genAI, models } = getModelWithFallback();
  let lastError: unknown;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await buildRequest(model);
      return result.response.text().trim();
    } catch (error) {
      lastError = error;
      if (isInvalidKeyError(error)) wrapGeminiError(error);
      console.warn(`[Gemini] modèle ${modelName} indisponible, essai suivant…`);
    }
  }

  wrapGeminiError(lastError);
}

export async function geminiGenerateText(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  try {
    return await generateWithFallback((model) =>
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
    );
  } catch (error) {
    wrapGeminiError(error);
  }
}

export async function geminiGenerateJson<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T | null> {
  try {
    const raw = await geminiGenerateText(
      `${systemPrompt}\n\nRéponds UNIQUEMENT avec un JSON valide, sans markdown ni texte autour.`,
      userPrompt,
    );

    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(cleaned) as T;
    } catch {
      const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!match) return null;
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
  } catch (error) {
    if (error instanceof GeminiApiError) throw error;
    wrapGeminiError(error);
  }
}

export async function geminiAnalyzeImage(
  systemPrompt: string,
  userPrompt: string,
  image: { mimeType: string; data: Buffer },
): Promise<string> {
  const imagePart: Part = {
    inlineData: {
      mimeType: image.mimeType,
      data: image.data.toString('base64'),
    },
  };

  try {
    return await generateWithFallback((model) =>
      model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }, imagePart, { text: userPrompt }],
          },
        ],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    );
  } catch (error) {
    wrapGeminiError(error);
  }
}

/** Teste la clé avec un appel minimal. */
export async function verifierCleGemini(): Promise<{ ok: boolean; invalidKey?: boolean; error?: string }> {
  if (!isGeminiConfigured()) {
    return { ok: false, error: 'GEMINI_API_KEY manquante' };
  }
  try {
    await geminiGenerateText('Réponds en un mot.', 'OK');
    return { ok: true };
  } catch (error) {
    if (error instanceof GeminiApiError && error.invalidKey) {
      return { ok: false, invalidKey: true, error: error.message };
    }
    return { ok: false, error: error instanceof Error ? error.message : 'Erreur Gemini' };
  }
}
