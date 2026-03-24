import { createClient } from '@supabase/supabase-js'

// استخدم علامة التعجب (!) لإخبار التايب سكريبت أننا نضمن وجود المتغير
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)