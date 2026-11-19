import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://yasnbvmngdxkukuxvafc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc25idm1uZ2R4a3VrdXh2YWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4Mjc0MzUsImV4cCI6MjEwMjQwMzQzNX0.ht7XqIdRczGIdVE-oljEplFLEOHyxb7zZSI_pnDDP4w';
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: window.localStorage, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 多國語系字典與對照表
const translations = {
  'zh-TW': {
    pageTitle: "Dead Frontier 2 互動地圖 & Supabase 即時共享 HUD 系統",
    navBrand: "🗺️ 遊戲任務與高樓系統",
    navIndex: "主頁與地圖",
    navBuilding: "高樓資訊頁",
    notLoggedIn: "未登入",
    loginBtn: "登入",
    registerBtn: "註冊",
    headerTitle: "Dead Frontier 2 互動地圖",
    hudPanelTitle: "📜 Mission HUD Table",
    searchPlaceholder: "🔍 搜尋建築、城市、任務類型或備註...",
    filterCityLabel: "城市:",
    filterTypeLabel: "類型:",
    filterStatusLabel: "狀態:",
    allCities: "全部城市",
    allTypes: "全部類型",
    statusAll: "全部狀態",
    statusPending: "⭕ 未完成",
    statusShow: "👁️ 顯示中",
    statusCompleted: "✅ 已完成",
    visPendingLabel: "⭕ 未完成:",
    visShowLabel: "👁️ 顯示中:",
    visCompletedLabel: "✅ 已完成:",
    visLockedLabel: "🎯 鎖定:",
    optShow: "顯示",
    optHide: "隱藏",
    resetFiltersBtn: "重設篩選",
    thBuilding: "任務建築",
    thCity: "任務城市",
    thType: "任務類型",
    thNotes: "備註",
    thEdit: "編輯",
    thStatus: "狀態",
    loadingQuests: "載入任務資料中...",
    mapPanelTitle: "🗺️ 互動地圖繪製與鎖定",
    panelDefaultMsg: "點擊左側任務列可選擇指定同名點位進行鎖定",
    readFail: "讀取失敗"
  },
  'zh-CN': {
    pageTitle: "Dead Frontier 2 互动地图 & Supabase 实时共享 HUD 系统",
    navBrand: "🗺️ 游戏任务与高楼系统",
    navIndex: "主页与地图",
    navBuilding: "高楼信息页",
    notLoggedIn: "未登录",
    loginBtn: "登录",
    registerBtn: "注册",
    headerTitle: "Dead Frontier 2 互动地图",
    hudPanelTitle: "📜 Mission HUD Table",
    searchPlaceholder: "🔍 搜索建筑、城市、任务类型或备注...",
    filterCityLabel: "城市:",
    filterTypeLabel: "类型:",
    filterStatusLabel: "状态:",
    allCities: "全部城市",
    allTypes: "全部类型",
    statusAll: "全部状态",
    statusPending: "⭕ 未完成",
    statusShow: "👁️ 显示中",
    statusCompleted: "✅ 已完成",
    visPendingLabel: "⭕ 未完成:",
    visShowLabel: "👁️ 显示中:",
    visCompletedLabel: "✅ 已完成:",
    visLockedLabel: "🎯 锁定:",
    optShow: "显示",
    optHide: "隐藏",
    resetFiltersBtn: "重设筛选",
    thBuilding: "任务建筑",
    thCity: "任务城市",
    thType: "任务类型",
    thNotes: "备注",
    thEdit: "编辑",
    thStatus: "状态",
    loadingQuests: "加载任务数据中...",
    mapPanelTitle: "🗺️ 互动地图绘制与锁定",
    panelDefaultMsg: "点击左侧任务列表可选择指定同名点位进行锁定",
    readFail: "读取失败"
  }
};

// 城市與任務類型簡體/英文對照表
const localizationMap = {
  'zh-CN': {
    "拉文沃爾高地": "拉文沃尔高地", "阿班達爾公園": "阿班达尔公园", "木上村": "木上村",
    "灰木鎮": "灰木镇", "勒威伯里": "勒威伯里", "達爾博": "达尔博",
    "庫珀鎮": "库珀镇", "豐弓鎮狩獵區": "丰弓镇狩猎区", "丹茨維爾鎮": "丹茨维尔镇",
    "阿奇布魯克": "阿奇布鲁克", "西莫代尔": "西莫代尔", "黎明丘": "黎明丘",
    "哈弗布魯克": "哈弗布鲁克", "南摩赫斯特": "南摩赫斯特", "狼堡": "狼堡",
    "人類遺骸": "人类遗骸", "尋找物品": "寻找物品", "給東西": "给东西",
    "完成任務": "完成任务", "追靈者": "追灵者", "逃出": "逃出",
    "擊殺頭目": "击杀头目", "尋找死人": "寻找死人", "尋找活人": "寻找活人",
    "搜索物資": "搜索物资"
  }
};

function localizeText(text) {
  const lang = localStorage.getItem('selectedLang') || 'zh-TW';
  if (lang !== 'zh-TW' && localizationMap[lang] && localizationMap[lang][text]) {
    return localizationMap[lang][text];
  }
  return text;
}

// 全域語言切換函式
window.switchLanguage = async function(lang) {
  localStorage.setItem('selectedLang', lang);
  document.documentElement.setAttribute('lang', lang);
  
  // 更新靜態文字
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang] && translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });

  // 重新載入對應語系的資料表與畫面
  await fetchMapData();
  await fetchQuestData();
};

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

let questHighlightColors = {
  pending: localStorage.getItem('color_pending') || 'rgba(239, 68, 68, 0.6)',
  show: localStorage.getItem('color_show') || 'rgba(59, 130, 246, 0.6)',
  completed: localStorage.getItem('color_completed') || 'rgba(16, 185, 129, 0.6)',
  locked: localStorage.getItem('color_locked') || 'rgba(246, 173, 85, 0.9)'
};

let globalQuestData = [];
let globalRouteMapData = []; 
let lockedQuestIds = new Set();  
let questSelectedCoordMap = new Map();
let currentSortColumn = null;
let isAscending = true;

window.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('selectedLang') || 'zh-TW';
  const selectEl = document.getElementById('langSelect');
  if (selectEl) selectEl.value = savedLang;
  window.switchLanguage(savedLang);
});

async function initApp() {
  await fetchMapData();
  await fetchQuestData();

  const currentLang = localStorage.getItem('selectedLang') || 'zh-TW';
  let mapTable = "地圖";
  let questTable = "任務";
  if (currentLang === 'zh-CN') { mapTable = "地图"; questTable = "任务"; }

  supabase
    .channel('public-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: mapTable }, () => {
      fetchMapData();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: questTable }, () => {
      fetchQuestData();
    })
    .subscribe();
}

// 根據語系動態載入地圖資料表
async function fetchMapData() {
  const currentLang = localStorage.getItem('selectedLang') || 'zh-TW';
  let mapTableName = "地圖";
  if (currentLang === 'zh-CN') mapTableName = "地图";
  const { data, error } = await supabase.from(mapTableName).select('*');
  if (error) {
    console.error('載入 map 失敗:', error);
    return;
  }
  globalRouteMapData = (data || []).map(raw => ({
    x: parseInt(raw.x || raw.X || 0),
    y: parseInt(raw.y || raw.Y || 0),
    city: raw.district || raw.city || raw.城市 || "",
    buildings: raw.buildings || raw.建築 || []
  }));
  renderMap(globalRouteMapData);
}

// 根據語系動態載入任務資料表
async function fetchQuestData() {
  const currentLang = localStorage.getItem('selectedLang') || 'zh-TW';
  let questTableName = "任務";
  let notesTableName = "任務備註";
  if (currentLang === 'zh-CN') { questTableName = "任务"; notesTableName = "任務備註"; }
  const tableBody = document.getElementById('hudTableBody');
  if (tableBody) {
    const t = translations[currentLang] || translations['zh-TW'];
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #8b949e; padding: 20px;">${t.loadingQuests}</td></tr>`;
  }

  const { data: tasksData, error: taskError } = await supabase
    .from(questTableName)
    .select(`
      *,
      ${notesTableName} (
        備註,
        備註編輯者,
        創立時間
      )
    `);

  if (taskError) {
    console.error('載入 任務 失敗:', taskError);
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #e53e3e; padding: 20px;">載入失敗: ${taskError.message}</td></tr>`;
    }
    return;
  }

  globalQuestData = (tasksData || []).map(doc => {
    const notesArray = doc[notesTableName] || doc.任務備註 || doc.任务备注 || [];
    let cleanNotes = '';
    if (Array.isArray(notesArray) && notesArray.length > 0) {
      cleanNotes = notesArray
        .map(n => {
          const content = n.備註 || n.備忘 || n.notes || '';
          if (!content) return '';
          return String(content)
            .replace(/\t/g, ' ') 
            .split('\n')
            .map(line => line.trim())
            .join('\n');
        })
        .filter(Boolean)
        .join('\n');
    } else {
      cleanNotes = doc.notes || doc.備註 || '' 
        ? String(doc.notes || doc.備註).replace(/\t/g, ' ').split('\n').map(line => line.trim()).join('\n') 
        : '';
    }

    return {
      ...doc,
      id: doc.ID || doc.id,
      cleanNotes: cleanNotes,
      task_notes: notesArray 
    };
  });
  updateFilterOptions();
  restoreFilterState();
  updateMapHighlights(); 
  window.filterQuests();
}

function getQuestCoord(q) {
  if (q.X !== undefined && q.Y !== undefined && q.X !== null && q.X !== '') {
    return { x: Number(q.X), y: Number(q.Y) };
  }
  if (q.x !== undefined && q.y !== undefined && q.x !== null && q.x !== '') {
    return { x: Number(q.x), y: Number(q.y) };
  }
  let coordStr = questSelectedCoordMap.get(q.id) || questSelectedCoordMap.get(q.ID);
  if (coordStr) {
    const [x, y] = coordStr.split(',').map(Number);
    return { x, y };
  }
  return null;
}

function getCityNameByCoord(X, Y, originalCity) {
  if (originalCity && originalCity.trim() !== '' && originalCity.trim() !== '未標註') {
    return originalCity;
  }
  for (const [cityName, range] of Object.entries(regionRanges)) {
    if (X >= range.minX && X <= range.maxX && Y >= range.minY && Y <= range.maxY) {
      return cityName;
    }
  }
  return originalCity || '未標註';
}

function getQuestCity(q) {
  const coord = getQuestCoord(q);
  const rawCity = q.城市 || q.city || q.district;
  if (coord) {
    return getCityNameByCoord(coord.x, coord.y, rawCity);
  }
  return rawCity || '未標註';
}

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

    const status = q.狀態 || q.status || 'pending';
    
    if (status === 'completed' && showCompleted) {
      targetCell.style.backgroundColor = questHighlightColors.completed;
    } else if (status === 'show' && showCompleted) {
      targetCell.style.backgroundColor = questHighlightColors.show;
    } else if (status !== 'completed' && showPending) {
      targetCell.style.backgroundColor = questHighlightColors.pending;
    }
  });

  lockedQuestIds.forEach(qID => {
    const coordStr = questSelectedCoordMap.get(qID);
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
  const qObj = globalQuestData.find(q => String(q.id) === String(questId) || String(q.ID) === String(questId));
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

  if (lockedQuestIds.has(questId)) {
    lockedQuestIds.delete(questId);
    questSelectedCoordMap.delete(questId);
    window.updateMapHighlights();

    if (panelMsg) {
      panelMsg.innerHTML = `❌ 已取消標記任務建築：<b>${buildingName}</b>`;
    }
    return;
  }

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

window.updateQuestStatusInSupabase = async function(id, newStatus) {
  const parsedId = !isNaN(id) ? Number(id) : id;
  const currentLang = localStorage.getItem('selectedLang') || 'zh-TW';
  let questTableName = "任務";
  if (currentLang === 'EN') questTableName = "tasks_en";
  else if (currentLang === 'zh-CN') questTableName = "任务";

  const { data, error } = await supabase
    .from(questTableName)
    .update({ 狀態: newStatus })
    .eq('ID', parsedId)
    .select();

  if (error) {
    console.error('更新失敗，詳細錯誤:', error);
    alert(`更新失敗！\n錯誤代碼: ${error.code}\n錯誤訊息: ${error.message}`);
  } else {
    if (data && data.length > 0) {
      const target = globalQuestData.find(q => String(q.id) === String(id) || String(q.ID) === String(id));
      if (target) target.狀態 = newStatus;
      updateMapHighlights();
    } else {
      alert('更新失敗：資料庫找不到此任務 ID。');
    }
  }
};

window.resetFilters = function() {
  const searchEl = document.getElementById('search');
  const statusEl = document.getElementById('filter-status');
  if (searchEl) searchEl.value = '';
  if (statusEl) statusEl.value = '';
  window.filterQuests();
};

function displayCoordInfo(data, x, y) {
  const detailsPanel = document.getElementById('panel-details');
  if (!detailsPanel) return;

  const buildingsList = data?.buildings || data?.建築 || [];
  if (!data || buildingsList.length === 0) {
    detailsPanel.innerHTML = `<strong>座標 (${x}, ${y})</strong>: 空地 / 無建築`;
    return;
  }

  const effectiveCity = localizeText(getCityNameByCoord(x, y, data.city || data.城市));
  let html = `<strong>🏢 建築物：</strong> ${buildingsList.join(', ')} (城市: ${effectiveCity})<br>`;
  
  let matchedQuests = globalQuestData.filter(q => {
    const coord = getQuestCoord(q);
    return coord && coord.x === x && coord.y === y;
  });

  if (matchedQuests.length > 0) {
    html += `<b style="color:#ffeb3b;">🎯 包含任務：</b><ul>`;
    matchedQuests.forEach(q => {
      const currentStatus = q.狀態 || q.status || 'pending';
      let statusText = " (⭕ 未完成)";
      if (currentStatus === 'completed') statusText = " (✅ 已完成)";
      if (currentStatus === 'show') statusText = " (👁️ 顯示中)";
      const tType = localizeText(q.類型 || q.type || '任務');
      html += `<li><b>${tType}</b> - ${q.建築 || q.building}${statusText}</li>`;
    });
    html += `</ul>`;
  } else {
    html += `<span style="color:#888;">此座標無當前任務</span>`;
  }
  detailsPanel.innerHTML = html;
}

window.sortTable = function(columnKey) {
  if (currentSortColumn === columnKey) {
    isAscending = !isAscending;
  } else {
    currentSortColumn = columnKey;
    isAscending = true;
  }

  globalQuestData.sort((a, b) => {
    const valA = String(a[columnKey] || '');
    const valB = String(b[columnKey] || '');
    let result = valA.localeCompare(valB, 'zh-TW');
    return isAscending ? result : -result;
  });

  updateSortIcons(columnKey, isAscending);
  window.filterQuests();
};

function updateSortIcons(activeKey, isAsc) {
  document.querySelectorAll('th.sortable').forEach(th => {
    const key = th.getAttribute('data-sort');
    const icon = th.querySelector('.sort-icon');
    if (icon) {
      if (key === activeKey) {
        icon.textContent = isAsc ? ' ▲' : ' ▼';
        th.style.color = '#60a5fa';
      } else {
        icon.textContent = ' ↕️';
        th.style.color = '#9ca3af';
      }
    }
  });
}

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
  document.querySelectorAll('.dropdown-panel').forEach(p => p.style.display = 'none');
  panel.style.display = isVisible ? 'none' : 'block';
};

window.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-dropdown')) {
    document.querySelectorAll('.dropdown-panel').forEach(p => p.style.display = 'none');
  }
});

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

function updateDropdownButtonText(type) {
  const currentLang = localStorage.getItem('selectedLang') || 'zh-TW';
  const checked = document.querySelectorAll(`input[name="${type}-checkbox"]:checked`);
  const textEl = document.getElementById(`${type}-toggle-text`);
  if (!textEl) return;

  if (checked.length === 0) {
    if (type === 'city') {
      textEl.textContent = currentLang === 'EN' ? 'All Cities' : (currentLang === 'zh-CN' ? '全部城市' : '全部城市');
    } else {
      textEl.textContent = currentLang === 'EN' ? 'All Types' : (currentLang === 'zh-CN' ? '全部类型' : '全部類型');
    }
  } else if (checked.length === 1) {
    textEl.textContent = checked[0].value;
  } else {
    textEl.textContent = currentLang === 'EN' ? `${checked.length} selected` : (currentLang === 'zh-CN' ? `已选择 ${checked.length} 项` : `已選擇 ${checked.length} 項`);
  }
}

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
    const building = (q.建築 || q.building || '').toLowerCase();
    const type = (q.類型 || q.type || '').toLowerCase();
    const notes = (q.cleanNotes || '').toLowerCase();
    const status = q.狀態 || q.status || 'pending';
    const effectiveCity = getQuestCity(q);
    const localizedCity = localizeText(effectiveCity);

    const matchKeyword = !keyword || building.includes(keyword) || localizedCity.toLowerCase().includes(keyword) || type.includes(keyword) || notes.includes(keyword);
    const matchCity = selectedCities.length === 0 || selectedCities.includes(localizedCity) || selectedCities.includes(effectiveCity);
    const matchType = selectedTypes.length === 0 || selectedTypes.includes(q.類型) || selectedTypes.includes(q.type);
    const matchStatus = !statusFilter || (status === statusFilter);

    return matchKeyword && matchCity && matchType && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #8b949e; padding: 20px;">沒有找到符合條件的任務</td></tr>`;
    return;
  }

  filtered.forEach(q => {
    const qID = q.ID || q.id;
    const currentStatus = q.狀態 || q.status || 'pending';
    const displayCity = localizeText(getQuestCity(q));
    const buildingName = q.建築 || q.building || '未指定建築';
    const taskType = localizeText(q.類型 || q.type || '一般任務');
    const rawNotes = (q.cleanNotes || '').trim();
    const formattedNotes = rawNotes ? rawNotes.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>') : '<span style="color: #6b7280; font-style: italic;">尚無備註</span>';
    const moreNotesButtonHtml = `<button onclick="window.location.href='notes.html?id=${qID}'" style="display: inline-block; margin-top: 6px; padding: 2px 8px; background: #1e3a8a; color: #93c5fd; border: none; border-radius: 3px; font-size: 11px; cursor: pointer;">📖 查看更多備註</button>`;

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #1f2937';
    tr.innerHTML = `
      <td style="padding: 10px; cursor: pointer; color: #60a5fa; vertical-align: top;" onclick="window.focusQuestOnMap('${qID}', '${buildingName}', '${displayCity}')"><b>${buildingName}</b></td>
      <td style="padding: 10px; vertical-align: top;">${displayCity}</td>
      <td style="padding: 10px; vertical-align: top;">${taskType}</td>
      <td style="padding: 10px; width: 300px; max-width: 300px; vertical-align: top; word-break: break-all;"><div style="font-size: 12px; color: #e5e7eb; line-height: 1.4;">${formattedNotes}</div>${moreNotesButtonHtml}</td>
      <td style="padding: 10px; vertical-align: top;"><button onclick="window.location.href='edit.html?id=${qID}'" style="padding: 4px 10px; background: #374151; color: #60a5fa; border: 1px solid #4b5563; border-radius: 4px; cursor: pointer; font-size: 12px;">⚙️ 編輯詳情</button></td>
      <td style="padding: 10px; vertical-align: top;"><select onchange="window.updateQuestStatusInSupabase('${qID}', this.value)" style="background: #1f2937; color: #fff; border: 1px solid #4b5563; padding: 4px; border-radius: 4px; font-size: 12px;"><option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>⭕ 未完成</option><option value="show" ${currentStatus === 'show' ? 'selected' : ''}>👁️ 顯示中</option><option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>✅ 已完成</option></select></td>
    `;
    tbody.appendChild(tr);
  });
};

function updateFilterOptions() {
  const cityPanel = document.getElementById('panel-city');
  const typePanel = document.getElementById('panel-type');
  if (!cityPanel || !typePanel) return;

  const currentSelectedCities = new Set(Array.from(document.querySelectorAll('input[name="city-checkbox"]:checked')).map(cb => cb.value));
  const currentSelectedTypes = new Set(Array.from(document.querySelectorAll('input[name="type-checkbox"]:checked')).map(cb => cb.value));

  const cities = new Set();
  const types = new Set();

  globalQuestData.forEach(q => {
    const c = localizeText(getQuestCity(q));
    if (c) cities.add(c);
    const t = q.類型 || q.type;
    if (t) types.add(t);
  });

  cityPanel.innerHTML = '';
  Array.from(cities).sort().forEach(c => {
    const isChecked = currentSelectedCities.has(c) ? 'checked' : '';
    cityPanel.innerHTML += `<label style="display: flex; align-items: center; gap: 6px; padding: 4px 0; color: #e5e7eb; font-size: 12px; cursor: pointer;"><input type="checkbox" name="city-checkbox" value="${c}" ${isChecked} onchange="filterQuests()"> ${c}</label>`;
  });

  typePanel.innerHTML = '';
  Array.from(types).sort().forEach(t => {
    const localizedT = localizeText(t);
    const isChecked = currentSelectedTypes.has(t) || currentSelectedTypes.has(localizedT) ? 'checked' : '';
    typePanel.innerHTML += `<label style="display: flex; align-items: center; gap: 6px; padding: 4px 0; color: #e5e7eb; font-size: 12px; cursor: pointer;"><input type="checkbox" name="type-checkbox" value="${t}" ${isChecked} onchange="filterQuests()"> ${localizedT}</label>`;
  });

  updateDropdownButtonText('city');
  updateDropdownButtonText('type');
}

document.addEventListener('DOMContentLoaded', () => {
  const currentPath = decodeURIComponent(window.location.pathname.split('/').pop() || 'index.html');
  if (currentPath.includes('index') || currentPath === '') {
    document.getElementById('nav-index')?.classList.add('active');
  } else if (currentPath.includes('高樓')) {
    document.getElementById('nav-building')?.classList.add('active');
  }
});

window.addEventListener('beforeunload', async () => {
  await supabase.auth.signOut();
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      console.log('✅ 已成功登出');
      window.location.href = '登入.html';
    } else {
      console.error('❌ 登出失敗:', error.message);
    }
  });
}
