import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { assistantService } from '@/modules/ia/services/assistant.service';

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  historique: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      }),
    )
    .max(12)
    .optional(),
});

/** POST /api/ia/assistant — chatbot shopping Gemini */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Message invalide' }, { status: 400 });
    }

    const reponse = await assistantService.discuter(
      parsed.data.message,
      parsed.data.historique ?? [],
    );

    return NextResponse.json(reponse);
  } catch (error) {
    console.error('[POST /api/ia/assistant]', error);
    return NextResponse.json(
      { message: 'Assistant temporairement indisponible.' },
      { status: 500 },
    );
  }
}
