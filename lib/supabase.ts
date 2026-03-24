import { createClient } from '@supabase/supabase-js'

// هذا هو الرابط الحقيقي لمشروعك في سوبابيز - قمنا بوضعه يدوياً لكسر التعليق
const supabaseUrl = 'https://uyvjzuedpsvdkvpjrrax.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)