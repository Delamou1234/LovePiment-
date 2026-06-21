import { adminAuthRepository } from '@/modules/auth/repository/admin-auth.repository';

/** @deprecated Préférez adminAuthRepository.verifierConnexion (base de données). */
export async function verifyAdminLogin(email: string, password: string): Promise<boolean> {
  const admin = await adminAuthRepository.verifierConnexion(email, password);
  return admin != null;
}
