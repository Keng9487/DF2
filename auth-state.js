document.addEventListener('DOMContentLoaded', async () => {
  // 兼容處理：同時支援 window.supabaseClient 或 window.supabase
  const client = window.supabaseClient || window.supabase;
  if (!client) {
    console.error("❌ Supabase 客戶端尚未初始化！請確認 supabase-client.js 或相關設定是否正確載入。");
    return;
  }

  const userSpan = document.getElementById('user-name-display');
  const authContainer = document.getElementById('auth-buttons-container');

  // 共用的 UI 更新函式
  const updateAuthUI = (session) => {
    if (session && session.user) {
      // 已登入：取得 Display name，若無則抓 username 或 email
      const displayName = session.user.user_metadata?.display_name || 
                          session.user.user_metadata?.username || 
                          session.user.email;
      
      if (userSpan) {
        userSpan.textContent = `玩家：${displayName}`;
      }
      
      // 將右上角容器替換為醒目的「登出」按鈕
      if (authContainer) {
        authContainer.innerHTML = `<button id="logout-btn" style="background-color: #e53e3e; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">登出</button>`;
        
        // 綁定登出事件
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', async () => {
            await client.auth.signOut();
            window.location.reload(); // 登出後重新整理頁面
          });
        }
      }
    } else {
      // 未登入狀態
      if (userSpan) {
        userSpan.textContent = '未登入';
      }
      
      // 顯示登入與註冊按鈕[cite: 2, 3]
      if (authContainer) {
        authContainer.innerHTML = `
          <a href="登入.html" style="padding: 6px 12px; background: #3182ce; color: white; text-decoration: none; border-radius: 4px; margin-right: 5px;">登入</a>
          <a href="註冊.html" style="padding: 6px 12px; background: #38a169; color: white; text-decoration: none; border-radius: 4px;">註冊</a>
        `;
      }
    }
  };

  // 1. 頁面載入時「立即」主動取得當前 Session（解決重整初期抓不到登入狀態的問題）
  try {
    const { data: { session } } = await client.auth.getSession();
    updateAuthUI(session);
  } catch (err) {
    console.error("❌ 取得初始 Session 失敗：", err);
  }

  // 2. 透過 Realtime 持續監聽後續的登入/登出狀態變更
  client.auth.onAuthStateChange((event, session) => {
    updateAuthUI(session);
  });
});