// register.js
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  
  if (!registerForm) {
    console.error("❌ 找不到 id='register-form' 的表單！");
    return;
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // 阻止頁面重新整理

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const messageEl = document.getElementById('register-message');

    messageEl.style.color = '#e2e8f0';
    messageEl.textContent = '正在與 Supabase 註冊中...';

    const { data, error } = await window.supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { display_name: username }
      }
    });

    if (error) {
      messageEl.style.color = '#fc8181';
      messageEl.textContent = '註冊失敗: ' + error.message;
    } else {
      messageEl.style.color = '#68d391';
      messageEl.textContent = '註冊成功！正在跳轉回主頁...';
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    }
  });
});