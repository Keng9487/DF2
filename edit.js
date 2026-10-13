// edit.js
document.addEventListener('DOMContentLoaded', async () => {
  // 1. 檢查 Supabase 是否初始化
  if (!window.supabaseClient) {
    console.error("❌ Supabase 客戶端尚未初始化！");
    return;
  }

  const messageEl = document.getElementById('edit-message');
  const creditsInput = document.getElementById('credits');

  // 2. 頁面載入時：檢查使用者登入狀態並自動帶入 credits
  try {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error) {
      console.error("❌ 取得登入狀態失敗：", error.message);
      return;
    }

    if (session && session.user) {
      // 優先抓取 display_name，若無則抓 username 或信箱
      const displayName = session.user.user_metadata?.display_name || 
                          session.user.user_metadata?.username || 
                          session.user.email;

      // 自動填入唯讀的 credits 欄位
      if (creditsInput) {
        creditsInput.value = displayName;
      }
    } else {
      // 若未登入，提示並引導至登入頁面
      alert("請先登入後才能編輯地圖標記！");
      window.location.href = 'login.html';
      return;
    }
  } catch (err) {
    console.error("❌ 驗證登入狀態發生錯誤：", err);
  }

  // 3. 監聽表單送出事件
  const editForm = document.getElementById('edit-form');
  if (!editForm) return;

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // 防止頁面重新整理

    const title = document.getElementById('marker-title').value.trim();
    const category = document.getElementById('marker-category').value;
    const description = document.getElementById('marker-desc').value.trim();
    const credits = creditsInput.value; // 自動帶入且被鎖定的名稱

    messageEl.style.color = '#e2e8f0';
    messageEl.textContent = '正在儲存標記資料...';

    try {
      // 🔥 這裡示範將資料寫入 Supabase 資料表（假設你的資料表叫做 map_markers）
      // 如果你的資料表名稱不同，請自行修改 .from('你的資料表名稱')
      const { data, error } = await window.supabaseClient
        .from('map_markers')
        .insert([
          { 
            title: title, 
            category: category, 
            description: description, 
            credits: credits // 將自動帶入的使用者名稱存進資料庫
            // lat: ..., lng: ... (如果有座標可以在這裡一併帶入)
          }
        ]);

      if (error) {
        console.error('❌ 儲存失敗：', error.message);
        messageEl.style.color = '#fc8181';
        messageEl.textContent = '儲存失敗: ' + error.message;
      } else {
        console.log('✅ 儲存成功：', data);
        messageEl.style.color = '#68d391';
        messageEl.textContent = '儲存成功！正在返回地圖主頁...';
        
        // 1.5 秒後跳轉回主頁
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      }
    } catch (err) {
      console.error('❌ 發生未預期錯誤：', err);
      messageEl.style.color = '#fc8181';
      messageEl.textContent = '發生未預期錯誤，請檢查主控台 (F12)';
    }
  });
});