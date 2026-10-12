// 替換成你從 Supabase 專案設定抓到的專案網址 (URL) 與公開金鑰 (Anon Key)
const SUPABASE_URL = 'https://yasnbvmngdxkukuxvafc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc25idm1uZ2R4a3VrdXh2YWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4Mjc0MzUsImV4cCI6MjEwMjQwMzQzNX0.ht7XqIdRczGIdVE-oljEplFLEOHyxb7zZSI_pnDDP4w';

// 初始化 Supabase 客戶端
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 監聽登入表單送出事件
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const messageEl = document.getElementById('login-message');

  messageEl.style.color = '#e2e8f0';
  messageEl.textContent = '登入驗證中...';

  // 呼叫 Supabase Auth 登入 API
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    // 登入失敗
    messageEl.style.color = '#fc8181';
    messageEl.textContent = '登入失敗: ' + error.message;
  } else {
    // 登入成功
    messageEl.style.color = '#68d391';
    messageEl.textContent = '登入成功！正在跳轉回主頁...';
    
    // 延遲 1 秒後自動跳轉回地圖主頁 任務.html
    setTimeout(() => {
      window.location.href = '任務.html';
    }, 1000);
  }
});