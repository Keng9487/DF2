// notes-viewer.js (節錄查詢與渲染部分)
viewBtn.addEventListener('click', async () => {
  modal.style.display = 'flex';
  container.innerHTML = '<p style="text-align: center; color: #a0aec0;">正在載入備註...</p>';

  try {
    // 🔥 透過關聯直接同時抓取 task_notes 與對應 tasks 的 building 名稱
    const { data, error } = await window.supabaseClient
      .from('task_notes')
      .select(`
        id,
        notes,
        credits,
        created_at,
        tasks (
          building
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      container.innerHTML = `<p style="color: #fc8181; text-align: center;">載入失敗: ${error.message}</p>`;
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #a0aec0;">目前沒有任何路線備註。</p>';
      return;
    }

    let html = '';
    data.forEach((item) => {
      const timeStr = item.created_at ? new Date(item.created_at).toLocaleString() : '未知時間';
      const buildingName = item.tasks?.building || '未知地點'; // 取得關聯的主表建築名稱

      html += `
        <div style="background: #1a202c; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #3182ce;">
          <h4 style="margin: 0 0 5px 0; color: #63b3ed;">📍 ${escapeHtml(buildingName)}</h4>
          <p style="margin: 0 0 8px 0; font-size: 14px; white-space: pre-wrap; word-break: break-all;">${escapeHtml(item.notes)}</p>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #a0aec0;">
            <span>貢獻者：<strong>${escapeHtml(item.credits || '未知玩家')}</strong></span>
            <span>${timeStr}</span>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;

  } catch (err) {
    console.error('查詢備註錯誤：', err);
    container.innerHTML = '<p style="color: #fc8181; text-align: center;">發生未預期錯誤</p>';
  }
});