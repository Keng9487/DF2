// edit.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.supabaseClient) return;

  const messageEl = document.getElementById('edit-message');
  const creditsInput = document.getElementById('credits');
  const headerEl = document.getElementById('task-header');
  const routeInput = document.getElementById('route-input');
  const editForm = document.getElementById('edit-form');

  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('id');

  if (!taskId) {
    alert("未指定任務 ID！");
    window.location.href = 'index.html';
    return;
  }

  // 1. 自動帶入登入者名稱
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session && session.user) {
      const displayName = session.user.user_metadata?.display_name || 
                          session.user.user_metadata?.username || 
                          session.user.email;
      if (creditsInput) creditsInput.value = displayName;
    } else {
      alert("請先登入後才能新增備註！");
      window.location.href = '登入.html';
      return;
    }
  } catch (err) {
    console.error("驗證失敗：", err);
  }

  // 2. 載入 Header 資訊
  try {
    const { data: taskData, error: taskError } = await window.supabaseClient
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    if (taskData) {
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

  // 3. 監聽表單送出
  if (!editForm) return;

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const routeValue = routeInput ? routeInput.value.trim() : '';
    const creditsValue = creditsInput ? creditsInput.value : '';

    if (!routeValue) return;

    messageEl.style.color = '#e2e8f0';
    messageEl.textContent = '正在儲存備註...';

    try {
      const { error: insertError } = await window.supabaseClient
        .from('task_notes')
        .insert([
          {
            task_id: taskId,
            notes: routeValue,
            credits: creditsValue
          }
        ]);

      if (insertError) throw new Error(insertError.message);

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