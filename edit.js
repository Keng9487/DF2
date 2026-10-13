// edit.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.supabaseClient) return;

  const messageEl = document.getElementById('edit-message');
  const creditsInput = document.getElementById('credits');
  const buildingInput = document.getElementById('building-name');
  const notesInput = document.getElementById('task-notes');

  // 1. 自動帶入登入者名稱到 credits
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

  // 2. 監聽表單送出事件
  const editForm = document.getElementById('edit-form');
  if (!editForm) return;

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const buildingValue = buildingInput.value.trim();
    const notesValue = notesInput.value.trim();
    const creditsValue = creditsInput.value;

    messageEl.style.color = '#e2e8f0';
    messageEl.textContent = '正在儲存至資料庫...';

    try {
      // 步驟 A：檢查 tasks 主表中是否已經存在這個 building
      let { data: existingTask, error: findError } = await window.supabaseClient
        .from('tasks')
        .select('id')
        .eq('building', buildingValue)
        .maybeSingle();

      let taskId;

      if (findError) {
        throw new Error("查詢建築失敗: " + findError.message);
      }

      // 如果主表中還沒有這棟建築，先新增一筆
      if (!existingTask) {
        const { data: newTask, error: insertTaskError } = await window.supabaseClient
          .from('tasks')
          .insert([{ building: buildingValue }])
          .select('id')
          .single();

        if (insertTaskError) {
          throw new Error("建立建築主檔失敗: " + insertTaskError.message);
        }
        taskId = newTask.id;
      } else {
        taskId = existingTask.id;
      }

      // 步驟 B：將新備註寫入 task_notes 子表中，並掛載對應的 task_id
      const { error: insertNoteError } = await window.supabaseClient
        .from('task_notes')
        .insert([
          {
            task_id: taskId,
            notes: notesValue,
            credits: creditsValue
          }
        ]);

      if (insertNoteError) {
        throw new Error("儲存備註失敗: " + insertNoteError.message);
      }

      messageEl.style.color = '#68d391';
      messageEl.textContent = '儲存成功！正在返回主頁...';
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);

    } catch (err) {
      console.error('發生錯誤：', err);
      messageEl.style.color = '#fc8181';
      messageEl.textContent = err.message || '發生未預期錯誤';
    }
  });
});