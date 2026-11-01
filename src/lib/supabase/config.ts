// Supabase settings come from .env.local (never from code). See .env.example.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** False until the owner has filled in .env.local, so the site still runs without it. */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
