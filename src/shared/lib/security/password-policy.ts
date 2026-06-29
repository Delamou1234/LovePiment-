import { z } from 'zod';

/** Politique mot de passe e-commerce : 8 caractères minimum. */
export const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .max(128, 'Mot de passe trop long');
