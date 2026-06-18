import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && anonKey);

if (!supabaseConfigurado && import.meta.env.DEV) {
  console.warn(
    '[Roster Team] Supabase não configurado. Crie .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
  );
}

const opcoesAuth = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
} as const;

export const supabase = createClient<Database>(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder',
  opcoesAuth,
);

/** Cliente auxiliar para signUp sem trocar a sessão do admin logado. */
export const supabaseAuthAux = createClient<Database>(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);
