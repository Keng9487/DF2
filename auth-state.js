// auth-state.js
document.addEventListener('DOMContentLoaded', () => {
  // 確保 Supabase 客戶端已載入
  if (!window.supabaseClient) {
    console.error("❌ Supabase 客戶端尚未初始化！");
    return;
  }

  // 監聽 Supabase 登入狀態變更
  window.supabaseClient.auth.onAuthStateChange((event, session) => {
    // 假設你的主頁右上角顯示名字的地方是 <header> 裡的 <span>，按鈕區塊是 class="top-right-auth-buttons"
    const userSpan = document.querySelector('header span'); 
    const authButtons = document.querySelector('.top-right-auth-buttons');
    
    if (session && session.user) {
      // 優先讀取 display_name，若無則退而求其次顯示信箱
      const displayName = session.user.user_metadata?.display_name || session.user.user_metadata?.username || session.user.email;
      if (userSpan) userSpan.textContent = displayName;
      
      // 已登入狀態：將右上角按鈕改為「登出」按鈕
      if (authButtons) {
        authButtons.innerHTML = `<button id="logout-btn" class="auth-btn" style="background-color: #e53e3e; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">登出</button>`;
        
        // 綁定登出點擊事件
        document.getElementById('logout-btn').addEventListener('click', async () => {
          await window.supabaseClient.auth.signOut();
          window.location.reload(); // 登出後重新整理頁面
        });
      }
    } else {
      // 未登入狀態
      if (userSpan) userSpan.textContent = '未登入';
      
      // 未登入狀態：顯示「登入」與「註冊」超連結按鈕
      if (authButtons) {
        authButtons.innerHTML = `
          <a href="登入.html" class="auth-btn login-btn" style="margin-right: 8px; text-decoration: none; padding: 6px 12px; background: #3182ce; color: white; border-radius: 4px;">登入</a>
          <a href="註冊.html" class="auth-btn register-btn" style="text-decoration: none; padding: 6px 12px; background: #38a169; color: white; border-radius: 4px;">註冊</a>
        `;
      }
    }
  });
});