import { createClient } from '@supabase/supabase-js'

// تغيير أسماء الثوابت يجبر المحرك على إعادة القراءة من الصفر
const ACTUAL_SUPABASE_URL = 'https://uyvjzuedpsvdkvpjrrax.supabase.co'
const ACTUAL_SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(ACTUAL_SUPABASE_URL, ACTUAL_SUPABASE_KEY)