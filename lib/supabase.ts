import { createClient } from '@supabase/supabase-js'

// جلب القيم من متغيرات البيئة
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// إنشاء العميل
export const supabase = createClient(supabaseUrl, supabaseKey)