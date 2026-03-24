import { createClient } from '@supabase/supabase-js'

// تأكد من أن الأسماء تطابق تماماً ما هو موجود في ملف .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// التحقق من وجود القيم قبل إنشاء العميل لمنع الروابط الوهمية
if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ خطأ: فشل في قراءة متغيرات Supabase من ملف الـ .env')
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseKey || ''
)