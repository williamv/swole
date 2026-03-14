import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fallbacks let the module load at build time; real values required at runtime.
const url =
  supabaseUrl?.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
const key = supabaseAnonKey?.length ? supabaseAnonKey : 'placeholder-anon-key';

export const isConfigured = Boolean(supabaseUrl?.startsWith('http') && supabaseAnonKey?.length);

export const supabase = createClient(url, key);
