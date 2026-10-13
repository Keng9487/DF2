// login.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  
  if (!loginForm) {
    console.error("❌ 找不到 id='login-form' 的表單！");
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // 阻止頁面重新整理

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const messageEl = document.getElementById('login-message');

    messageEl.style.color = '#e2e8f0';
    messageEl.textContent = '登入驗證中...';

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      messageEl.style.color = '#fc8181';
      messageEl.textContent = '登入失敗: ' + error.message;
    } else {
      messageEl.style.color = '#68d391';
      messageEl.textContent = '登入成功！正在跳轉回主頁...';
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    }
  });
});