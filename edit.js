// edit.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.supabaseClient) return;

  const messageEl = document.getElementById('edit-message');
  const creditsInput = document.getElementById('credits');
  const headerEl = document.getElementById('task-header');
  const routeInput = document.getElementById('route-input');
  const editForm = document.getElementById('edit-form');

  // 1. 取得網址帶入的任務 ID (例如 edit.html?id=xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('id');

  if (!taskId) {
    alert("未指定任務 ID！");
    window.location.href = 'index.html';
    return;
  }

  // 2. 自動帶入登入者名稱到 credits
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session && session.user) {
      const displayName = session.user.user_metadata?.display_name || 
                          session.user.user_metadata?.username || 
                          session.user.email;
      if (creditsInput) creditsInput.value = displayName;
    } else {
      alert("請先登入後才能新增備註！");
      window.location.href = 'login.html';
      return;
    }
  } catch (err) {
    console.error("驗證失敗：", err);
  }

  // 3. 讀取 tasks 資料並組合 Header 格式：前往{變數1},城市:{變數2} 目標:{變數3}
  try {
    const { data: taskData, error: taskError } = await window.supabaseClient
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    if (taskData) {
      // 變數定義：
      // 變數1 = 建築名稱 (building)
      // 變數2 = 城市名稱 (city)
      // 變數3 = 任務類型 (task_type 或 type)
      const var1 = taskData.building || '未指定建築';
      const var2 = taskData.city || '未標註城市';
      const var3 = taskData.task_type || taskData.type || '一般任務';

      if (headerEl) {
        headerEl.textContent = `前往${var1},城市:${var2} 目標:${var3}`;
      }
    }
  } catch (err) {
    console.error('載入任務詳細資料失敗：', err);
    if (headerEl) headerEl.textContent = '無法載入任務資訊';
    return;
  }

  // 4. 監聽表單送出事件：將新路線寫入 task_notes 資料表
  if (!editForm) return;

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const routeValue = routeInput.value.trim();
    const creditsValue = creditsInput.value;

    if (!routeValue) return;

    messageEl.style.color = '#e2e8f0';
    messageEl.textContent = '正在儲存備註...';

    try {
      // 將輸入的新路線寫入對應此 task_id 的 task_notes 表中
      const { error: insertError } = await window.supabaseClient
        .from('task_notes')
        .insert([
          {
            task_id: taskId,
            notes: routeValue,
            credits: creditsValue
          }
        ]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      messageEl.style.color = '#68d391';
      messageEl.textContent = '儲存成功！正在返回主頁...';
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);

    } catch (err) {
      console.error('儲存失敗：', err);
      messageEl.style.color = '#fc8181';
      messageEl.textContent = '儲存失敗: ' + err.message;
    }
  });
});
