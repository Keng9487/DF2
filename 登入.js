import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // 防止網頁預設重新整理

      // 1. 取得輸入框的帳號與密碼
      const email = document.getElementById('emailInput').value.trim();
      const password = document.getElementById('passwordInput').value.trim();
      const errorMsgEl = document.getElementById('errorMsg');

      if (!email || !password) {
        if (errorMsgEl) errorMsgEl.textContent = '請輸入 Email 與密碼！';
        return;
      }

      // 清除舊的錯誤訊息
      if (errorMsgEl) errorMsgEl.textContent = '登入中...';

      // 2. 呼叫 Supabase 登入函式
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      // 3. 處理登入結果
      if (error) {
        console.error('❌ 登入失敗:', error.message);
        if (errorMsgEl) {
          errorMsgEl.style.color = '#ef4444';
          errorMsgEl.textContent = `登入失敗: ${error.message}`;
        }
      } else {
        console.log('✅ 登入成功！Token 已寫入 sessionStorage', data);
        
        // 4. 登入成功後，立刻跳轉回你的主頁
        window.location.href = 'index.html';
      }
    });
  }
});