import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://yasnbvmngdxkukuxvafc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc25idm1uZ2R4a3VrdXh2YWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4Mjc0MzUsImV4cCI6MjEwMjQwMzQzNX0.ht7XqIdRczGIdVE-oljEplFLEOHyxb7zZSI_pnDDP4w';

const supabase = createClient(supabaseUrl, supabaseKey);
window.supabase = supabase;

let globalQuestData = [];
let globalRouteMapData = []; 
let completedHighlightCoords = new Set();
let pendingHighlightCoords = new Set();
let lockedCoordsSet = new Set(); 
let lockedQuestIds = new Set();  
let questSelectedCoordMap = new Map();
let nearRouteCoords = new Set(); 

const presetGreenCoords = new Set(["4,9", "14,15", "22,4"]);
const presetRedCoords = new Set([
  "11,15", "12,15", "11,16", "12,16",
  "19,3",  "20,3",  "19,4",  "20,4"
]);

let actionStartCoord = null; 
let customLines = []; 

let currentSortColumn = -1;
let isAscending = true;

window.addEventListener('DOMContentLoaded', () => {
  initApp();
  initAuth();
});

function hexToRgba(hex, alpha = 0.75) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

window.updateCompletedColor = function(hexColor) {
  const rgbaColor = hexToRgba(hexColor, 0.75);
  document.documentElement.style.setProperty('--completed-color', rgbaColor);
};

window.updatePendingColor = function(hexColor) {
  const rgbaColor = hexToRgba(hexColor, 0.75);
  document.documentElement.style.setProperty('--pending-color', rgbaColor);
};

async function initApp() {
  const completedPicker = document.getElementById('completed-color-picker');
  if (completedPicker) window.updateCompletedColor(completedPicker.value);

  const pendingPicker = document.getElementById('pending-color-picker');
  if (pendingPicker) window.updatePendingColor(pendingPicker.value);

  await fetchMapData();
  await fetchQuestData();

  // Supabase 即時訂閱 Realtime 變更
  supabase
    .channel('public-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'map' }, () => {
      fetchMapData();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'task' }, () => {
      fetchQuestData();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        document.getElementById('sync-status').innerText = "(Supabase 即時連線)";
      }
    });
}

async function fetchMapData() {
  const { data, error } = await supabase.from('map').select('*');
  if (error) {
    console.error('載入 map 失敗:', error);
    return;
  }
  globalRouteMapData = (data || []).map(raw => ({
    x: parseInt(raw["data-xcoord"] || raw.x || 0),
    y: parseInt(raw["data-ycoord"] || raw.y || 0),
    city: raw["data-city"] || raw.city || "",
    buildings: typeof raw["data-buildings"] === 'string' 
      ? raw["data-buildings"].split(',').map(s => s.trim()).filter(Boolean) 
      : (raw.buildings || [])
  }));
  renderMap(globalRouteMapData);
  updateSystemDisplay();
}

async function fetchQuestData() {
  const { data, error } = await supabase.from('task').select('*');
  if (error) {
    console.error('載入 task 失敗:', error);
    return;
  }
  globalQuestData = (data || []).map(doc => ({ id: doc.id, ...doc }));
  updateFilterOptions();
  updateSystemDisplay();
}

// 更新任務狀態至 Supabase
window.updateQuestStatusInSupabase = async function(id, newStatus) {
  const { error } = await supabase
    .from('task')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    console.error('更新狀態失敗:', error);
    alert('更新失敗！');
  }
};

// 更新任務備註至 Supabase
window.updateQuestNotesInSupabase = async function(id, newNotes) {
  const { error } = await supabase
    .from('task')
    .update({ notes: newNotes })
    .eq('id', id);

  if (error) {
    console.error('更新備註失敗:', error);
  }
};

function updateFilterOptions() {
  const citySelect = document.getElementById('filter-city');
  const typeSelect = document.getElementById('filter-type');

  const currentCity = citySelect.value;
  const currentType = typeSelect.value;

  const cities = new Set();
  const types = new Set();

  globalQuestData.forEach(q => {
    if (q.city) cities.add(q.city);
    const t = q.task_type || q.type;
    if (t) types.add(t);
  });

  citySelect.innerHTML = '<option value="">全部城市</option>';
  Array.from(cities).sort().forEach(c => {
    citySelect.innerHTML += `<option value="${c}" ${c === currentCity ? 'selected' : ''}>${c}</option>`;
  });

  typeSelect.innerHTML = '<option value="">全部類型</option>';
  Array.from(types).sort().forEach(t => {
    typeSelect.innerHTML += `<option value="${t}" ${t === currentType ? 'selected' : ''}>${t}</option>`;
  });
}

function renderMap(mapRawData) {
  const tableContainer = document.getElementById('map-table');
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

      td.addEventListener('mouseenter', () => displayCoordInfo(nodeData));
      td.addEventListener('click', (e) => handleMapCellClick(x, y, e.shiftKey));

      tr.appendChild(td);
    }
    tableContainer.appendChild(tr);
  }
  updateMapHighlights();
  renderCustomLines();
}

function handleMapCellClick(x, y, isDeleteMode) {
  if (!isDeleteMode) {
    if (!actionStartCoord) {
      actionStartCoord = { x, y };
      updateMapHighlights();
      document.getElementById('panel-msg').innerHTML = `<span style="color: #ffeb3b; font-weight: bold;">✏️ 畫線起點設在 (${x}, ${y})。請點擊下一個格子以延伸路線！</span>`;
    } else {
      const x1 = actionStartCoord.x;
      const y1 = actionStartCoord.y;
      const x2 = x;
      const y2 = y;

      customLines.push({ x1, y1, x2, y2 });
      actionStartCoord = { x: x2, y: y2 };

      updateNearRouteCoords();
      updateMapHighlights();
      renderCustomLines();
      window.filterQuests();
      document.getElementById('panel-msg').innerHTML = `<span style="color: #4caf50; font-weight: bold;">✏️ 已新增路線！</span>`;
    }
  } else {
    if (!actionStartCoord) {
      actionStartCoord = { x, y };
      updateMapHighlights();
      document.getElementById('panel-msg').innerHTML = `<span style="color: #f44336; font-weight: bold;">🗑️ 刪除起點設在 (${x}, ${y})。請點擊要取消的相鄰點！</span>`;
    } else {
      const x1 = actionStartCoord.x;
      const y1 = actionStartCoord.y;
      const x2 = x;
      const y2 = y;

      const initialLength = customLines.length;
      customLines = customLines.filter(line => {
        const matchForward = (line.x1 === x1 && line.y1 === y1 && line.x2 === x2 && line.y2 === y2);
        const matchBackward = (line.x1 === x2 && line.y1 === y2 && line.x2 === x1 && line.y2 === y1);
        return !(matchForward || matchBackward);
      });

      if (customLines.length < initialLength) {
        actionStartCoord = { x: x2, y: y2 };
        updateNearRouteCoords();
        updateMapHighlights();
        renderCustomLines();
        window.filterQuests();
        document.getElementById('panel-msg').innerHTML = `<span style="color: #f44336; font-weight: bold;">🗑️ 已取消路線段</span>`;
      } else {
        actionStartCoord = { x, y };
        updateMapHighlights();
      }
    }
  }
}

function updateNearRouteCoords() {
  nearRouteCoords.clear();
  if (customLines.length === 0) return;

  let routePoints = new Set();
  customLines.forEach(line => {
    const minX = Math.min(line.x1, line.x2);
    const maxX = Math.max(line.x1, line.x2);
    const minY = Math.min(line.y1, line.y2);
    const maxY = Math.max(line.y1, line.y2);
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        routePoints.add(`${x},${y}`);
      }
    }
  });

  globalRouteMapData.forEach(node => {
    let isNear = false;
    for (let ptStr of routePoints) {
      const [px, py] = ptStr.split(',').map(Number);
      const dist = Math.max(Math.abs(node.x - px), Math.abs(node.y - py));
      if (dist <= 2) {
        isNear = true;
        break;
      }
    }
    
    if (isNear && node.buildings) {
      const hasMatchingQuest = node.buildings.some(b => {
        return globalQuestData.some(q => {
          const qCity = (q.city || '').trim().toLowerCase();
          const qBuilding = (q.building || '').trim().toLowerCase();
          const nCity = (node.city || '').trim().toLowerCase();
          const bName = b.trim().toLowerCase();
          
          if (qCity && nCity && qCity !== nCity) return false;
          return bName === qBuilding || bName.includes(qBuilding);
        });
      });

      if (hasMatchingQuest) {
        nearRouteCoords.add(`${node.x},${node.y}`);
      }
    }
  });
}

function renderCustomLines() {
  const svg = document.getElementById('map-svg');
  svg.innerHTML = ''; 

  customLines.forEach(line => {
    const cx1 = (line.x1 - 1) * 32 + 16;
    const cy1 = (line.y1 - 1) * 32 + 16;
    const cx2 = (line.x2 - 1) * 32 + 16;
    const cy2 = (line.y2 - 1) * 32 + 16;

    const lineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineEl.setAttribute("x1", cx1);
    lineEl.setAttribute("y1", cy1);
    lineEl.setAttribute("x2", cx2);
    lineEl.setAttribute("y2", cy2);
    lineEl.setAttribute("stroke", "#ffffff"); 
    lineEl.setAttribute("stroke-width", "3");   
    lineEl.setAttribute("stroke-linecap", "round");
    svg.appendChild(lineEl);
  });
}

function updateSystemDisplay() {
  completedHighlightCoords.clear();
  pendingHighlightCoords.clear();

  globalQuestData.forEach(q => {
    const status = q.status || (q.active ? 'completed' : 'pending');
    let targetCoord = q.selectedCoord || questSelectedCoordMap.get(q.id);

    if (targetCoord) {
      if (status === 'completed') {
        completedHighlightCoords.add(targetCoord);
      } else if (status === 'show' || status === 'pending') {
        pendingHighlightCoords.add(targetCoord);
      }
    } else {
      const qCity = (q.city || '').trim().toLowerCase();
      const qBuilding = (q.building || '').trim().toLowerCase();

      if (!qBuilding) return;

      const matchedNodes = globalRouteMapData.filter(node => {
        const nodeCity = (node.city || '').trim().toLowerCase();
        if (qCity && nodeCity && qCity !== nodeCity) return false;
        return node.buildings && node.buildings.some(b => {
          const bClean = b.trim().toLowerCase();
          return bClean === qBuilding || bClean.includes(qBuilding);
        });
      });

      if (matchedNodes.length === 1) {
        const coordKey = `${matchedNodes[0].x},${matchedNodes[0].y}`;
        if (status === 'completed') {
          completedHighlightCoords.add(coordKey);
        } else if (status === 'show' || status === 'pending') {
          pendingHighlightCoords.add(coordKey);
        }
      }
    }
  });

  updateNearRouteCoords();
  recalculateLockedCoords();
  updateMapHighlights();
  window.filterQuests();
}

function recalculateLockedCoords() {
  lockedCoordsSet.clear();
  lockedQuestIds.forEach(qId => {
    const coord = questSelectedCoordMap.get(qId);
    if (coord) lockedCoordsSet.add(coord);
  });
}

window.updateMapHighlights = function() {
  document.querySelectorAll('.map-table td').forEach(td => {
    td.classList.remove('highlight');
    td.classList.remove('quest-completed-highlight');
    td.classList.remove('quest-pending-highlight');
    td.classList.remove('quest-locked-highlight');
    td.classList.remove('near-route-highlight');
    td.classList.remove('custom-line-start');
    td.innerText = '';
  });

  presetGreenCoords.forEach(coordKey => {
    const [x, y] = coordKey.split(',');
    const targetCell = document.getElementById(`cell-${x}-${y}`);
    if (targetCell) targetCell.classList.add('highlight');
  });

  presetRedCoords.forEach(coordKey => {
    const [x, y] = coordKey.split(',');
    const targetCell = document.getElementById(`cell-${x}-${y}`);
    if (targetCell) targetCell.classList.add('quest-locked-highlight');
  });

  const showPending = document.getElementById('toggle-pending-vis')?.value === 'show';
  if (showPending) {
    pendingHighlightCoords.forEach(coordKey => {
      const [x, y] = coordKey.split(',');
      const targetCell = document.getElementById(`cell-${x}-${y}`);
      if (targetCell) targetCell.classList.add('quest-pending-highlight');
    });
  }

  const showCompleted = document.getElementById('toggle-completed-vis')?.value === 'show';
  if (showCompleted) {
    completedHighlightCoords.forEach(coordKey => {
      const [x, y] = coordKey.split(',');
      const targetCell = document.getElementById(`cell-${x}-${y}`);
      if (targetCell) targetCell.classList.add('quest-completed-highlight');
    });
  }

  lockedCoordsSet.forEach(coordKey => {
    const [x, y] = coordKey.split(',');
    const targetCell = document.getElementById(`cell-${x}-${y}`);
    if (targetCell) targetCell.classList.add('quest-locked-highlight');
  });

  nearRouteCoords.forEach(coordKey => {
    const [x, y] = coordKey.split(',');
    const targetCell = document.getElementById(`cell-${x}-${y}`);
    if (targetCell && 
        !targetCell.classList.contains('quest-completed-highlight') && 
        !targetCell.classList.contains('quest-pending-highlight') &&
        !targetCell.classList.contains('quest-locked-highlight')) {
      targetCell.classList.add('near-route-highlight');
    }
  });

  if (actionStartCoord) {
    const startCell = document.getElementById(`cell-${actionStartCoord.x}-${actionStartCoord.y}`);
    if (startCell) startCell.classList.add('custom-line-start');
  }
};

function displayCoordInfo(data) {
  const detailsPanel = document.getElementById('panel-details');
  if (!data || !data.buildings || data.buildings.length === 0) {
    detailsPanel.innerHTML = `<strong>位置資訊</strong>: 空地 / 無建築`;
    return;
  }
  let html = `<strong>🏢 建築物：</strong> ${data.buildings.join(', ')} (城市: ${data.city || '未標註'})<br>`;
  let matchedQuests = [];
  data.buildings.forEach(bName => {
    globalQuestData.forEach(q => {
      const qCity = (q.city || '').trim().toLowerCase();
      const qBuilding = (q.building || '').trim().toLowerCase();
      const nCity = (data.city || '').trim().toLowerCase();
      const bClean = bName.trim().toLowerCase();

      if ((!qCity || !nCity || qCity === nCity) && (bClean === qBuilding || bClean.includes(qBuilding))) {
        matchedQuests.push(q);
      }
    });
  });
  if (matchedQuests.length > 0) {
    html += `<b style="color:#ffeb3b;">🎯 包含任務與備註：</b><ul>`;
    matchedQuests.forEach(q => {
      const currentStatus = q.status || (q.active ? 'completed' : 'pending');
      let statusText = " (⭕ 未完成)";
      if (currentStatus === 'completed') statusText = " (✅ 已完成)";
      if (currentStatus === 'show') statusText = " (👁️ 顯示中)";

      const noteText = q.notes ? ` | 📝 備註: <span style="color:#ff9800;">${q.notes.replace(/\n/g, '<br>')}</span>` : "";
      const taskType = q.task_type || q.type || '任務';
      html += `<li><b>${taskType}</b> - 城市: <i>${q.city || '未知'}</i> (建築: ${q.building})${statusText}${noteText}</li>`;
    });
    html += `</ul>`;
  } else {
    html += `<span style="color:#888;">此區域無當前任務</span>`;
  }
  detailsPanel.innerHTML = html;
}

function selectSingleBuildingCoord(questObj) {
  const qCity = (questObj.city || '').trim().toLowerCase();
  const qBuilding = (questObj.building || '').trim().toLowerCase();

  if (!qBuilding) return null;

  const matchedNodes = globalRouteMapData.filter(node => {
    const nodeCity = (node.city || '').trim().toLowerCase();
    if (qCity && nodeCity && nodeCity !== qCity) return false;

    if (node.buildings && Array.isArray(node.buildings)) {
      return node.buildings.some(b => {
        const bName = b.trim().toLowerCase();
        return bName === qBuilding || bName.includes(qBuilding) || qBuilding.includes(bName);
      });
    }
    return false;
  });

  if (matchedNodes.length === 0) {
    alert(`地圖資料庫無符合「${questObj.city || ''} - ${questObj.building}」的點位！`);
    return null;
  }

  if (matchedNodes.length === 1) {
    return `${matchedNodes[0].x},${matchedNodes[0].y}`;
  }

  let optionsText = `找到 ${matchedNodes.length} 個符合條件的建築點位，請選擇要亮起哪一個：\n\n`;
  matchedNodes.forEach((node, index) => {
    optionsText += `${index + 1}. 座標 (${node.x}, ${node.y}) - 城市: ${node.city || '未標示'} [建築: ${node.buildings.join(', ')}]\n`;
  });
  optionsText += `\n請輸入號碼 (1 ~ ${matchedNodes.length}):`;

  const choice = prompt(optionsText, "1");
  if (choice === null) return null; 

  const chosenIndex = parseInt(choice, 10) - 1;
  if (isNaN(chosenIndex) || chosenIndex < 0 || chosenIndex >= matchedNodes.length) {
    alert("無效的選項！");
    return null;
  }

  return `${matchedNodes[chosenIndex].x},${matchedNodes[chosenIndex].y}`;
}

window.locateQuestByBuilding = function(questId, targetBuildingName, targetCityName) {
  if (!questId) return;

  if (lockedQuestIds.has(questId)) {
    lockedQuestIds.delete(questId);
    questSelectedCoordMap.delete(questId);
    recalculateLockedCoords();
    updateMapHighlights();
    window.filterQuests();
    document.getElementById('panel-msg').innerText = `已解除鎖定任務 ID: ${questId}`;
    return;
  }

  const qObj = globalQuestData.find(q => q.id === questId);
  if (!qObj) return;

  const chosenCoord = selectSingleBuildingCoord(qObj);
  if (chosenCoord) {
    lockedQuestIds.add(questId);
    questSelectedCoordMap.set(questId, chosenCoord);
    recalculateLockedCoords();
    updateMapHighlights();
    window.filterQuests();
    document.getElementById('panel-msg').innerHTML = `<span style="color:#4caf50;">成功鎖定建築點位座標 (${chosenCoord})！</span>`;
  }
};

window.filterQuests = function() {
  const keyword = document.getElementById('search').value.toLowerCase();
  const cityFilter = document.getElementById('filter-city').value;
  const typeFilter = document.getElementById('filter-type').value;
  const statusFilter = document.getElementById('filter-status').value;

  const tbody = document.getElementById('hudTableBody');
  tbody.innerHTML = '';

  const filtered = globalQuestData.filter(q => {
    const city = (q.city || '').toLowerCase();
    const building = (q.building || '').toLowerCase();
    const type = (q.task_type || q.type || '').toLowerCase();
    const notes = (q.notes || '').toLowerCase();
    const status = q.status || (q.active ? 'completed' : 'pending');

    const matchKeyword = !keyword || building.includes(keyword) || city.includes(keyword) || type.includes(keyword) || notes.includes(keyword);
    const matchCity = !cityFilter || q.city === cityFilter;
    const matchType = !typeFilter || (q.task_type === typeFilter || q.type === typeFilter);
    const matchStatus = !statusFilter || status === statusFilter;

    return matchKeyword && matchCity && matchType && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #8b949e; padding: 20px;">沒有找到符合條件的任務</td></tr>`;
    return;
  }

  filtered.forEach(q => {
    const tr = document.createElement('tr');
    const qId = q.id;
    const currentStatus = q.status || (q.active ? 'completed' : 'pending');
    const isLocked = lockedQuestIds.has(qId);
    if (isLocked) tr.classList.add('row-locked');
    if (currentStatus === 'completed') tr.classList.add('completed');

    const isNearRoute = (() => {
      const coord = q.selectedCoord || questSelectedCoordMap.get(qId);
      if (coord && nearRouteCoords.has(coord)) return true;
      return false;
    })();

    tr.onclick = (e) => {
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'OPTION') return;
      window.locateQuestByBuilding(qId, q.building, q.city);
    };

    const nearRouteBadge = isNearRoute ? `<span class="badge-near" title="此任務點位鄰近自訂路線 (距離 <= 2)">路線附近</span>` : '';

    tr.innerHTML = `
      <td><b>${q.building || '未指定建築'}</b> ${nearRouteBadge}</td>
      <td>${q.city || '未知城市'}</td>
      <td>${q.task_type || q.type || '一般任務'}</td>
      <td>
        <div class="note-container">
          <textarea class="note-input-inline" placeholder="輸入備註..." oninput="window.updateQuestNotesInSupabase('${qId}', this.value)">${q.notes || ''}</textarea>
        </div>
      </td>
      <td>
        <select class="status-select-dropdown status-${currentStatus}" onchange="window.updateQuestStatusInSupabase('${qId}', this.value)">
          <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>⭕ 未完成</option>
          <option value="show" ${currentStatus === 'show' ? 'selected' : ''}>👁️ 顯示中</option>
          <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>✅ 已完成</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

window.sortTable = function(columnIndex) {
  if (currentSortColumn === columnIndex) {
    isAscending = !isAscending;
  } else {
    currentSortColumn = columnIndex;
    isAscending = true;
  }

  document.querySelectorAll('.hud-table th').forEach((th, idx) => {
    th.classList.remove('asc', 'desc');
    if (idx === columnIndex) {
      th.classList.add(isAscending ? 'asc' : 'desc');
    }
  });

  globalQuestData.sort((a, b) => {
    let valA = '', valB = '';
    if (columnIndex === 0) { valA = a.building || ''; valB = b.building || ''; }
    else if (columnIndex === 1) { valA = a.city || ''; valB = b.city || ''; }
    else if (columnIndex === 2) { valA = a.task_type || a.type || ''; valB = b.task_type || b.type || ''; }
    else if (columnIndex === 3) { valA = a.notes || ''; valB = b.notes || ''; }
    else if (columnIndex === 4) { valA = a.status || ''; valB = b.status || ''; }

    const cmp = valA.localeCompare(valB, 'zh-Hant');
    return isAscending ? cmp : -cmp;
  });

  window.filterQuests();
};

window.resetFilters = function() {
  document.getElementById('search').value = '';
  document.getElementById('filter-city').value = '';
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-status').value = '';
  window.filterQuests();
};

// --- 登入系統相關邏輯 (已掛載至 window 供 HTML 呼叫) ---

window.handleSignUp = async function() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;

  if (!email || !password) {
    alert("請輸入 Email 與密碼！");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    alert("註冊失敗: " + error.message);
  } else {
    alert("註冊成功！系統已自動幫你登入。");
  }
};

window.handleSignIn = async function() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;

  if (!email || !password) {
    alert("請輸入 Email 與密碼！");
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    alert("登入失敗: " + error.message);
  } else {
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-password').value = '';
  }
};

window.handleSignOut = async function() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert("登出失敗: " + error.message);
  } else {
    alert("已成功登出");
  }
};

function updateAuthUI(user) {
  const loggedOutView = document.getElementById('logged-out-view');
  const loggedInView = document.getElementById('logged-in-view');
  const emailDisplay = document.getElementById('user-email-display');

  if (user) {
    loggedOutView.style.display = 'none';
    loggedInView.style.display = 'block';
    emailDisplay.textContent = user.email;
  } else {
    loggedOutView.style.display = 'block';
    loggedInView.style.display = 'none';
    emailDisplay.textContent = '';
  }
}

async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  updateAuthUI(session ? session.user : null);

  supabase.auth.onAuthStateChange((event, session) => {
    updateAuthUI(session ? session.user : null);
  });
}