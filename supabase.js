import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://yasnbvmngdxkukuxvafc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc25idm1uZ2R4a3VrdXh2YWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4Mjc0MzUsImV4cCI6MjEwMjQwMzQzNX0.ht7XqIdRczGIdVE-oljEplFLEOHyxb7zZSI_pnDDP4w';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: window.sessionStorage, // 確保登入後的 Token 存放在 sessionStorage，關閉分頁自動清除[cite: 1]
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
