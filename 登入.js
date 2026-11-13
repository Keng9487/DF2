document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ 登入頁面與腳本載入完成'); // 檢查 1
  
  const loginBtn = document.getElementById('loginBtn');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      console.log('🖱️ 點擊了登入按鈕'); // 檢查 2

      const emailInput = document.getElementById('emailInput');
      const passwordInput = document.getElementById('passwordInput');
      const errorMsgEl = document.getElementById('errorMsg');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';

      if (!email || !password) {
        console.log('⚠️ 欄位未填寫完整');
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

      try {
        console.log('⏳ 正在向 Supabase 發送登入請求...'); // 檢查 3
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        console.log('📥 收到 Supabase 回應:', { data, error }); // 檢查 4

        if (error) {
          console.error('❌ 登入失敗:', error.message);
          if (errorMsgEl) {
            errorMsgEl.style.color = '#ef4444';
            errorMsgEl.textContent = `❌ 登入失敗: ${error.message}`;
          }
        } else {
          console.log('✅ 登入成功！準備跳轉...'); // 檢查 5
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 300);
        }

      } catch (err) {
        console.error('🔥 發生未預期的例外錯誤:', err);
        if (errorMsgEl) {
          errorMsgEl.style.color = '#ef4444';
          errorMsgEl.textContent = '❌ 發生系統錯誤，請查看主控台';
        }
      }
    });
  } else {
    console.error('❌ 找不到 loginBtn 按鈕元素！');
  }
});