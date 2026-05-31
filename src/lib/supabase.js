import { createClient } from "@supabase/supabase-js";

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Accept both old JWT format (eyJ...) and new publishable key format (sb_publishable_...)
const keyIsValid =
  supabaseAnonKey?.startsWith("eyJ") ||
  supabaseAnonKey?.startsWith("sb_publishable_");

if (!supabaseUrl || !keyIsValid || supabaseUrl.includes("placeholder")) {
  console.warn("[supabase] credentials missing or invalid — check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:   true,   // Keep user logged in across tabs/refreshes
    autoRefreshToken: true,   // Silently refresh JWT before it expires
    detectSessionInUrl: false, // Not using OAuth redirects
  },

  realtime: {
    params: {
      // Max 2 events/second per channel — enough for CRM, prevents message floods.
      eventsPerSecond: 2,
    },
    // Reconnect with exponential back-off (default); max 5 retries.
    reconnectAfterMs: (attempt) => Math.min(500 * 2 ** attempt, 10_000),
  },

  global: {
    // Tag every request so it's identifiable in Supabase dashboard logs.
    headers: { "x-client-name": "suntronix-crm" },
  },

  // Use the public schema (default) — explicit to prevent accidental migrations.
  db: { schema: "public" },
});
