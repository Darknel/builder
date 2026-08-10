/* ═══════════════════════════════════════════════
   PAGE TABS.JS — вкладки-сторінки, як у браузері
   ───────────────────────────────────────────────
   Кожна вкладка — окрема "сторінка" зі своїм набором рядків/блоків
   і своєю власною історією undo/redo. У кожен момент лише ОДНА
   вкладка "жива" (її вміст фізично лежить у #canvas) — решта
   зберігаються як HTML-рядки (serializeProject()) в масиві tabs.

   - tabs / activeTabId       — стан
   - createTabObject()        — фабрика об'єкта вкладки
   - syncActiveTabFromCanvas()/loadTabIntoCanvas() — "вивантажити
     живий canvas у активну вкладку" / "завантажити вкладку в canvas"
   - switchToTab/addNewTab/duplicateTab/closeTab/renameTab
   - moveRowToTab()/serializeRow() — перемістити один контейнер (рядок)
     на іншу вкладку: або через кнопку "→" на панелі рядка (відкриває
     openMoveMenu — маленьке спливаюче меню зі списком вкладок), або
     перетягуванням рядка прямо на потрібну вкладку в панелі вкладок
     (той самий dragRow, що й для перестановки рядків — bindRowDrag,
     dragElements.js).
   - renderTabBar() — перебудовує розмітку панелі вкладок

   Лічильники rowCnt/blkCnt (state.js) НАВМИСНО спільні для ВСІХ
   вкладок (не скидаються при перемиканні) — інакше при переміщенні
   рядка між вкладками id/bid могли б зіткнутися з уже наявними в
   цільовій вкладці.
═══════════════════════════════════════════════ */

let tabs = [];
let activeTabId = null;
let _tabSeq = 0;

function createTabObject(title, html) {
  _tabSeq++;
  return {
    id: `tab-${_tabSeq}`,
    title: title || `Сторінка ${_tabSeq}`,
    html: html || '',
    history: [],
    historyIndex: -1,
  };
}

/* ─── Синхронізація живого canvas ↔ об'єкт вкладки ── */
function syncActiveTabFromCanvas() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  tab.html = serializeProject();
  tab.history = _history;
  tab.historyIndex = _historyIndex;
}

function loadTabIntoCanvas(tab) {
  rehydrateCanvas(tab.html);
  // Якщо у вкладки немає власної історії (щойно створена, або html
  // прийшов ззовні — переміщення рядка/імпорт) — стартуємо нову
  // історію з одним знімком поточного стану.
  _history = (tab.history && tab.history.length) ? tab.history : [tab.html];
  _historyIndex = (tab.historyIndex != null && tab.historyIndex >= 0 && tab.historyIndex < _history.length)
    ? tab.historyIndex : _history.length - 1;
  updateUndoRedoButtons();
}

/* ─── Перемикання / створення / дублювання / закриття / перейменування ── */
function switchToTab(tabId) {
  if (tabId === activeTabId) return;
  const target = tabs.find(t => t.id === tabId);
  if (!target) return;
  syncActiveTabFromCanvas();
  activeTabId = tabId;
  loadTabIntoCanvas(target);
  renderTabBar();
}

function addNewTab() {
  syncActiveTabFromCanvas();
  const tab = createTabObject();
  tabs.push(tab);
  activeTabId = tab.id;
  loadTabIntoCanvas(tab);
  renderTabBar();
  showToast(`✓ Додано «${tab.title}»`);
}

function duplicateTab(tabId) {
  const src = tabs.find(t => t.id === tabId);
  if (!src) return;
  if (tabId === activeTabId) syncActiveTabFromCanvas(); // щоб копія мала свіжий вміст
  const idx = tabs.indexOf(src);
  const copy = createTabObject(`${src.title} (копія)`, src.html);
  tabs.splice(idx + 1, 0, copy);
  switchToTab(copy.id);
  showToast(`✓ Продубльовано «${src.title}»`);
}

function closeTab(tabId) {
  if (tabs.length <= 1) { showToast('Це остання вкладка — її не можна закрити', 'error'); return; }
  const idx = tabs.findIndex(t => t.id === tabId);
  if (idx === -1) return;
  const wasActive = tabId === activeTabId;
  tabs.splice(idx, 1);
  if (wasActive) {
    const next = tabs[Math.min(idx, tabs.length - 1)];
    switchToTab(next.id);
  } else {
    renderTabBar();
  }
  showToast('Вкладку закрито', 'info');
}

function renameTab(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;
  const name = window.prompt('Назва вкладки:', tab.title);
  if (name === null) return; // скасовано
  tab.title = name.trim() || tab.title;
  renderTabBar();
}

/* ─── Переміщення рядка (контейнера) на іншу вкладку ── */
function serializeRow(rw) {
  syncFormValuesToAttributes(rw);
  const wrap = document.createElement('div');
  wrap.appendChild(rw.cloneNode(true));
  return wrap.innerHTML;
}

function moveRowToTab(rw, targetTabId) {
  const targetTab = tabs.find(t => t.id === targetTabId);
  if (!targetTab) return;
  if (targetTabId === activeTabId) return; // немає сенсу переносити "в ту саму" вкладку

  closeSP(); // повертає поля активного блоку назад у DOM рядка перед клонуванням
  const rowHtml = serializeRow(rw);
  const prevGap = rw.previousElementSibling?.classList.contains('row-gap') ? rw.previousElementSibling : null;
  if (prevGap) prevGap.remove();
  rw.remove();

  targetTab.html = (targetTab.html || '') + '<div class="row-gap"></div>' + rowHtml;
  // Цільова вкладка неактивна — її збережена історія вже не відповідає
  // новому вмісту. Скидаємо: при наступному переході на неї
  // loadTabIntoCanvas() стартує свіжу історію з одним знімком.
  targetTab.history = [];
  targetTab.historyIndex = -1;

  renumRows();
  refreshCode();
  showToast(`✓ Переміщено на вкладку «${targetTab.title}»`);
}

/* ─── Спливаюче меню "Перемістити на…" (кнопка "→" на панелі рядка) ── */
function closeMoveMenu() {
  document.getElementById('move-menu')?.remove();
  document.removeEventListener('click', _onMoveMenuOutsideClick, true);
}
function _onMoveMenuOutsideClick(e) {
  if (!e.target.closest('#move-menu') && !e.target.closest('[data-action="move"]')) closeMoveMenu();
}
function openMoveMenu(triggerBtn, rw) {
  closeMoveMenu();
  const others = tabs.filter(t => t.id !== activeTabId);
  if (!others.length) { showToast('Немає інших вкладок — спершу створіть нову кнопкою "+"', 'info'); return; }

  const menu = document.createElement('div');
  menu.className = 'move-menu';
  menu.id = 'move-menu';
  menu.innerHTML = `<div class="move-menu-title">Перемістити на вкладку:</div>` +
    others.map(t => `<button class="move-menu-item" data-tab-id="${esc(t.id)}">${esc(t.title)}</button>`).join('');
  document.body.appendChild(menu);

  const rect = triggerBtn.getBoundingClientRect();
  const menuW = menu.offsetWidth;
  menu.style.top  = `${rect.bottom + 4}px`;
  menu.style.left = `${Math.min(rect.left, window.innerWidth - menuW - 8)}px`;

  menu.querySelectorAll('.move-menu-item').forEach(btn => {
    btn.addEventListener('click', () => {
      moveRowToTab(rw, btn.dataset.tabId);
      closeMoveMenu();
    });
  });
  // capture:true — щоб встигнути перевірити клік ДО того, як він
  // долетить до інших делегованих обробників і, наприклад, закриє
  // панель налаштувань чи спрацює якась інша дія.
  setTimeout(() => document.addEventListener('click', _onMoveMenuOutsideClick, true), 0);
}

/* ─── Drop-зона: перетягнути рядок прямо на вкладку в панелі ──
   Той самий dragRow, що й для перестановки рядків усередині canvas
   (dragElements.js/state.js) — тут ми лише додаємо ЩЕ ОДНЕ місце,
   куди його можна кинути. */
function bindTabDropTarget(tabEl, tabId) {
  tabEl.addEventListener('dragover', e => {
    if (!dragRow || tabId === activeTabId) return;
    e.preventDefault();
    tabEl.classList.add('is-drop-target');
  });
  tabEl.addEventListener('dragleave', e => {
    if (!tabEl.contains(e.relatedTarget)) tabEl.classList.remove('is-drop-target');
  });
  tabEl.addEventListener('drop', e => {
    if (!dragRow || tabId === activeTabId) return;
    e.preventDefault();
    tabEl.classList.remove('is-drop-target');
    const movedRow = dragRow;
    dragRow = null; // на випадок, якщо 'dragend' не встигне спрацювати на вже видаленому вузлі
    moveRowToTab(movedRow, tabId);
  });
}

/* ─── Розмітка панелі вкладок ──────────────────── */
function renderTabBar() {
  const list = document.getElementById('tab-bar-list');
  if (!list) return;
  list.innerHTML = '';
  tabs.forEach(tab => {
    const el = document.createElement('div');
    el.className = 'page-tab' + (tab.id === activeTabId ? ' is-active' : '');
    el.dataset.action = 'tab-switch';
    el.dataset.tabId = tab.id;
    el.title = tab.title + ' — подвійний клік, щоб перейменувати';
    el.innerHTML = `
      <span class="page-tab-label">${esc(tab.title)}</span>
      <button class="page-tab-dup" data-action="tab-duplicate" data-tab-id="${esc(tab.id)}" title="Дублювати вкладку">⧉</button>
      <button class="page-tab-close" data-action="tab-close" data-tab-id="${esc(tab.id)}" title="Закрити вкладку">✕</button>`;
    el.addEventListener('dblclick', e => {
      if (e.target.closest('[data-action="tab-duplicate"], [data-action="tab-close"]')) return;
      renameTab(tab.id);
    });
    bindTabDropTarget(el, tab.id);
    list.appendChild(el);
  });
}

document.getElementById('btn-add-tab').addEventListener('click', addNewTab);

/* ─── Ініціалізація ─────────────────────────────
   1) Створюємо дефолтну першу вкладку — щоб canvas і undo-історія
      мали куди "приземлитись", навіть якщо автозбереження немає чи
      користувач відмовився його відновлювати.
   2) Пробуємо відновити автозбереження (projectState.js) — якщо
      вдалось, воно САМЕ замінює tabs/activeTabId і рендерить canvas.
   3) Якщо не відновлювали — рендеримо щойно створену дефолтну вкладку.
   4) Перший знімок історії (пуш дефолтної/відновленої вкладки). */
const _initialTab = createTabObject('Сторінка 1', '');
tabs.push(_initialTab);
activeTabId = _initialTab.id;

const _restored = window.__BUILDER_TEST_MODE__ ? false : loadAutosaveOnStartup();
if (!_restored) loadTabIntoCanvas(_initialTab);
renderTabBar();
pushHistory();
