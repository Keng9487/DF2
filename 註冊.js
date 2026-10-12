// 替換成你從 Supabase 專案設定抓到的專案網址 (URL) 與公開金鑰 (Anon Key)
const SUPABASE_URL = 'https://yasnbvmngdxkukuxvafc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc25idm1uZ2R4a3VrdXh2YWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4Mjc0MzUsImV4cCI6MjEwMjQwMzQzNX0.ht7XqIdRczGIdVE-oljEplFLEOHyxb7zZSI_pnDDP4w';

// 初始化 Supabase 客戶端
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 監聽註冊表單送出事件
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('register-message');

  messageEl.style.color = '#e2e8f0';
  messageEl.textContent = '正在註冊中...';

  // 呼叫 Supabase Auth 註冊 API
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        username: username // 🔥 這裡會將使用者名稱存入 Supabase 使用者資料的 raw_user_meta_data 中
      }
    }
  });

  if (error) {
    // 註冊失敗
    messageEl.style.color = '#fc8181';
    messageEl.textContent = '註冊失敗: ' + error.message;
  } else {
    // 註冊成功
    messageEl.style.color = '#68d391';
    messageEl.textContent = '註冊成功！系統已將你導向回主頁...';
    
    // 延遲 1.5 秒後自動跳轉回你的地圖主頁 index.html
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  }
});