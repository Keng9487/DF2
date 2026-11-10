import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://yasnbvmngdxkukuxvafc.supabase.co';
const supabaseKey = '你的 Supabase Anon Key';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: window.sessionStorage, // 確保登入後的 Token 存放在 sessionStorage，關閉分頁自動清除[cite: 1]
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});