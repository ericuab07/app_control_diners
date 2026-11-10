import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** Client de navegador. La sessió es desa a localStorage; l'accés a dades el limita el RLS. */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
