import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6iCrgLn-5yh4bE4zudbaZ-lbzt4m-37w",
  authDomain: "df2-mission-system.firebaseapp.com",
  databaseURL: "https://df2-mission-system-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "df2-mission-system",
  storageBucket: "df2-mission-system.firebasestorage.app",
  messagingSenderId: "950389132060",
  appId: "1:950389132060:web:2577b9cb0724cb6c9388d9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.db = db;
window.COL_QUESTS = "task";
window.COL_MAP = "map";
window.FirebaseTools = { collection, updateDoc, doc, onSnapshot };

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

function initApp() {
  const completedPicker = document.getElementById('completed-color-picker');
  if (completedPicker) window.updateCompletedColor(completedPicker.value);

  const pendingPicker = document.getElementById('pending-color-picker');
  if (pendingPicker) window.updatePendingColor(pendingPicker.value);

  const { collection, onSnapshot } = window.FirebaseTools;

  onSnapshot(collection(window.db, window.COL_MAP), (snapshot) => {
    globalRouteMapData = [];
    snapshot.forEach((doc) => {
      const raw = doc.data();
      globalRouteMapData.push({
        x: parseInt(raw["data-xcoord"] || raw.x || 0),
        y: parseInt(raw["data-ycoord"] || raw.y || 0),
        city: raw["data-city"] || raw.city || "",
        buildings: typeof raw["data-buildings"] === 'string' 
          ? raw["data-buildings"].split(',').map(s => s.trim()).filter(Boolean) 
          : (raw.buildings || [])
      });
    });
    renderMap(globalRouteMapData);
    updateSystemDisplay();
  });

  onSnapshot(collection(window.db, window.COL_QUESTS), (snapshot) => {
    globalQuestData = [];
    snapshot.forEach((doc) => {
      globalQuestData.push({ id: doc.id, ...doc.data() });
    });
    updateFilterOptions();
    updateSystemDisplay();
    document.getElementById('sync-status').innerText = "(Firebase 即時連線)";
  });
}

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

function locateQuestByBuilding(questId, targetBuildingName, targetCityName) {
  if (!questId) return;

  if (lockedQuestIds.has(questId)) {
    lockedQuestIds.delete(questId);
    questSelectedCoordMap.delete(questId);
    recalculateLockedCoords();
    updateMapHighlights();
    document.getElementById('panel-details').innerHTML = `已取消鎖定：[${targetCityName || '無城市'}] ${targetBuildingName}`;
    window.filterQuests();
    return;
  }

  const qObj = globalQuestData.find(q => q.id === questId) || { building: targetBuildingName, city: targetCityName };
  const selectedCoordStr = selectSingleBuildingCoord(qObj);

  if (!selectedCoordStr) return;

  lockedQuestIds.add(questId);
  questSelectedCoordMap.set(questId, selectedCoordStr);

  recalculateLockedCoords();
  updateMapHighlights();

  document.getElementById('panel-details').innerHTML = `
    <strong>🎯 已精確鎖定單一點位：</strong><br>
    城市: ${targetCityName || '未標示'} | 座標: (${selectedCoordStr}) | 建築: ${targetBuildingName}
  `;

  window.filterQuests();
}

function recalculateLockedCoords() {
  lockedCoordsSet.clear();

  lockedQuestIds.forEach(questId => {
    const coordKey = questSelectedCoordMap.get(questId);
    if (coordKey) {
      lockedCoordsSet.add(coordKey);
    }
  });
}

function isQuestNearRoute(questBuilding, questCity) {
  if (!questBuilding || customLines.length === 0) return false;
  
  const qCity = (questCity || '').trim().toLowerCase();
  const qBuilding = (questBuilding || '').trim().toLowerCase();

  for (let coordStr of nearRouteCoords) {
    const [x, y] = coordStr.split(',').map(Number);
    const node = globalRouteMapData.find(n => n.x === x && n.y === y);
    if (node && node.buildings) {
      const nCity = (node.city || '').trim().toLowerCase();
      if (qCity && nCity && qCity !== nCity) continue;

      const isMatch = node.buildings.some(b => {
        const bClean = b.trim().toLowerCase();
        return bClean === qBuilding || bClean.includes(qBuilding);
      });
      if (isMatch) return true;
    }
  }
  return false;
}

function renderHUDTable(quests) {
  const tbody = document.getElementById('hudTableBody');
  tbody.innerHTML = '';

  if (!quests || quests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">沒有符合條件的任務資料</td></tr>';
    return;
  }

  quests.forEach(q => {
    const safeBuildingName = (q.building || '').replace(/'/g, "\\'");
    const safeCityName = (q.city || '').replace(/'/g, "\\'");
    const safeQuestId = q.id;

    const isNear = isQuestNearRoute(q.building, q.city);
    const isLocked = lockedQuestIds.has(q.id);
    const taskType = q.task_type || q.type || '任務';
    
    const currentStatus = q.status || (q.active ? 'completed' : 'pending');

    const tr = document.createElement('tr');
    if (isNear) tr.classList.add('near-route');
    if (currentStatus === 'completed') tr.classList.add('completed');
    if (isLocked) tr.classList.add('row-locked');

    tr.addEventListener('click', (e) => {
      if (['TEXTAREA', 'INPUT', 'BUTTON', 'SELECT', 'OPTION'].includes(e.target.tagName)) return;
      locateQuestByBuilding(safeQuestId, safeBuildingName, safeCityName);
    });

    tr.innerHTML = `
      <td>
        <strong style="color: #f0f6fc;">${q.building || '-'}</strong>
        ${isNear ? '<span class="badge-near">🌟 2格內</span>' : ''}
      </td>
      <td>${q.city || '未知'}</td>
      <td><span style="color: #e3b341; font-weight: 500;">${taskType}</span></td>
      <td>
        <div class="note-container">
          <textarea id="note-input-${q.id}" class="note-input-inline" placeholder="輸入多行備註...">${q.notes || ''}</textarea>
          <button class="btn-action" style="align-self: flex-end;" onclick="saveNote('${q.id}')">儲存</button>
        </div>
      </td>
      <td>
        <select class="status-select-dropdown status-${currentStatus}" onchange="changeQuestStatus('${q.id}', this.value)">
          <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>⭕ 未完成</option>
          <option value="show" ${currentStatus === 'show' ? 'selected' : ''}>👁️ 顯示</option>
          <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>✅ 已完成</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.sortTable = function(columnIndex) {
  const table = document.getElementById("missionTable");
  const tbody = document.getElementById("hudTableBody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const headers = table.querySelectorAll("th");

  if (rows.length <= 1 && rows[0].children.length === 1) return;

  if (currentSortColumn === columnIndex) {
    isAscending = !isAscending;
  } else {
    currentSortColumn = columnIndex;
    isAscending = true;
  }

  headers.forEach((header, index) => {
    header.classList.remove("asc", "desc");
    if (index === columnIndex) {
      header.classList.add(isAscending ? "asc" : "desc");
    }
  });

  rows.sort((a, b) => {
    let cellA = "";
    let cellB = "";

    if (columnIndex === 3) { 
      cellA = a.querySelector('textarea')?.value || "";
      cellB = b.querySelector('textarea')?.value || "";
    } else if (columnIndex === 4) {
      cellA = a.querySelector('select')?.value || "";
      cellB = b.querySelector('select')?.value || "";
    } else {
      cellA = a.children[columnIndex]?.innerText.trim() || "";
      cellB = b.children[columnIndex]?.innerText.trim() || "";
    }

    return isAscending 
      ? cellA.localeCompare(cellB, undefined, { numeric: true, sensitivity: 'base' })
      : cellB.localeCompare(cellA, undefined, { numeric: true, sensitivity: 'base' });
  });

  tbody.innerHTML = "";
  rows.forEach(row => tbody.appendChild(row));
};

window.changeQuestStatus = async function(docId, newStatus) {
  const { doc, updateDoc } = window.FirebaseTools;
  const questObj = globalQuestData.find(q => q.id === docId);

  let targetCoord = questObj ? questObj.selectedCoord : null;

  if ((newStatus === 'show' || newStatus === 'completed') && !targetCoord && questObj) {
    targetCoord = selectSingleBuildingCoord(questObj);
    if (!targetCoord) {
      window.filterQuests();
      return;
    }
  }

  try {
    const isCompleted = newStatus === 'completed';
    const updatePayload = { 
      status: newStatus,
      active: isCompleted 
    };

    if (targetCoord) {
      updatePayload.selectedCoord = targetCoord;
      questSelectedCoordMap.set(docId, targetCoord);
    }

    await updateDoc(doc(window.db, window.COL_QUESTS, docId), updatePayload);
  } catch (err) { 
    console.error(err); 
  }
};

window.saveNote = async function(docId) {
  const inputEl = document.getElementById(`note-input-${docId}`);
  if (!inputEl) return;
  const { doc, updateDoc } = window.FirebaseTools;
  try {
    await updateDoc(doc(window.db, window.COL_QUESTS, docId), { notes: inputEl.value.trim() });
    alert('備註已同步！');
  } catch (err) { console.error(err); }
};

window.filterQuests = function() {
  const query = document.getElementById('search').value.toLowerCase().trim();
  const cityFilter = document.getElementById('filter-city').value;
  const typeFilter = document.getElementById('filter-type').value;
  const statusFilter = document.getElementById('filter-status').value;

  const filtered = globalQuestData.filter(q => {
    const matchesQuery = !query || 
      (q.building || '').toLowerCase().includes(query) || 
      (q.city || '').toLowerCase().includes(query) || 
      (q.task_type || q.type || '').toLowerCase().includes(query) || 
      (q.notes || '').toLowerCase().includes(query);

    const matchesCity = !cityFilter || q.city === cityFilter;
    
    const qType = q.task_type || q.type || '';
    const matchesType = !typeFilter || qType === typeFilter;

    const currentStatus = q.status || (q.active ? 'completed' : 'pending');
    let matchesStatus = true;
    if (statusFilter) {
      matchesStatus = (currentStatus === statusFilter);
    }

    return matchesQuery && matchesCity && matchesType && matchesStatus;
  });

  renderHUDTable(filtered);
};

window.resetFilters = function() {
  document.getElementById('search').value = '';
  document.getElementById('filter-city').value = '';
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-status').value = '';
  document.getElementById('toggle-pending-vis').value = 'show';
  document.getElementById('toggle-completed-vis').value = 'show';
  window.filterQuests();
};