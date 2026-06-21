import { timingSafeEqual } from 'crypto';

export function verifyAdminLogin(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) return false;

  const normEmail = email.trim().toLowerCase();
  if (normEmail.length !== adminEmail.length) return false;
  if (password.length !== adminPassword.length) return false;

  const emailOk = timingSafeEqual(Buffer.from(normEmail), Buffer.from(adminEmail));
  const passOk = timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword));
  return emailOk && passOk;
}
