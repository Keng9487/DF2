import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 1. 初始化 Supabase 客戶端（強制使用 sessionStorage 確保關閉分頁即登出）
const supabaseUrl = 'https://yasnbvmngdxkukuxvafc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc25idm1uZ2R4a3VrdXh2YWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4Mjc0MzUsImV4cCI6MjEwMjQwMzQzNX0.ht7XqIdRczGIdVE-oljEplFLEOHyxb7zZSI_pnDDP4w';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: window.sessionStorage, // 關鍵設定：憑證存放在分頁中，關閉分頁自動清除
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// 2. 監聽網頁載入完成，綁定登入按鈕事件
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const emailInput = document.getElementById('emailInput');
      const passwordInput = document.getElementById('passwordInput');
      const errorMsgEl = document.getElementById('errorMsg');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';

      // 基本欄位檢查
      if (!email || !password) {
        if (errorMsgEl) {
          errorMsgEl.style.color = '#ef4444';
          errorMsgEl.textContent = '❌ 請完整輸入 Email 與密碼！';
        }
        return;
      }

      if (errorMsgEl) {
        errorMsgEl.style.color = '#93c5fd';
        errorMsgEl.textContent = '⏳ 登入驗證中...';
      }

      // 3. 呼叫 Supabase 登入 API
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      // 4. 處理登入結果
      if (error) {
        console.error('❌ 登入失敗:', error.message);
        if (errorMsgEl) {
          errorMsgEl.style.color = '#ef4444';
          errorMsgEl.textContent = `❌ 登入失敗: ${error.message}`;
        }
      } else {
        console.log('✅ 登入成功！Token 已寫入 sessionStorage', data);
        
        // 5. 登入成功，跳轉回主畫面 index.html
        window.location.href = 'index.html';
      }
    });
  }
});