import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://yasnbvmngdxkukuxvafc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc25idm1uZ2R4a3VrdXh2YWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4Mjc0MzUsImV4cCI6MjEwMjQwMzQzNX0.ht7XqIdRczGIdVE-oljEplFLEOHyxb7zZSI_pnDDP4w';
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // 將儲存方式從 localStorage 改為 sessionStorage
    // 這樣當用戶關閉該瀏覽器分頁時，Session 就會自動清除
    storage: window.sessionStorage, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 區域範圍定義（用於自動推導城市/區域名稱）
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

let questHighlightColors = {
  pending: localStorage.getItem('color_pending') || 'rgba(239, 68, 68, 0.6)',     // 預設紅
  show: localStorage.getItem('color_show') || 'rgba(59, 130, 246, 0.6)',          // 預設藍
  completed: localStorage.getItem('color_completed') || 'rgba(16, 185, 129, 0.6)',// 預設綠
  locked: localStorage.getItem('color_locked') || 'rgba(246, 173, 85, 0.9)'       // 預設橘
};

let globalQuestData = [];
let globalRouteMapData = []; 
let lockedQuestIds = new Set();  
let questSelectedCoordMap = new Map();
let currentSortColumn = null;
let isAscending = true;

// 網頁載入完成後初始化
window.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  await fetchMapData();
  await fetchQuestData();

  // Supabase 即時變更訂閱 (Realtime)
  supabase
    .channel('public-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'map' }, () => {
      fetchMapData();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
      fetchQuestData();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'task_notes' }, () => {
      fetchQuestData();
    })
    .subscribe();
}

// 載入地圖資料
async function fetchMapData() {
  const { data, error } = await supabase.from('map').select('*');
  if (error) {
    console.error('載入 map 失敗:', error);
    return;
  }
  globalRouteMapData = (data || []).map(raw => ({
    x: parseInt(raw.x || 0),
    y: parseInt(raw.y || 0),
    city: raw.district || raw.city || "",
    buildings: raw.buildings || []
  }));
  renderMap(globalRouteMapData);
}

// 載入任務資料與獨立的 task_notes 備註資料
async function fetchQuestData() {
  const tableBody = document.getElementById('hudTableBody');
  if (tableBody) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #8b949e; padding: 20px;">載入任務與備註資料中...</td></tr>`;
  }

  const { data: tasksData, error: taskError } = await supabase
    .from('tasks')
    .select(`
      *,
      task_notes (
        notes,
        credits,
        created_at
      )
    `);

  if (taskError) {
    console.error('載入 tasks 失敗:', taskError);
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #e53e3e; padding: 20px;">載入失敗: ${taskError.message}</td></tr>`;
    }
    return;
  }

  globalQuestData = (tasksData || []).map(doc => {
    let cleanNotes = '';
    if (doc.task_notes && Array.isArray(doc.task_notes) && doc.task_notes.length > 0) {
      cleanNotes = doc.task_notes
        .map(n => {
          if (!n || !n.notes) return '';
          // 🔥 關鍵修復：將所有的 \t (Tab) 換成普通空白，並清除每行前後多餘空白
          return String(n.notes)
            .replace(/\t/g, ' ') 
            .split('\n')
            .map(line => line.trim())
            .join('\n');
        })
        .filter(Boolean)
        .join('\n');
    } else {
      cleanNotes = doc.notes 
        ? String(doc.notes).replace(/\t/g, ' ').split('\n').map(line => line.trim()).join('\n') 
        : '';
    }

    return {
      ...doc,
      id: doc.id,
      cleanNotes: cleanNotes,
      task_notes: doc.task_notes || [] 
    };
  });
  updateFilterOptions();
  restoreFilterState();
  updateMapHighlights(); 
  window.filterQuests();
}
// 取得任務座標
function getQuestCoord(q) {
  if (q.x !== undefined && q.y !== undefined && q.x !== null && q.x !== '') {
    return { x: Number(q.x), y: Number(q.y) };
  }
  let coordStr = questSelectedCoordMap.get(q.id);
  if (coordStr) {
    const [x, y] = coordStr.split(',').map(Number);
    return { x, y };
  }
  return null;
}

// 根據座標推導城市名稱
function getCityNameByCoord(x, y, originalCity) {
  if (originalCity && originalCity.trim() !== '' && originalCity.trim() !== '未標註') {
    return originalCity;
  }
  for (const [cityName, range] of Object.entries(regionRanges)) {
    if (x >= range.minX && x <= range.maxX && y >= range.minY && y <= range.maxY) {
      return cityName;
    }
  }
  return originalCity || '未標註';
}

function getQuestCity(q) {
  const coord = getQuestCoord(q);
  if (coord) {
    return getCityNameByCoord(coord.x, coord.y, q.city);
  }
  return q.city || '未標註';
}

// 渲染地圖格線
function renderMap(mapRawData) {
  const tableContainer = document.getElementById('map-table');
  if (!tableContainer) return;
  tableContainer.innerHTML = '';

  const nodeMap = new Map();
  mapRawData.forEach(item => nodeMap.set(`${item.x},${item.y}`, item));

  for (let y = 1; y <= 18; y++) {
    const tr = document.createElement('tr');
    for (let x = 1; x <= 30; x++) {
      const td = document.createElement('td');
      td.id = `cell-${x}-${y}`;
      const nodeData = nodeMap.get(`${x},${y}`);

      if (x % 6 === 0 && x < 30) td.classList.add('grid-border-right');
      if (y % 6 === 0 && y < 18) td.classList.add('grid-border-bottom');

      td.addEventListener('mouseenter', () => displayCoordInfo(nodeData, x, y));
      tr.appendChild(td);
    }
    tableContainer.appendChild(tr);
  }
  updateMapHighlights();
}

function hexToRgba(hex, alpha = 0.6) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

// 更新地圖上的任務高亮顯示（支援自定義顏色方塊）
window.focusQuestOnMap = function(questId, buildingName, cityName) {
  const qObj = globalQuestData.find(q => String(q.id) === String(questId));
  if (!qObj) {
    console.error("找不到對應的任務物件 ID:", questId);
    return;
  }

  const coord = getQuestCoord(qObj);
  if (!coord) {
    alert(`此任務無有效座標 (建築: ${buildingName})！`);
    return;
  }

  const { x, y } = coord;
  const coordKey = `${x},${y}`;
  const panelMsg = document.getElementById('panel-msg');

  // 檢查如果已經被標記/鎖定，再次點擊時則「取消標記」
  if (lockedQuestIds.has(questId)) {
    lockedQuestIds.delete(questId);
    questSelectedCoordMap.delete(questId);
    window.updateMapHighlights();

    if (panelMsg) {
      panelMsg.innerHTML = `❌ 已取消標記任務建築：<b>${buildingName}</b>`;
    }
    return;
  }

  // 若尚未被標記，則執行原本的鎖定與平滑捲動
  lockedQuestIds.add(questId);
  questSelectedCoordMap.set(questId, coordKey);
  window.updateMapHighlights();

  const targetCell = document.getElementById(`cell-${x}-${y}`);
  if (targetCell) {
    targetCell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    
    targetCell.style.transition = 'background-color 0.3s ease';
    const originalBg = targetCell.style.backgroundColor;
    targetCell.style.backgroundColor = '#f6ad55'; 
    setTimeout(() => {
      targetCell.style.backgroundColor = originalBg;
    }, 1200);
  }

  if (panelMsg) {
    panelMsg.innerHTML = `🎯 已定位任務建築：<b>${buildingName}</b> -> 座標 (X: ${x}, Y: ${y}) [${cityName || '未知城市'}]`;
  }
};

// 支援自定義顏色與狀態顯隱的更新高亮函式
window.updateMapHighlights = function() {
  document.querySelectorAll('.map-table td').forEach(td => {
    td.classList.remove('quest-completed-highlight', 'quest-pending-highlight', 'quest-locked-highlight');
    td.style.backgroundColor = ''; 
  });

  const showPending = document.getElementById('toggle-pending-vis')?.value !== 'hide';
  const showCompleted = document.getElementById('toggle-completed-vis')?.value !== 'hide';

  globalQuestData.forEach(q => {
    const coord = getQuestCoord(q);
    if (!coord) return;

    const targetCell = document.getElementById(`cell-${coord.x}-${coord.y}`);
    if (!targetCell) return;

    const status = q.status || 'pending';
    
    if (status === 'completed' && showCompleted) {
      targetCell.style.backgroundColor = questHighlightColors.completed;
    } else if (status === 'show' && showCompleted) {
      targetCell.style.backgroundColor = questHighlightColors.show;
    } else if (status !== 'completed' && showPending) {
      targetCell.style.backgroundColor = questHighlightColors.pending;
    }
  });

  lockedQuestIds.forEach(qId => {
    const coordStr = questSelectedCoordMap.get(qId);
    if (coordStr) {
      const [x, y] = coordStr.split(',').map(Number);
      const targetCell = document.getElementById(`cell-${x}-${y}`);
      if (targetCell) {
        targetCell.style.backgroundColor = questHighlightColors.locked;
      }
    }
  });
};

window.focusQuestOnMap = function(questId, buildingName, cityName) {
  const qObj = globalQuestData.find(q => String(q.id) === String(questId));
  if (!qObj) {
    console.error("找不到對應的任務物件 ID:", questId);
    return;
  }

  const coord = getQuestCoord(qObj);
  if (!coord) {
    alert(`此任務無有效座標 (建築: ${buildingName})！`);
    return;
  }

  const { x, y } = coord;
  const coordKey = `${x},${y}`;
  const panelMsg = document.getElementById('panel-msg');

  // 🔥 檢查如果已經被標記/鎖定，再次點擊時則「取消標記」
  if (lockedQuestIds.has(questId)) {
    lockedQuestIds.delete(questId);
    questSelectedCoordMap.delete(questId);
    window.updateMapHighlights(); // 更新地圖高亮

    if (panelMsg) {
      panelMsg.innerHTML = `❌ 已取消標記任務建築：<b>${buildingName}</b>`;
    }
    return; // 直接結束，不執行後續的聚焦與捲動
  }

  // 若尚未被標記，則執行原本的鎖定與平滑捲動
  lockedQuestIds.add(questId);
  questSelectedCoordMap.set(questId, coordKey);
  window.updateMapHighlights();

  const targetCell = document.getElementById(`cell-${x}-${y}`);
  if (targetCell) {
    targetCell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    
    targetCell.style.transition = 'background-color 0.3s ease';
    const originalBg = targetCell.style.backgroundColor;
    targetCell.style.backgroundColor = '#f6ad55'; 
    setTimeout(() => {
      targetCell.style.backgroundColor = originalBg;
    }, 1200);
  }

  if (panelMsg) {
    panelMsg.innerHTML = `🎯 已定位任務建築：<b>${buildingName}</b> -> 座標 (X: ${x}, Y: ${y}) [${cityName || '未知城市'}]`;
  }
};



// 更新任務狀態至 Supabase
import { createClient } from '@supabase/supabase-js'

// 初始化 Supabase
const supabase = createClient('supabaseUrl', 'supabaseKey')

async function updateTask(taskId, newStatus) {
  // 1. 確保 id 型態正確（對應你之前遇到的字串/數字問題，若資料庫是 bigint 建議先轉整數）
  const parsedId = parseInt(taskId, 10);

  // 2. 執行 Supabase 更新查詢
  const { data, error } = await supabase
    .from('tasks')                      // 你的資料表名稱
    .update({ status: newStatus })      // 要更新的欄位與內容
    .eq('id', parsedId)                 // 條件：WHERE id = parsedId
    .select();                          // 加上 .select() 可以讓資料庫回傳被更新的那筆資料（避免回傳空陣列 `[]`）

  // 3. 錯誤處理
  if (error) {
    console.error('❌ 更新失敗:', error.message);
    return;
  }

  // 4. 檢查是否有成功更新到資料（對應你先前遇到的「回傳陣列為空」狀況）
  if (!data || data.length === 0) {
    console.warn('⚠️ 更新語法正確，但在資料庫中找不到這個 ID 的任務！');
  } else {
    console.log('✅ 更新成功！', data);
  }
}

// 重設篩選條件
window.resetFilters = function() {
  const searchEl = document.getElementById('search');
  const cityEl = document.getElementById('filter-city');
  const typeEl = document.getElementById('filter-type');
  const statusEl = document.getElementById('filter-status');
  if (searchEl) searchEl.value = '';
  if (cityEl) cityEl.value = '';
  if (typeEl) typeEl.value = '';
  if (statusEl) statusEl.value = '';
  window.filterQuests();
};

// 滑鼠懸停地圖格子時顯示詳細資訊
function displayCoordInfo(data, x, y) {
  const detailsPanel = document.getElementById('panel-details');
  if (!detailsPanel) return;

  if (!data || !data.buildings || data.buildings.length === 0) {
    detailsPanel.innerHTML = `<strong>座標 (${x}, ${y})</strong>: 空地 / 無建築`;
    return;
  }

  const effectiveCity = getCityNameByCoord(x, y, data.city);
  let html = `<strong>🏢 建築物：</strong> ${data.buildings.join(', ')} (城市: ${effectiveCity})<br>`;
  
  let matchedQuests = globalQuestData.filter(q => {
    const coord = getQuestCoord(q);
    return coord && coord.x === x && coord.y === y;
  });

  if (matchedQuests.length > 0) {
    html += `<b style="color:#ffeb3b;">🎯 包含任務：</b><ul>`;
    matchedQuests.forEach(q => {
      const currentStatus = q.status || 'pending';
      let statusText = " (⭕ 未完成)";
      if (currentStatus === 'completed') statusText = " (✅ 已完成)";
      if (currentStatus === 'show') statusText = " (👁️ 顯示中)";
      html += `<li><b>${q.task_type || q.type || '任務'}</b> - ${q.building}${statusText}</li>`;
    });
    html += `</ul>`;
  } else {
    html += `<span style="color:#888;">此座標無當前任務</span>`;
  }
  detailsPanel.innerHTML = html;
}

// 記錄目前的排序欄位與方向
window.sortTable = function(columnKey) {
  if (currentSortColumn === columnKey) {
    isAscending = !isAscending;
  } else {
    currentSortColumn = columnKey;
    isAscending = true;
  }

  globalQuestData.sort((a, b) => {
    // 取得欄位對應的文字值
    const valA = String(a[columnKey] || '');
    const valB = String(b[columnKey] || '');

    // 使用中文語系拼音/筆劃順序進行純文字比較
    let result = valA.localeCompare(valB, 'zh-TW');

    return isAscending ? result : -result;
  });

  updateSortIcons(columnKey, isAscending);
  window.filterQuests();
};
// 更新表頭的排序箭頭圖示
function updateSortIcons(activeKey, isAsc) {
  document.querySelectorAll('th.sortable').forEach(th => {
    const key = th.getAttribute('data-sort');
    const icon = th.querySelector('.sort-icon');
    if (icon) {
      if (key === activeKey) {
        icon.textContent = isAsc ? ' ▲' : ' ▼';
        th.style.color = '#60a5fa'; // 高亮當前排序欄位
      } else {
        icon.textContent = ' ↕️';
        th.style.color = '#9ca3af';
      }
    }
  });
}

// 初始化色票選擇器數值與即時互動監聽
document.addEventListener('DOMContentLoaded', () => {
  const rgbToHex = (rgbaStr) => {
    const match = rgbaStr.match(/\d+/g);
    if (!match || match.length < 3) return '#000000';
    return '#' + [match[0], match[1], match[2]].map(x => {
      const hex = parseInt(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const pendingPicker = document.getElementById('picker-pending');
  const showPicker = document.getElementById('picker-show');
  const completedPicker = document.getElementById('picker-completed');
  const lockedPicker = document.getElementById('picker-locked');

  if (pendingPicker) pendingPicker.value = rgbToHex(questHighlightColors.pending);
  if (showPicker) showPicker.value = rgbToHex(questHighlightColors.show);
  if (completedPicker) completedPicker.value = rgbToHex(questHighlightColors.completed);
  if (lockedPicker) lockedPicker.value = rgbToHex(questHighlightColors.locked);

  const bindColorPicker = (pickerEl, key, alpha) => {
    if (!pickerEl) return;
    pickerEl.addEventListener('input', (e) => {
      const newRgba = hexToRgba(e.target.value, alpha);
      questHighlightColors[key] = newRgba;
      localStorage.setItem(`color_${key}`, newRgba);
      window.updateMapHighlights();
    });
  };

  bindColorPicker(pendingPicker, 'pending', 0.6);
  bindColorPicker(showPicker, 'show', 0.6);
  bindColorPicker(completedPicker, 'completed', 0.6);
  bindColorPicker(lockedPicker, 'locked', 0.9);
});

window.toggleDropdown = function(type) {
  const panel = document.getElementById(`panel-${type}`);
  const isVisible = panel.style.display === 'block';
  // 關閉所有其他下拉選單
  document.querySelectorAll('.dropdown-panel').forEach(p => p.style.display = 'none');
  
  panel.style.display = isVisible ? 'none' : 'block';
};

// 點擊畫面空白處自動關閉下拉選單
window.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-dropdown')) {
    document.querySelectorAll('.dropdown-panel').forEach(p => p.style.display = 'none');
  }
});

// 2. 自動儲存篩選狀態（改抓取 checkbox 的勾選狀態）
function saveFilterState() {
  const getCheckedValues = (name) => {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value);
  };

  const filterState = {
    city: getCheckedValues('city-checkbox'),
    search: document.getElementById('search')?.value || '',
    status: document.getElementById('filter-status')?.value || '',
    type: getCheckedValues('type-checkbox')
  };

  sessionStorage.setItem('questFilterState', JSON.stringify(filterState));
}

// 3. 恢復篩選條件
function restoreFilterState() {
  const savedStateJson = sessionStorage.getItem('questFilterState');
  if (!savedStateJson) return;

  try {
    const state = JSON.parse(savedStateJson);
    
    if (Array.isArray(state.city)) {
      state.city.forEach(val => {
        const cb = document.querySelector(`input[name="city-checkbox"][value="${val}"]`);
        if (cb) cb.checked = true;
      });
    }
    const searchInput = document.getElementById('search');
    if (searchInput && state.search) searchInput.value = state.search;

    const statusFilter = document.getElementById('filter-status');
    if (statusFilter && state.status) statusFilter.value = state.status;

    if (Array.isArray(state.type)) {
      state.type.forEach(val => {
        const cb = document.querySelector(`input[name="type-checkbox"][value="${val}"]`);
        if (cb) cb.checked = true;
      });
    }
    updateDropdownButtonText('city');
    updateDropdownButtonText('type');
  } catch (e) {
    console.error('恢復篩選條件失敗:', e);
  }
}

// 4. 更新按鈕上的顯示文字（例如：「已選擇 2 項」或「全部城市」）
function updateDropdownButtonText(type) {
  const checked = document.querySelectorAll(`input[name="${type}-checkbox"]:checked`);
  const textEl = document.getElementById(`${type}-toggle-text`);
  if (!textEl) return;

  if (checked.length === 0) {
    textEl.textContent = type === 'city' ? '全部城市' : '全部類型';
  } else if (checked.length === 1) {
    textEl.textContent = checked[0].value;
  } else {
    textEl.textContent = `已選擇 ${checked.length} 項`;
  }
}

// 5. 任務列表過濾邏輯
window.filterQuests = function() {
  saveFilterState();
  updateDropdownButtonText('city');
  updateDropdownButtonText('type');

  const keyword = document.getElementById('search')?.value.toLowerCase() || '';
  
  const selectedCities = Array.from(document.querySelectorAll('input[name="city-checkbox"]:checked')).map(cb => cb.value);
  const selectedTypes = Array.from(document.querySelectorAll('input[name="type-checkbox"]:checked')).map(cb => cb.value);
  const statusFilter = document.getElementById('filter-status')?.value || '';

  const tbody = document.getElementById('hudTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = globalQuestData.filter(q => {
    const building = (q.building || '').toLowerCase();
    const type = (q.task_type || q.type || '').toLowerCase();
    const notes = (q.cleanNotes || '').toLowerCase();
    const status = q.status || 'pending';
    const effectiveCity = getQuestCity(q);

    const matchKeyword = !keyword || building.includes(keyword) || effectiveCity.toLowerCase().includes(keyword) || type.includes(keyword) || notes.includes(keyword);
    
    const matchCity = selectedCities.length === 0 || selectedCities.includes(effectiveCity);
    const matchType = selectedTypes.length === 0 || selectedTypes.includes(q.task_type) || selectedTypes.includes(q.type);
    const matchStatus = !statusFilter || (status === statusFilter);

    return matchKeyword && matchCity && matchType && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #8b949e; padding: 20px;">沒有找到符合條件的任務</td></tr>`;
    return;
  }

  filtered.forEach(q => {
    const qId = q.id;
    const currentStatus = q.status || 'pending';
    const displayCity = getQuestCity(q);
    const rawNotes = (q.cleanNotes || '').trim();
    const formattedNotes = rawNotes ? rawNotes.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>') : '<span style="color: #6b7280; font-style: italic;">尚無備註</span>';
    const moreNotesButtonHtml = `<button onclick="window.location.href='notes.html?id=${qId}'" style="display: inline-block; margin-top: 6px; padding: 2px 8px; background: #1e3a8a; color: #93c5fd; border: none; border-radius: 3px; font-size: 11px; cursor: pointer;">📖 查看更多備註</button>`;

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #1f2937';
    tr.innerHTML = `
      <td style="padding: 10px; cursor: pointer; color: #60a5fa; vertical-align: top;" onclick="window.focusQuestOnMap('${qId}', '${q.building}', '${displayCity}')"><b>${q.building || '未指定建築'}</b></td>
      <td style="padding: 10px; vertical-align: top;">${displayCity}</td>
      <td style="padding: 10px; vertical-align: top;">${q.task_type || q.type || '一般任務'}</td>
      <td style="padding: 10px; width: 300px; max-width: 300px; vertical-align: top; word-break: break-all;"><div style="font-size: 12px; color: #e5e7eb; line-height: 1.4;">${formattedNotes}</div>${moreNotesButtonHtml}</td>
      <td style="padding: 10px; vertical-align: top;"><button onclick="window.location.href='edit.html?id=${qId}'" style="padding: 4px 10px; background: #374151; color: #60a5fa; border: 1px solid #4b5563; border-radius: 4px; cursor: pointer; font-size: 12px;">⚙️ 編輯詳情</button></td>
      <td style="padding: 10px; vertical-align: top;"><select onchange="window.updateQuestStatusInSupabase('${qId}', this.value)" style="background: #1f2937; color: #fff; border: 1px solid #4b5563; padding: 4px; border-radius: 4px; font-size: 12px;"><option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>⭕ 未完成</option><option value="show" ${currentStatus === 'show' ? 'selected' : ''}>👁️ 顯示中</option><option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>✅ 已完成</option></select></td>
    `;
    tbody.appendChild(tr);
  });
};

// 6. 動態生成下拉選單的 Checkbox 選項
function updateFilterOptions() {
  const cityPanel = document.getElementById('panel-city');
  const typePanel = document.getElementById('panel-type');
  if (!cityPanel || !typePanel) return;

  const currentSelectedCities = new Set(Array.from(document.querySelectorAll('input[name="city-checkbox"]:checked')).map(cb => cb.value));
  const currentSelectedTypes = new Set(Array.from(document.querySelectorAll('input[name="type-checkbox"]:checked')).map(cb => cb.value));

  const cities = new Set();
  const types = new Set();

  globalQuestData.forEach(q => {
    const c = getQuestCity(q);
    if (c) cities.add(c);
    const t = q.task_type || q.type;
    if (t) types.add(t);
  });

  cityPanel.innerHTML = '';
  Array.from(cities).sort().forEach(c => {
    const isChecked = currentSelectedCities.has(c) ? 'checked' : '';
    cityPanel.innerHTML += `<label style="display: flex; align-items: center; gap: 6px; padding: 4px 0; color: #e5e7eb; font-size: 12px; cursor: pointer;"><input type="checkbox" name="city-checkbox" value="${c}" ${isChecked} onchange="filterQuests()"> ${c}</label>`;
  });

  typePanel.innerHTML = '';
  Array.from(types).sort().forEach(t => {
    const isChecked = currentSelectedTypes.has(t) ? 'checked' : '';
    typePanel.innerHTML += `<label style="display: flex; align-items: center; gap: 6px; padding: 4px 0; color: #e5e7eb; font-size: 12px; cursor: pointer;"><input type="checkbox" name="type-checkbox" value="${t}" ${isChecked} onchange="filterQuests()"> ${t}</label>`;
  });

  updateDropdownButtonText('city');
  updateDropdownButtonText('type');
}

document.addEventListener('DOMContentLoaded', () => {
  // 取得目前網址的檔案名稱 (例如 index.html 或 高樓.html)
  const currentPath = decodeURIComponent(window.location.pathname.split('/').pop() || 'index.html');
  
  if (currentPath.includes('index') || currentPath === '') {
    document.getElementById('nav-index')?.classList.add('active');
  } else if (currentPath.includes('高樓')) {
    document.getElementById('nav-building')?.classList.add('active');
  }
});