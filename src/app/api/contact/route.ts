import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { contactService } from '@/modules/contact/services/contact.service';
import { CONTACT_SUJETS } from '@/modules/contact/types';
import { getSession } from '@/shared/lib/auth/session';

const sujetValues = CONTACT_SUJETS.map((s) => s.value) as [string, ...string[]];

const contactSchema = z.object({
  nom: z.string().min(2, 'Nom trop court').max(100),
  email: z.string().email('E-mail invalide'),
  telephone: z.string().max(30).optional(),
  sujet: z.enum(sujetValues),
  message: z.string().min(10, 'Message trop court').max(5000),
});

/** POST /api/contact */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Données invalides' },
        { status: 400 },
      );
    }

    const session = await getSession();
    const customerId = session?.role === 'customer' ? session.id : undefined;

    const message = await contactService.envoyerMessage({
      ...parsed.data,
      customerId,
    });

    return NextResponse.json(
      { message: 'Votre message a bien été envoyé. Nous vous répondrons rapidement.', contact: message },
      { status: 201 },
    );
  } catch (err) {
    console.error('[Contact API]', err);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
