type PasswordResetEmailData = {
  nom: string;
  code: string;
};

export function buildPasswordResetEmail(data: PasswordResetEmailData) {
  const subject = 'Votre code de réinitialisation — KabiShop';

  const html = `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:Inter,Segoe UI,sans-serif;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="background:#4a5240;padding:24px;color:#fff;">
        <div style="font-size:18px;font-weight:700;">KabiShop</div>
        <div style="font-size:13px;opacity:0.85;margin-top:4px;">Code de réinitialisation</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 16px;font-size:15px;color:#18181b;">Bonjour ${escapeHtml(data.nom)},</p>
        <p style="margin:0 0 20px;font-size:14px;color:#3f3f46;line-height:1.6;">
          Voici votre code à 8 chiffres pour réinitialiser votre mot de passe.
          Il expire dans <strong>15 minutes</strong>.
        </p>
        <p style="margin:0 0 24px;text-align:center;">
          <span style="display:inline-block;background:#faf7f2;border:2px solid #4a5240;border-radius:12px;padding:16px 32px;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#4a5240;font-family:monospace;">
            ${data.code}
          </span>
        </p>
        <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.5;">
          Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail. Votre mot de passe restera inchangé.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Bonjour ${data.nom},`,
    '',
    'Votre code de réinitialisation KabiShop :',
    data.code,
    '',
    'Ce code expire dans 15 minutes.',
    '',
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
  ].join('\n');

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
