import type { DailyDigestData } from '@/modules/admin/services/daily-digest.service';

function formatGn(n: number) {
  return n.toLocaleString('fr-FR') + ' GN';
}

function formatPct(n: number | null) {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n} %`;
}

function kpi(label: string, value: string, accent = '#4a5240') {
  return `
    <td style="padding:12px 16px;background:#faf7f2;border-radius:10px;width:50%;">
      <div style="font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">${label}</div>
      <div style="font-size:22px;font-weight:700;color:${accent};">${value}</div>
    </td>`;
}

export function buildDailyDigestEmail(data: DailyDigestData) {
  const subject = `KabiShop — Bilan du ${data.dateLabel}`;

  const topProduitsHtml =
    data.topProduits.length === 0
      ? '<p style="color:#71717a;margin:0;">Aucune vente enregistrée aujourd\'hui.</p>'
      : `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${data.topProduits
            .map(
              (p, i) => `
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;color:#4a5240;font-weight:600;width:24px;">${i + 1}.</td>
              <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;">${p.nom}</td>
              <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;text-align:right;white-space:nowrap;">${p.quantiteVendue} u. · ${formatGn(p.chiffreAffaires)}</td>
            </tr>`,
            )
            .join('')}
        </table>`;

  const alertes: string[] = [];
  if (data.commandesEnAttente > 0) {
    alertes.push(`${data.commandesEnAttente} commande(s) en attente de paiement`);
  }
  if (data.messagesNonLus > 0) {
    alertes.push(`${data.messagesNonLus} message(s) client non lu(s)`);
  }
  if (data.stockFaible > 0) {
    alertes.push(`${data.stockFaible} variante(s) en stock faible`);
  }

  const alertesHtml =
    alertes.length === 0
      ? ''
      : `<div style="margin-top:24px;padding:16px;background:#fef3c7;border-radius:10px;border-left:4px solid #d97706;">
          <strong style="color:#92400e;">À traiter</strong>
          <ul style="margin:8px 0 0;padding-left:20px;color:#78350f;">
            ${alertes.map((a) => `<li>${a}</li>`).join('')}
          </ul>
        </div>`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Segoe UI,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#4a5240;padding:28px 32px;">
            <div style="color:#faf7f2;font-size:13px;opacity:0.85;margin-bottom:4px;">Rapport quotidien</div>
            <div style="color:#fff;font-size:24px;font-weight:700;">KabiShop Admin</div>
            <div style="color:#d4d4d8;font-size:14px;margin-top:6px;">${data.dateLabel}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 16px;font-size:16px;color:#18181b;">Chiffre d'affaires du jour</h2>
            <table width="100%" cellpadding="0" cellspacing="8">
              <tr>
                ${kpi("CA aujourd'hui", formatGn(data.caJour))}
                ${kpi('Commandes', String(data.commandesJour))}
              </tr>
              <tr>
                ${kpi('Panier moyen', formatGn(data.panierMoyenJour))}
                ${kpi('Visites', String(data.visitesJour), '#18181b')}
              </tr>
            </table>

            <h2 style="margin:28px 0 12px;font-size:16px;color:#18181b;">7 derniers jours</h2>
            <table width="100%" cellpadding="0" cellspacing="8">
              <tr>
                ${kpi('CA 7 jours', formatGn(data.ca7j))}
                ${kpi('Évolution CA', formatPct(data.evolutionCa7jPct))}
              </tr>
              <tr>
                ${kpi('Nouveaux clients', String(data.nouveauxClients))}
                ${kpi('Prévision 7 j', formatGn(data.prevision7j))}
              </tr>
            </table>

            <h2 style="margin:28px 0 12px;font-size:16px;color:#18181b;">Produits les plus vendus (jour)</h2>
            ${topProduitsHtml}

            ${alertesHtml}

            <div style="margin-top:32px;text-align:center;">
              <a href="${data.biUrl}" style="display:inline-block;background:#4a5240;color:#faf7f2;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;">
                Ouvrir Business Intelligence
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#faf7f2;text-align:center;font-size:12px;color:#71717a;">
            Envoyé automatiquement chaque soir · <a href="${data.adminUrl}" style="color:#4a5240;">Tableau de bord admin</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `KabiShop — Bilan du ${data.dateLabel}`,
    '',
    "CHIFFRE D'AFFAIRES DU JOUR",
    `CA aujourd'hui : ${formatGn(data.caJour)}`,
    `Commandes : ${data.commandesJour}`,
    `Panier moyen : ${formatGn(data.panierMoyenJour)}`,
    `Visites : ${data.visitesJour}`,
    '',
    '7 DERNIERS JOURS',
    `CA : ${formatGn(data.ca7j)}`,
    `Évolution : ${formatPct(data.evolutionCa7jPct)}`,
    `Nouveaux clients : ${data.nouveauxClients}`,
    `Prévision 7 j : ${formatGn(data.prevision7j)}`,
    '',
    'TOP PRODUITS (JOUR)',
    ...(data.topProduits.length
      ? data.topProduits.map(
          (p, i) =>
            `${i + 1}. ${p.nom} — ${p.quantiteVendue} u. · ${formatGn(p.chiffreAffaires)}`,
        )
      : ['Aucune vente']),
    '',
    ...(alertes.length ? ['À TRAITER', ...alertes.map((a) => `- ${a}`), ''] : []),
    `BI : ${data.biUrl}`,
    `Admin : ${data.adminUrl}`,
  ].join('\n');

  return { subject, html, text };
}
