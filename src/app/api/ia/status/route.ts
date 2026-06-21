import { NextResponse } from 'next/server';
import { isGeminiConfigured, getGeminiModel, verifierCleGemini } from '@/shared/lib/gemini/client';

/** GET /api/ia/status — vérifie si Gemini est configuré et si la clé est valide */
export async function GET() {
  const configured = isGeminiConfigured();
  if (!configured) {
    return NextResponse.json({
      configured: false,
      valid: false,
      model: getGeminiModel(),
      error: 'GEMINI_API_KEY manquante dans .env.local',
    });
  }

  const check = await verifierCleGemini();

  return NextResponse.json({
    configured: true,
    valid: check.ok,
    invalidKey: check.invalidKey ?? false,
    model: getGeminiModel(),
    error: check.error,
  });
}
