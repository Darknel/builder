/* ═══════════════════════════════════════════════
   PERSISTENCE.JS — undo/redo, автозбереження, експорт/імпорт проєкту
   ───────────────────────────────────────────────
   - serializeProject()/rehydrateCanvas() — спільна основа: перше
     перетворює поточний #canvas на HTML-рядок (синхронізуючи
     значення полів у атрибути, як це вже робив dupRow() для
     клонування одного рядка), друге — робить зворотне: вставляє
     HTML і заново прив'язує всі обробники (drag, клік по плитці/
     панелі рядка, drop-зони), яких innerHTML не зберігає.
   - Історія undo/redo — стек знімків serializeProject(), з
     дебаунсом (щоб швидкий набір тексту не плодив по знімку на
     кожну літеру).
   - Автозбереження — той самий знімок у localStorage, з
     пропозицією відновити при наступному відкритті.
   - Експорт/імпорт — той самий знімок, загорнутий у .json файл.
═══════════════════════════════════════════════ */

/* ─── Serialize / rehydrate ──────────────────── */
function syncFormValuesToAttributes(root) {
  root.querySelectorAll('input').forEach(el => {
    if (el.type === 'checkbox' || el.type === 'radio') el.checked ? el.setAttribute('checked', '') : el.removeAttribute('checked');
    else el.setAttribute('value', el.value);
  });
  root.querySelectorAll('textarea').forEach(el => { el.textContent = el.value; });
  root.querySelectorAll('select').forEach(s => {
    [...s.options].forEach((opt, i) => i === s.selectedIndex ? opt.setAttribute('selected', '') : opt.removeAttribute('selected'));
  });
}

// Поля активного блоку фізично живуть у #sp-body, поки панель
// відкрита — тимчасово повертаємо їх у блок на час серіалізації,
// інакше вони випадуть з canvas.innerHTML повністю.
function withFieldsRestored(fn) {
  const spBody = document.getElementById('sp-body');
  const activeBlock = window._activeBlock;
  let padBar = null, fields = null;
  if (activeBlock) {
    padBar = spBody.querySelector('.block-padbar');
    fields = spBody.querySelector('.block-fields');
    if (padBar) activeBlock.appendChild(padBar);
    if (fields) activeBlock.appendChild(fields);
  }
  const result = fn();
  if (activeBlock) {
    if (padBar) spBody.appendChild(padBar);
    if (fields) spBody.appendChild(fields);
  }
  return result;
}

function serializeProject() {
  return withFieldsRestored(() => {
    const canvas = document.getElementById('canvas');
    syncFormValuesToAttributes(canvas);
    // ВАЖЛИВО: серіалізуємо лише .row/.row-gap — canvas.innerHTML
    // містить також статичні #empty-state і #add-row-zone (завжди
    // присутні в DOM як частина розмітки застосунку), і якби ми
    // серіалізували їх разом з рядками, rehydrateCanvas() вставляв
    // би ЇХ ДРУГУ копію поруч з оригінальними елементами щоразу —
    // канвас засмічувався б дублікатами з кожним undo/redo.
    const wrap = document.createElement('div');
    [...canvas.children].forEach(ch => {
      if (ch.classList.contains('row') || ch.classList.contains('row-gap')) {
        wrap.appendChild(ch.cloneNode(true));
      }
    });
    return wrap.innerHTML;
  });
}

function rehydrateCanvas(html) {
  closeSP();
  const canvas  = document.getElementById('canvas');
  const addZone = document.getElementById('add-row-zone');
  const emptyEl = document.getElementById('empty-state');
  [...canvas.children].forEach(ch => { if (ch !== emptyEl && ch !== addZone) ch.remove(); });

  const temp = document.createElement('div');
  temp.innerHTML = html;
  // Фільтр на .row/.row-gap — захист від застарілих автозбережень,
  // де могла бути помилково серіалізована й службова розмітка.
  [...temp.children].forEach(ch => {
    if (ch.classList.contains('row') || ch.classList.contains('row-gap')) canvas.insertBefore(ch, addZone);
  });

  // innerHTML не зберігає JS-обробники подій — заново створюємо
  // "+ рядок" та "+ блок" кнопки (bindColDrop() теж не переживає
  // серіалізацію) і прив'язуємо drag/клік для кожного рядка й блоку.
  canvas.querySelectorAll('.row-gap').forEach(gap => gap.replaceWith(makeGap()));
  canvas.querySelectorAll('.col').forEach(col => {
    const oldBtn = col.querySelector('.add-block-btn');
    if (oldBtn) oldBtn.replaceWith(makeAddBlockBtn(col));
    col._dropBound = false;
    bindColDrop(col);
  });
  canvas.querySelectorAll('.row').forEach(rw => { bindRowBar(rw); bindRowDrag(rw); });
  canvas.querySelectorAll('.block').forEach(b => { bindBlockTile(b); bindBlockDrag(b); });

  // Перевираховуємо лічильники id, щоб нові рядки/блоки не
  // конфліктували з відновленими.
  let maxRow = 0, maxBlk = 0;
  canvas.querySelectorAll('.row').forEach(rw => { const m = rw.id.match(/^rw-(\d+)/); if (m) maxRow = Math.max(maxRow, +m[1]); });
  canvas.querySelectorAll('.block').forEach(b => { maxBlk = Math.max(maxBlk, +b.dataset.bid || 0); });
  rowCnt = maxRow; blkCnt = maxBlk;

  renumRows();
  emptyEl.classList.toggle('hidden', !!canvas.querySelector('.row'));
  refreshCode();
}

/* ─── Undo / redo ─────────────────────────────── */
let _history = [];
let _historyIndex = -1;
let _isRestoringHistory = false;
const HISTORY_LIMIT = 50;

function pushHistory() {
  if (_isRestoringHistory) return;
  const snap = serializeProject();
  if (_history[_historyIndex] === snap) return; // нічого не змінилось
  _history = _history.slice(0, _historyIndex + 1);
  _history.push(snap);
  if (_history.length > HISTORY_LIMIT) _history.shift();
  _historyIndex = _history.length - 1;
  updateUndoRedoButtons();
}

function undo() {
  if (_historyIndex <= 0) return;
  _historyIndex--;
  restoreHistoryAt(_historyIndex);
}
function redo() {
  if (_historyIndex >= _history.length - 1) return;
  _historyIndex++;
  restoreHistoryAt(_historyIndex);
}
function restoreHistoryAt(idx) {
  _isRestoringHistory = true;
  rehydrateCanvas(_history[idx] || '');
  _isRestoringHistory = false;
  updateUndoRedoButtons();
}
function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('btn-undo');
  const redoBtn = document.getElementById('btn-redo');
  if (undoBtn) undoBtn.disabled = _historyIndex <= 0;
  if (redoBtn) redoBtn.disabled = _historyIndex < 0 || _historyIndex >= _history.length - 1;
}

document.getElementById('btn-undo').addEventListener('click', undo);
document.getElementById('btn-redo').addEventListener('click', redo);

document.addEventListener('keydown', e => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const tag = document.activeElement?.tagName;
  const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
  if (isEditable) return; // не заважаємо нативному undo/redo всередині текстових полів
  const key = e.key.toLowerCase();
  if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  else if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
});

/* ─── Автозбереження ──────────────────────────── */
// Проєкт тепер — це набір ВКЛАДОК (pageTabs.js), а не один canvas, тому
// зберігаємо/відновлюємо весь масив tabs, а не лише поточний html.
// tabs/activeTabId/createTabObject/loadTabIntoCanvas визначені в
// pageTabs.js — цей файл лише ВИКЛИКАЄ їх (лише в момент виклику
// save/load-функцій, коли pageTabs.js уже гарантовано завантажений;
// порядок оголошення функцій тут значення не має).
const AUTOSAVE_KEY = 'builderV5_autosave_v2';

function saveProjectToStorage() {
  try {
    syncActiveTabFromCanvas();
    const data = {
      version: 2,
      tabs: tabs.map(t => ({ title: t.title, html: t.html })),
      activeIndex: tabs.findIndex(t => t.id === activeTabId),
      savedAt: Date.now(),
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch (e) { /* приватний режим / переповнене сховище — тихо ігноруємо */ }
}

// Повертає true, якщо якісь вкладки дійсно відновлено (і canvas вже
// перерендерено на відновлену активну вкладку) — інакше false, і
// викликач (pageTabs.js) сам подбає про дефолтну порожню вкладку.
function loadAutosaveOnStartup() {
  let raw;
  try { raw = localStorage.getItem(AUTOSAVE_KEY); } catch (e) { return false; }
  if (!raw) return false;
  let data;
  try { data = JSON.parse(raw); } catch (e) { return false; }
  if (!data || !Array.isArray(data.tabs) || !data.tabs.length) return false;
  const hasContent = data.tabs.some(t => t.html && t.html.trim());
  if (!hasContent) return false;
  const label = data.tabs.length > 1 ? `${data.tabs.length} вкладок` : '1 вкладку';
  if (!window.confirm(`Знайдено автозбережений проєкт (${label}) із попередньої сесії. Відновити його?`)) return false;

  tabs = data.tabs.map(t => createTabObject(t.title, t.html));
  const idx = Number.isInteger(data.activeIndex) && data.activeIndex >= 0 && data.activeIndex < tabs.length ? data.activeIndex : 0;
  activeTabId = tabs[idx].id;
  loadTabIntoCanvas(tabs[idx]);
  return true;
}

/* ─── Хук з refreshCode() (generateHTML.js) ──── */
const pushHistoryDebounced = debounce(() => pushHistory(), 700);
const autosaveDebounced    = debounce(() => saveProjectToStorage(), 800);
function onProjectChanged() {
  pushHistoryDebounced();
  autosaveDebounced();
}

/* ─── Експорт / імпорт проєкту (.json) ───────── */
function exportProjectJSON() {
  syncActiveTabFromCanvas();
  const data = {
    version: 2,
    tabs: tabs.map(t => ({ title: t.title, html: t.html })),
    activeIndex: tabs.findIndex(t => t.id === activeTabId),
    savedAt: Date.now(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `builder-project-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('✓ Проєкт збережено у файл');
}

function importProjectJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try { data = JSON.parse(reader.result); } catch (e) { showToast('Файл пошкоджений або не є JSON', 'error'); return; }
    let newTabs;
    if (data && Array.isArray(data.tabs) && data.tabs.length) {
      // Поточний, багатовкладковий формат.
      newTabs = data.tabs.map(t => createTabObject(t.title, t.html));
    } else if (data && typeof data.html === 'string') {
      // Файл, збережений ДО появи вкладок (версія 1) — імпортуємо як одну вкладку.
      newTabs = [createTabObject('Імпортована сторінка', data.html)];
    } else {
      showToast('Невірний формат файлу проєкту', 'error');
      return;
    }
    tabs = newTabs;
    const idx = Number.isInteger(data.activeIndex) && data.activeIndex >= 0 && data.activeIndex < tabs.length ? data.activeIndex : 0;
    activeTabId = tabs[idx].id;
    loadTabIntoCanvas(tabs[idx]);
    renderTabBar();
    showToast('✓ Проєкт завантажено');
  };
  reader.onerror = () => showToast('Не вдалося прочитати файл', 'error');
  reader.readAsText(file);
}

document.getElementById('btn-save-project').addEventListener('click', exportProjectJSON);
document.getElementById('load-project-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) importProjectJSON(file);
  e.target.value = '';
});

/* Ініціалізація (створення першої вкладки, спроба відновити автозбереження,
   перший знімок історії) відбувається в pageTabs.js — вона мусить
   виконатись ПІСЛЯ того, як масив tabs/activeTabId уже готовий. */
