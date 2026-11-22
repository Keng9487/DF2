document.addEventListener('DOMContentLoaded', async () => {
  if (!window.supabaseClient) {
    console.error("❌ Supabase 客戶端尚未初始化！");
    return;
  }

  // 自動偵測目前語系：回傳 'cn'（簡體）或 'tw'（繁體）
  function detectLang() {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    const savedLang =
      sessionStorage.getItem('lang') ||
      sessionStorage.getItem('language') ||
      localStorage.getItem('lang') ||
      localStorage.getItem('language');
    const htmlLang = document.documentElement.getAttribute('lang');
    const navLang = navigator.language;

    const raw = (urlLang || savedLang || htmlLang || navLang || 'zh-TW').toLowerCase();
    if (raw.includes('cn') || raw.includes('hans') || raw === 'zh-sg') {
      return 'cn';
    }
    return 'tw';
  }

  const lang = detectLang();

  // 依語系指定不同的資料表與欄位設定
  const tableConfig = {
    tw: {
      taskTable: '任務',
      notesRelation: '任務備註', // 若繁體備註表有獨立關聯名，可改為對應名稱
      notesTable: '任務備註',
      idColumn: 'ID',
      buildingColumn: '建築'
    },
    cn: {
      taskTable: '任务',
      notesRelation: '任務備註', // 若簡體備註表有獨立關聯名，可改為對應名稱
      notesTable: '任務備註',
      idColumn: 'ID',
      buildingColumn: '建築'
    }
  };

  const currentTables = tableConfig[lang];

  const i18n = {
    tw: {
      missingTaskId: '錯誤：找不到任務 ID！',
      taskNotFound: '找不到此任務資料或已被刪除。',
      defaultBuilding: '未指定建築',
      titleTemplate: (building) => `【${building}】詳細備註記錄`,
      emptyNotes: '目前尚無任何備註記錄。',
      anonymous: '[匿名]',
      deleteBtn: '刪除',
      confirmDelete: '確定要刪除這則備註嗎？此操作無法復原。',
      deleteFailed: '刪除失敗：',
      loadFailed: '載入備註失敗，請稍後再試。',
      loadErrorLog: '載入備註發生錯誤：',
      deleteErrorLog: '刪除備註失敗：'
    },
    cn: {
      missingTaskId: '错误：找不到任务 ID！',
      taskNotFound: '找不到此任务资料或已被删除。',
      defaultBuilding: '未指定建筑',
      titleTemplate: (building) => `【${building}】详细备注记录`,
      emptyNotes: '目前尚无任何备注记录。',
      anonymous: '[匿名]',
      deleteBtn: '删除',
      confirmDelete: '确定要删除这则备注吗？此操作无法复原。',
      deleteFailed: '删除失败：',
      loadFailed: '载入备注失败，请稍后再试。',
      loadErrorLog: '载入备注发生错误：',
      deleteErrorLog: '删除备注失败：'
    }
  };

  const t = i18n[lang];

  // 從網址列取得任務 ID (例如 notes.html?id=xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('id');
  const container = document.getElementById('notes-list-container');
  const titleEl = document.getElementById('notes-title');

  if (!taskId) {
    container.innerHTML = `<p style="color: #fc8181; text-align: center;">${t.missingTaskId}</p>`;
    return;
  }

  // 1. 取得當前登入使用者的身分資訊
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  const currentUserName = user ? (user.user_metadata?.display_name || user.user_metadata?.username || user.email) : null;

  // 取得與渲染備註資料的函式
  async function fetchAndRenderNotes() {
    try {
      const selectQuery = `*, ${currentTables.notesRelation}(*)`;

      // 依語系撈取對應任務表及其關聯的備註資料
      const { data: taskData, error: taskError } = await window.supabaseClient
        .from(currentTables.taskTable)
        .select(selectQuery)
        .eq(currentTables.idColumn, taskId)
        .single();

      if (taskError || !taskData) {
        container.innerHTML = `<p style="color: #fc8181; text-align: center;">${t.taskNotFound}</p>`;
        return;
      }

      const buildingName = taskData[currentTables.buildingColumn] || taskData.building || t.defaultBuilding;
      if (titleEl) {
        titleEl.textContent = t.titleTemplate(buildingName);
      }

      const notes = taskData[currentTables.notesRelation] || taskData.task_notes || [];
      if (notes.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #8b949e; font-style: italic;">${t.emptyNotes}</p>`;
        return;
      }

      // 依照建立時間由新到舊排序
      notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      let html = '';
      notes.forEach(note => {
        const timeStr = new Date(note.created_at).toLocaleString([], {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        const creditsStr = note.credits ? `[${note.credits}]` : t.anonymous;

        const escapeHtml = (str) => {
          return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        };
        const formattedNotes = escapeHtml(note.notes || '').replace(/\n/g, '<br>');

        // 2. 嚴格權限判斷：比對備註的 credits（或 user_id）是否與當前登入使用者相符
        const isOwner = currentUserName && (note.credits === currentUserName || note.user_id === user?.id);

        // 3. 只有自己的備註才渲染刪除按鈕
        const deleteBtnHtml = isOwner
          ? `<button onclick="window.deleteNote('${note.id}')" style="background: #e53e3e; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; white-space: nowrap; font-weight: bold; transition: background 0.2s;" onmouseover="this.style.background='#c53030'" onmouseout="this.style.background='#e53e3e'">${t.deleteBtn}</button>`
          : '';

        html += `
          <div style="background: #1a202c; border: 1px solid #4a5568; border-radius: 6px; padding: 12px 15px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
            <div style="flex-grow: 1; word-break: break-all;">
              <div style="margin-bottom: 6px;">
                <span style="color: #93c5fd; font-weight: bold; font-size: 14px;">${creditsStr}</span>
                <span style="color: #9ca3af; font-size: 11px; margin-left: 6px;">(${timeStr})</span>
              </div>
              <div style="color: #e5e7eb; font-size: 13px; line-height: 1.4; white-space: pre-wrap;">${formattedNotes}</div>
            </div>
            ${deleteBtnHtml}
          </div>
        `;
      });

      container.innerHTML = html;

    } catch (err) {
      console.error(t.loadErrorLog, err);
      container.innerHTML = `<p style="color: #fc8181; text-align: center;">${t.loadFailed}</p>`;
    }
  }

  // 宣告全域的刪除備註函式
  window.deleteNote = async function(noteId) {
    if (!confirm(t.confirmDelete)) return;

    try {
      const { error } = await window.supabaseClient
        .from(currentTables.notesTable)
        .delete()
        .eq('ID', noteId);

      if (error) throw error;

      // 刪除成功後即時重新整理畫面上的備註清單
      fetchAndRenderNotes();

    } catch (err) {
      console.error(t.deleteErrorLog, err);
      alert(t.deleteFailed + err.message);
    }
  };

  // 初始化載入
  fetchAndRenderNotes();
});