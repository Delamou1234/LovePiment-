import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client public (côté client — accès limité par les RLS policies)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client admin (côté serveur uniquement — ne jamais exposer au client)
export function createSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('[Supabase] Variable SUPABASE_SERVICE_ROLE_KEY manquante');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
