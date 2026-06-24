type CourierWelcomeEmailData = {
  nom: string;
  email: string;
  password: string;
  telephone: string;
  commune?: string | null;
  typeEngin?: string | null;
  loginUrl: string;
};

const ENGIN_LABELS: Record<string, string> = {
  MOTO: 'Moto',
  VOITURE: 'Voiture',
  VELO: 'Vélo',
  AUTRE: 'Autre',
};

export function buildCourierWelcomeEmail(data: CourierWelcomeEmailData) {
  const engin = data.typeEngin ? (ENGIN_LABELS[data.typeEngin] ?? data.typeEngin) : null;
  const subject = 'Votre compte livreur Love Piment& — identifiants de connexion';

  const html = `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:Inter,Segoe UI,sans-serif;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="background:#4a5240;padding:24px;color:#fff;">
        <div style="font-size:18px;font-weight:700;">Love Piment&</div>
        <div style="font-size:13px;opacity:0.85;margin-top:4px;">Espace livreur</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 16px;font-size:15px;color:#18181b;">Bonjour ${escapeHtml(data.nom)},</p>
        <p style="margin:0 0 20px;font-size:14px;color:#3f3f46;line-height:1.6;">
          Votre compte livreur Love Piment& a été créé. Voici vos identifiants pour accéder à vos tournées et livraisons.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:14px 16px;font-size:13px;color:#52525b;"><strong>E-mail</strong><br>${escapeHtml(data.email)}</td></tr>
          <tr><td style="padding:0 16px 14px;font-size:13px;color:#52525b;"><strong>Mot de passe</strong><br><span style="font-family:monospace;font-size:15px;color:#18181b;">${escapeHtml(data.password)}</span></td></tr>
          <tr><td style="padding:0 16px 14px;font-size:13px;color:#52525b;"><strong>Téléphone enregistré</strong><br>${escapeHtml(data.telephone)}</td></tr>
          ${engin ? `<tr><td style="padding:0 16px 14px;font-size:13px;color:#52525b;"><strong>Engin</strong><br>${escapeHtml(engin)}</td></tr>` : ''}
          ${data.commune ? `<tr><td style="padding:0 16px 14px;font-size:13px;color:#52525b;"><strong>Commune</strong><br>${escapeHtml(data.commune)}</td></tr>` : ''}
        </table>
        <p style="margin:0 0 20px;text-align:center;">
          <a href="${escapeHtml(data.loginUrl)}" style="display:inline-block;background:#4a5240;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">
            Se connecter — Espace livreur
          </a>
        </p>
        <p style="margin:0 0 12px;font-size:13px;color:#3f3f46;line-height:1.6;">
          <strong>Important :</strong> changez votre mot de passe après la première connexion si possible.
          Pour chaque livraison en espèces, vous devez signaler si le client a payé.
        </p>
        <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.5;">
          Si vous n'attendiez pas ce compte, contactez l'administration Love Piment&.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Bonjour ${data.nom},`,
    '',
    'Votre compte livreur Love Piment& a été créé.',
    '',
    `E-mail : ${data.email}`,
    `Mot de passe : ${data.password}`,
    `Téléphone : ${data.telephone}`,
    engin ? `Engin : ${engin}` : '',
    data.commune ? `Commune : ${data.commune}` : '',
    '',
    `Connexion : ${data.loginUrl}`,
    '',
    'Pour chaque livraison en espèces, signalez si le client a payé.',
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
