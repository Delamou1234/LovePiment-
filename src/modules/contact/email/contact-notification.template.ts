import { labelSujet, type ContactSubjectKey } from '../types';

type ContactEmailData = {
  nom: string;
  email: string;
  telephone: string | null;
  sujet: ContactSubjectKey;
  message: string;
  adminUrl: string;
};

export function buildContactNotificationEmail(data: ContactEmailData) {
  const sujetLabel = labelSujet(data.sujet);
  const subject = `[Love Piment& Contact] ${sujetLabel} — ${data.nom}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:Inter,Segoe UI,sans-serif;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="background:#4a5240;padding:24px;color:#fff;">
        <div style="font-size:18px;font-weight:700;">Nouveau message de contact</div>
        <div style="font-size:13px;opacity:0.85;margin-top:4px;">${sujetLabel}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 8px;font-size:12px;color:#71717a;text-transform:uppercase;">Expéditeur</p>
        <p style="margin:0 0 16px;font-size:15px;color:#18181b;"><strong>${data.nom}</strong><br>
        <a href="mailto:${data.email}" style="color:#4a5240;">${data.email}</a>
        ${data.telephone ? `<br>${data.telephone}` : ''}</p>
        <p style="margin:0 0 8px;font-size:12px;color:#71717a;text-transform:uppercase;">Message</p>
        <div style="padding:16px;background:#faf7f2;border-radius:8px;font-size:14px;color:#3f3f46;white-space:pre-wrap;">${escapeHtml(data.message)}</div>
        <p style="margin:24px 0 0;text-align:center;">
          <a href="${data.adminUrl}" style="display:inline-block;background:#4a5240;color:#faf7f2;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            Voir dans l'admin
          </a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Nouveau message de contact — ${sujetLabel}`,
    '',
    `De : ${data.nom}`,
    `E-mail : ${data.email}`,
    data.telephone ? `Téléphone : ${data.telephone}` : '',
    '',
    'Message :',
    data.message,
    '',
    `Admin : ${data.adminUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, html, text };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
