// 全域狀態變數
window.globalQuestData = [];
window.globalRouteMapData = [];
window.questSelectedCoordMap = new Map();
window.lockedQuestIds = new Set();
window.nearRouteCoords = new Set();

// 區域範圍定義
const regionRanges = {
  "拉文沃爾高地": { minX: 1, maxX: 6, minY: 0, maxY: 6 },
  "阿班達爾公園": { minX: 7, maxX: 12, minY: 0, maxY: 6 },
  "木上村": { minX: 13, maxX: 18, minY: 0, maxY: 6 },
  "灰木鎮": { minX: 19, maxX: 24, minY: 0, maxY: 6 },
  "勒威伯里": { minX: 25, maxX: 30, minY: 0, maxY: 6 },
  "達爾博": { minX: 1, maxX: 6, minY: 7, maxY: 12 },
  "庫珀鎮": { minX: 7, maxX: 12, minY: 7, maxY: 12 },
  "豐弓鎮狩獵區": { minX: 13, maxX: 18, minY: 7, maxY: 12 },
  "丹茨維爾鎮": { minX: 19, maxX: 24, minY: 7, maxY: 12 },
  "阿奇布魯克": { minX: 25, maxX: 30, minY: 7, maxY: 12 },
  "西莫代爾": { minX: 1, maxX: 6, minY: 13, maxY: 18 },
  "黎明丘": { minX: 7, maxX: 12, minY: 13, maxY: 18 },
  "哈弗布魯克": { minX: 13, maxX: 18, minY: 13, maxY: 18 },
  "南摩赫斯特": { minX: 19, maxX: 24, minY: 13, maxY: 18 },
  "狼堡": { minX: 25, maxX: 30, minY: 13, maxY: 18 },
};

// 1. 座標與城市對應判定邏輯
function getQuestCoord(q) {
  const directX = q.xcoord ?? q.x ?? q['data-xcoord'];
  const directY = q.ycoord ?? q.y ?? q['data-ycoord'];
  
  if (directX !== undefined && directY !== undefined && directX !== null && directX !== '') {
    return { x: Number(directX), y: Number(directY) };
  }

  let coordStr = q.selectedCoord || questSelectedCoordMap.get(q.id);
  if (coordStr) {
    const [x, y] = coordStr.split(',').map(Number);
    return { x, y };
  }
  return null;
}

function getQuestCity(q) {
  const coord = getQuestCoord(q);
  if (coord) {
    for (const [cityName, range] of Object.entries(regionRanges)) {
      if (coord.x >= range.minX && coord.x <= range.maxX && coord.y >= range.minY && coord.y <= range.maxY) {
        return cityName; 
      }
    }
  }
  return q.city || '未標註';
}

// 2. 任務列表過濾與渲染主函式
window.filterQuests = function() {
  const keyword = document.getElementById('search').value.toLowerCase();
  const cityFilter = document.getElementById('filter-city').value;
  const typeFilter = document.getElementById('filter-type').value;
  const statusFilter = document.getElementById('filter-status').value;

  const tbody = document.getElementById('hudTableBody');
  tbody.innerHTML = '';

  const filtered = globalQuestData.filter(q => {
    const building = (q.building || '').toLowerCase();
    const type = (q.task_type || q.type || '').toLowerCase();
    const notes = (q.notes || '').toLowerCase();
    const status = q.status || (q.active ? 'completed' : 'pending');

    const effectiveCity = getQuestCity(q);
    const matchKeyword = !keyword || building.includes(keyword) || effectiveCity.toLowerCase().includes(keyword) || type.includes(keyword) || notes.includes(keyword);
    
    let matchCity = true;
    if (cityFilter) {
      matchCity = (effectiveCity === cityFilter);
    }

    const matchType = !typeFilter || (q.task_type === typeFilter || q.type === typeFilter);
    const matchStatus = !statusFilter || status === statusFilter;

    return matchKeyword && matchCity && matchType && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #8b949e; padding: 20px;">沒有找到符合條件的任務</td></tr>`;
    return;
  }

  filtered.forEach(q => {
    const qId = q.id;
    const currentStatus = q.status || (q.active ? 'completed' : 'pending');
    const isLocked = lockedQuestIds.has(qId);
    const displayCity = getQuestCity(q);
    const isNearRoute = (() => {
      const coord = q.selectedCoord || questSelectedCoordMap.get(qId);
      return coord && nearRouteCoords.has(coord);
    })();
    const nearRouteBadge = isNearRoute ? `<span style="color:#60a5fa; font-size:11px;">[路線附近]</span>` : '';

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #1f2937';
    if (isLocked) tr.style.opacity = '0.7';

    tr.innerHTML = `
      <td style="padding: 10px;"><b>${q.building || '未指定建築'}</b> ${nearRouteBadge}</td>
      <td style="padding: 10px;">${displayCity}</td>
      <td style="padding: 10px;">${q.task_type || q.type || '一般任務'}</td>
      <td style="padding: 10px;">
        <div style="display: flex; gap: 6px;">
          <button onclick="window.goToNotesPage('${qId}')" style="padding: 4px 10px; background: #374151; color: #60a5fa; border: 1px solid #4b5563; border-radius: 4px; cursor: pointer; font-size: 12px;">📖 更多備註</button>
          <button onclick="window.goToEditPage('${qId}')" style="padding: 4px 10px; background: #1e3a8a; color: #93c5fd; border: 1px solid #3b82f6; border-radius: 4px; cursor: pointer; font-size: 12px;">⚙️ 編輯詳情</button>
        </div>
      </td>
      <td style="padding: 10px;">
        <select onchange="window.updateQuestStatusInSupabase('${qId}', this.value)" style="background: #1f2937; color: #fff; border: 1px solid #4b5563; padding: 4px; border-radius: 4px;">
          <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>⭕ 未完成</option>
          <option value="show" ${currentStatus === 'show' ? 'selected' : ''}>👁️ 顯示中</option>
          <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>✅ 已完成</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

// 3. 視圖跳轉控制函式 (編輯頁面)
window.goToEditPage = function(qId) {
  const targetQuest = globalQuestData.find(q => q.id === qId);
  if (!targetQuest) return;

  document.getElementById('page-task-id').value = qId;
  document.getElementById('page-edit-building').value = targetQuest.building || '';
  document.getElementById('page-edit-xcoord').value = targetQuest.xcoord ?? targetQuest.x ?? '';
  document.getElementById('page-edit-ycoord').value = targetQuest.ycoord ?? targetQuest.y ?? '';
  document.getElementById('page-edit-notes').value = targetQuest.notes || '';

  document.getElementById('main-dashboard-view').style.display = 'none';
  document.getElementById('task-edit-page-view').style.display = 'block';
  window.scrollTo(0, 0);
};

window.goBackToMain = function() {
  document.getElementById('task-edit-page-view').style.display = 'none';
  document.getElementById('main-dashboard-view').style.display = 'block';
  window.scrollTo(0, 0);
};

window.saveTaskAndReturnMain = async function() {
  const qId = document.getElementById('page-task-id').value;
  const building = document.getElementById('page-edit-building').value.trim();
  const xcoord = document.getElementById('page-edit-xcoord').value ? Number(document.getElementById('page-edit-xcoord').value) : null;
  const ycoord = document.getElementById('page-edit-ycoord').value ? Number(document.getElementById('page-edit-ycoord').value) : null;
  const notes = document.getElementById('page-edit-notes').value;

  const targetQuest = globalQuestData.find(q => q.id === qId);
  if (targetQuest) {
    targetQuest.building = building;
    targetQuest.xcoord = xcoord;
    targetQuest.ycoord = ycoord;
    targetQuest.notes = notes;
  }

  const { error } = await supabase.from('task').update({ building, xcoord, ycoord, notes }).eq('id', qId);
  if (error) {
    console.error('儲存失敗:', error);
    alert('儲存失敗！');
    return;
  }

  window.goBackToMain();
  window.filterQuests();
};

// 4. 視圖跳轉控制函式 (備註與協作歷史頁面)
window.goToNotesPage = function(qId) {
  const targetQuest = globalQuestData.find(q => q.id === qId);
  if (!targetQuest) return;

  document.getElementById('notes-page-task-id').value = qId;
  document.getElementById('notes-page-quest-title').innerText = `${targetQuest.building || '未指定建築'} (${getQuestCity(targetQuest)})`;
  document.getElementById('notes-page-history-box').innerText = targetQuest.notes ? targetQuest.notes : '目前尚無備註記錄。';
  document.getElementById('notes-page-new-input').value = '';

  document.getElementById('main-dashboard-view').style.display = 'none';
  document.getElementById('task-notes-page-view').style.display = 'block';
  window.scrollTo(0, 0);
};

window.goBackToMainFromNotes = function() {
  document.getElementById('task-notes-page-view').style.display = 'none';
  document.getElementById('main-dashboard-view').style.display = 'block';
  window.scrollTo(0, 0);
};

window.saveNewNoteAndReturn = async function() {
  const qId = document.getElementById('notes-page-task-id').value;
  const newText = document.getElementById('notes-page-new-input').value.trim();
  const targetQuest = globalQuestData.find(q => q.id === qId);
  if (!targetQuest) return;

  if (newText) {
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user ? user.email : '匿名訪客';

    const now = new Date();
    const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const noteEntry = `[${timeStr}] ${userEmail}: ${newText}`;

    const oldNotes = targetQuest.notes || '';
    const updatedNotes = oldNotes ? `${oldNotes}\n${noteEntry}` : noteEntry;
    targetQuest.notes = updatedNotes;

    const { error } = await supabase.from('task').update({ notes: updatedNotes }).eq('id', qId);
    if (error) {
      console.error('儲存備註失敗:', error);
      alert('儲存備註失敗！');
      return;
    }
  }

  window.goBackToMainFromNotes();
  window.filterQuests();
};
