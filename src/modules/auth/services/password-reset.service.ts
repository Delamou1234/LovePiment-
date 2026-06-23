import { customerAuthRepository } from '../repository/customer-auth.repository';
import { passwordResetRepository } from '../repository/password-reset.repository';
import { buildPasswordResetEmail } from '../email/password-reset.template';
import {
  generateResetCode,
  hashResetCode,
  isValidResetCodeFormat,
} from '@/shared/lib/auth/reset-code';
import { hashPassword } from '@/shared/lib/auth/password';
import { sendEmail } from '@/shared/lib/email/mailer';

const CODE_TTL_MS = 15 * 60 * 1000;

const GENERIC_SUCCESS =
  'Si un compte existe avec cette adresse, vous recevrez un code à 8 chiffres par e-mail.';

export class PasswordResetService {
  async demanderCode(email: string): Promise<{ message: string }> {
    const normalized = email.trim().toLowerCase();
    const customer = await customerAuthRepository.trouverParEmail(normalized);

    if (!customer) {
      return { message: GENERIC_SUCCESS };
    }

    const code = generateResetCode();
    const codeHash = hashResetCode(code);
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await passwordResetRepository.supprimerActifsPourClient(customer.id);
    await passwordResetRepository.creer(customer.id, codeHash, expiresAt);

    const { subject, html, text } = buildPasswordResetEmail({
      nom: customer.nom,
      code,
    });

    try {
      await sendEmail({
        to: customer.email,
        subject,
        html,
        text,
      });
    } catch (err) {
      console.error('[PasswordReset] E-mail non envoyé:', err);
      if (process.env.NODE_ENV !== 'production') {
        console.info('[PasswordReset] Code de dev (échec SMTP) :', code);
      }
      throw new Error(
        "Impossible d'envoyer l'e-mail. Vérifiez la configuration SMTP ou réessayez plus tard.",
      );
    }

    return { message: GENERIC_SUCCESS };
  }

  async verifierCode(email: string, code: string): Promise<'ok' | 'invalid'> {
    if (!isValidResetCodeFormat(code)) return 'invalid';

    const row = await passwordResetRepository.trouverValideParEmailEtCode(
      email,
      hashResetCode(code),
    );
    if (!row) return 'invalid';

    await passwordResetRepository.marquerVerifie(row.id);
    return 'ok';
  }

  async reinitialiserMotDePasse(
    email: string,
    code: string,
    nouveauMotDePasse: string,
  ): Promise<'ok' | 'invalid'> {
    if (!isValidResetCodeFormat(code)) return 'invalid';

    const row = await passwordResetRepository.trouverValideParEmailEtCode(
      email,
      hashResetCode(code),
    );
    if (!row?.verifiedAt) return 'invalid';

    await customerAuthRepository.definirMotDePasse(row.customerId, nouveauMotDePasse);
    await passwordResetRepository.marquerUtilise(row.id);

    return 'ok';
  }
}

export const passwordResetService = new PasswordResetService();
