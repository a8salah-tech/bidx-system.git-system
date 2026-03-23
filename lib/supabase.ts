// 1. استيراد الدالة المسؤولة عن إنشاء اتصال مع Supabase من المكتبة المثبتة
import { createClient } from '@supabase/supabase-js'

/**
 * 2. جلب رابط المشروع (URL) من ملف البيئة .env.local
 * علامة (!) في النهاية تعني أننا نؤكد لـ TypeScript أن القيمة موجودة ولن تكون null.
 * ملاحظة: يجب أن يبدأ المتغير بـ NEXT_PUBLIC ليتمكن المتصفح من قراءته.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

/**
 * 3. جلب مفتاح الأمان العام (Anon Key)
 * هذا المفتاح يُرسل مع كل طلب (Request) للتحقق من هوية المشروع وصلاحيات الوصول.
 */
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * 4. إنشاء وتصدير نسخة العميل (Supabase Client)
 * نمرر الرابط والمفتاح للدالة لإنشاء كائن 'supabase'.
 * نستخدم 'export' لكي نتمكن من استدعاء هذا المتغير في أي صفحة أخرى داخل التطبيق.
 */
export const supabase = createClient(supabaseUrl, supabaseKey)