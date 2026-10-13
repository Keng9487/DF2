// 替換成你從 Supabase 後台拿到的專案網址與金鑰
const SUPABASE_URL = 'https://yasnbvmngdxkukuxvafc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc25idm1uZ2R4a3VrdXh2YWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4Mjc0MzUsImV4cCI6MjEwMjQwMzQzNX0.ht7XqIdRczGIdVE-oljEplFLEOHyxb7zZSI_pnDDP4w';


// 檢查 Supabase 是否成功載入
if (typeof window.supabase === 'undefined') {
  console.error('❌ Supabase SDK 尚未載入！請檢查 HTML 的 CDN 引入是否正確。');
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const registerForm = document.getElementById('register-form');
const messageEl = document.getElementById('register-message');

if (!registerForm) {
  console.error('❌ 找不到 id="register-form" 的表單元素！');
}

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('🖱️ 註冊按鈕已被點擊，開始執行...');

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  messageEl.style.color = '#e2e8f0';
  messageEl.textContent = '正在與伺服器連線註冊中...';

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username
        }
      }
    });

    if (error) {
      console.error('❌ Supabase 註冊失敗錯誤：', error);
      messageEl.style.color = '#fc8181';
      messageEl.textContent = '註冊失敗: ' + error.message;
    } else {
      console.log('✅ 註冊成功回傳資料：', data);
      messageEl.style.color = '#68d391';
      messageEl.textContent = '註冊成功！正在導向主頁...';
      
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    }
  } catch (err) {
    console.error('❌ 程式執行發生未預期錯誤：', err);
    messageEl.style.color = '#fc8181';
    messageEl.textContent = '發生未預期錯誤，請檢查主控台 (F12)';
  }
});
