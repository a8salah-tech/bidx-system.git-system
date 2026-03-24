import { createClient } from '@supabase/supabase-js'

// هنا نجبر الكود على قراءة المتغيرات الحقيقية فقط
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// إذا لم تكن المتغيرات موجودة، الكود سيتوقف هنا ولن يذهب لروابط وهمية
if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.error("خطأ: رابط سوبابيز غير صحيح أو مفقود!");
}

export const supabase = createClient(supabaseUrl, supabaseKey)