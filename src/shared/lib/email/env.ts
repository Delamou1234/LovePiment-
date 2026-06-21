const PLACEHOLDER = new Set(['', 'changeme', 'xxx', 'your_password_here']);

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  if (!v || PLACEHOLDER.has(v.toLowerCase())) return undefined;
  return v;
}

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export function getSmtpConfig(): SmtpConfig | null {
  const host = clean(process.env.SMTP_HOST);
  const user = clean(process.env.SMTP_USER);
  const pass = clean(process.env.SMTP_PASS);
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const from =
    clean(process.env.MAIL_FROM) ?? clean(process.env.SMTP_FROM) ?? `"KabiShop" <${user}>`;

  return { host, port, secure, user, pass, from };
}

export function getAdminEmail(): string | null {
  return clean(process.env.ADMIN_EMAIL)?.toLowerCase() ?? null;
}

export function getCronSecret(): string | null {
  return clean(process.env.CRON_SECRET) ?? null;
}

export function getAppBaseUrl(): string {
  return (
    clean(process.env.NEXT_PUBLIC_APP_URL) ??
    clean(process.env.APP_URL) ??
    'http://localhost:3000'
  );
}

export function getCronTimezone(): string {
  return clean(process.env.CRON_TIMEZONE) ?? 'Africa/Conakry';
}
