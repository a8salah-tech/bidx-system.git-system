import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// استخدام روابط وهمية (Placeholders) فقط أثناء الـ Build لمنع الانهيار
// بمجرد تشغيل الموقع فعلياً، سيستخدم النظام القيم الحقيقية من Vercel
export const supabase = createClient(supabaseUrl, supabaseAnonKey)