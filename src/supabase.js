import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ✅ 只用 anon key，Service Key 绝对不放前端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ⚠️ supabaseAdmin 已移除
// Service Key 现在只存在 Supabase Edge Function 的环境变量里
// 前端所有操作通过 supabase（anon key）或 Edge Function 完成