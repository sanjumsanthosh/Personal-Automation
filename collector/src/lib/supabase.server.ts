import { createClient } from '@supabase/supabase-js'

// Server-side code must use process.env in production (Vercel/Nitro)
// VITE_ prefixed vars are only available client-side via import.meta.env
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || import.meta.env.VITE_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[supabase.server] Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
    })
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
