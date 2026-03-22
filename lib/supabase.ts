import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// حماية إضافية لضمان عدم انهيار الـ Build إذا كانت القيم ناقصة مؤقتاً
if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ تنبيه: مفاتيح Supabase غير موجودة في متغيرات البيئة.")
}

export const supabase = createClient(
  supabaseUrl || '', // تمرير نص فارغ كبديل مؤقت لمنع انهيار الـ Build
  supabaseKey || ''
)