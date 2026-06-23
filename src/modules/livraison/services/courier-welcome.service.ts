import { getAppUrl } from '@/shared/lib/app-url';
import { sendEmail } from '@/shared/lib/email/mailer';
import { buildCourierWelcomeEmail } from '../email/courier-welcome.template';

export async function envoyerEmailBienvenueLivreur(data: {
  nom: string;
  email: string;
  password: string;
  telephone: string;
  commune?: string | null;
  typeEngin?: string | null;
}) {
  const loginUrl = `${getAppUrl()}/connexion?redirect=${encodeURIComponent('/livreur')}`;
  const { subject, html, text } = buildCourierWelcomeEmail({
    ...data,
    loginUrl,
  });

  await sendEmail({
    to: data.email,
    subject,
    html,
    text,
  });
}
