// Standalone-script counterpart to mcn-singapore's src/lib/supabase.ts. This runs inside a
// GitHub Actions job (not a deployed app), so it reads plain env var names (SUPABASE_URL /
// SUPABASE_ANON_KEY, set as repo Actions secrets) rather than the NEXT_PUBLIC_/REACT_APP_
// prefixed ones the frontend uses. Same anon key + RLS-policy pattern as every other
// insert path in the MCN Group project (see mcn-database/schema.sql) -- no service-role key.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/** Which `countries.code` row this crawler publishes under. */
export const COUNTRY_CODE = process.env.COUNTRY_CODE || "T10C";
