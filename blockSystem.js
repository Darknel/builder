/* ═══════════════════════════════════════════════
   BLOCK SYSTEM.JS — панель налаштувань блоку + CRUD блоків
═══════════════════════════════════════════════ */

/* ─── Settings panel ─────────────────────────── */
document.getElementById('sp-close').addEventListener('click', closeSP);

/* ─── Device tabs ────────────────────────────── */
document.querySelectorAll('.device-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.device-tab').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    const body = document.getElementById('sp-body');
    body.classList.remove('show-mobile', 'show-desktop');
    body.classList.add('show-' + tab.dataset.device);

    // Синхронізувати правий preview з вибраним пристроєм
    const device = tab.dataset.device;
    document.querySelectorAll('.pp-tab').forEach(b => b.classList.remove('is-active'));
    const ppTab = document.getElementById('pp-tab-' + device);
    if (ppTab) ppTab.classList.add('is-active');
    _ppDevice = device;
    updateRightPreview(document.getElementById('code-out').value);
  });
});

function openSP(block) {
  const body = document.getElementById('sp-body');

  // If same block → toggle off
  if (window._activeBlock === block) { closeSP(); return; }

  // Return fields from previous active block
  if (window._activeBlock) {
    const padBar = body.querySelector('.block-padbar');
    const fields = body.querySelector('.block-fields');
    if (padBar) window._activeBlock.appendChild(padBar);
    if (fields) window._activeBlock.appendChild(fields);
    window._activeBlock.classList.remove('is-active');
  }

  // Close any row settings
  if (window._activeRow) {
    window._activeRow.classList.remove('is-settings-active');
    window._activeRow = null;
  }

  window._activeBlock = block;
  block.classList.add('is-active');

  const type = block.dataset.type;
  const meta = BLOCK_META[type] || { icon: '📦', label: type };
  document.getElementById('sp-icon').textContent  = meta.icon;
  document.getElementById('sp-title').textContent = meta.label;

  body.innerHTML = '';

  const padBar = block.querySelector('.block-padbar');
  const fields = block.querySelector('.block-fields');
  if (padBar) body.appendChild(padBar);
  if (fields) body.appendChild(fields);

  document.getElementById('settings-panel').classList.add('is-open');
}

function closeSP() {
  const panel = document.getElementById('settings-panel');
  const body  = document.getElementById('sp-body');

  if (window._activeBlock) {
    const padBar = body.querySelector('.block-padbar');
    const fields = body.querySelector('.block-fields');
    if (padBar) window._activeBlock.appendChild(padBar);
    if (fields) window._activeBlock.appendChild(fields);
    window._activeBlock.classList.remove('is-active');
    window._activeBlock = null;
  }
  if (window._activeRow) {
    window._activeRow.classList.remove('is-settings-active');
    window._activeRow = null;
  }

  panel.classList.remove('is-open');
  const devCls = body.classList.contains('show-desktop') ? 'show-desktop' : 'show-mobile';
  body.innerHTML = `
    <div class="sp-empty">
      <div class="sp-empty-icon">✦</div>
      <div class="sp-empty-title">Виберіть блок</div>
      <div class="sp-empty-desc">Натисніть блок або ⚙ рядка, щоб відкрити налаштування</div>
    </div>`;
  body.className = `sp-body ${devCls}`;
}

/* ═══════════════════════════════════════════════
   BLOCK SYSTEM
═══════════════════════════════════════════════ */
function addBlockToCol(type, col) {
  const addBtn = col.querySelector('.add-block-btn');
  const block  = makeBlock(type);
  col.insertBefore(block, addBtn || null);
  refreshCode();
  setTimeout(() => openSP(block), 20);
}

// Прив'язує клік по плитці блоку (відкрити налаштування / видалити /
// перетягнути). Винесено в окрему функцію, щоб її можна було повторно
// використати як для нових блоків (makeBlock), так і для дубльованих
// (dupRow) чи відновлених зі збереженого проєкту (persistence.js) —
// без дублювання одного й того самого коду обробника в трьох місцях.
function bindBlockTile(block) {
  const tile = block.querySelector('.block-tile');
  if (!tile || tile._bound) return;
  tile._bound = true;
  tile.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'del') { e.stopPropagation(); removeBlock(block); return; }
    if (action === 'drag') return;
    openSP(block);
  });
}

function makeBlock(type) {
  const bid  = ++blkCnt;
  const meta = BLOCK_META[type] || { icon:'📦', label:type };

  const block = document.createElement('div');
  block.className    = 'block';
  block.dataset.type = type;
  block.dataset.bid  = bid;

  const tile = document.createElement('div');
  tile.className = 'block-tile';
  tile.innerHTML = `
    <div class="block-icon">${meta.icon}</div>
    <div class="block-info">
      <div class="block-type">${meta.label}</div>
      <div class="block-preview"><span class="hint">Натисніть для редагування</span></div>
    </div>
    <div class="block-actions">
      <button class="ib" data-action="drag" title="Перетягнути">⠿</button>
      <button class="ib danger" data-action="del" title="Видалити">✕</button>
    </div>`;

  const padBar = document.createElement('div');
  padBar.className = 'block-padbar';
  padBar.innerHTML = buildPadBar(bid);

  const fields = document.createElement('div');
  fields.className = 'block-fields';
  fields.innerHTML = buildFields(type, bid);

  block.appendChild(tile);
  block.appendChild(padBar);
  block.appendChild(fields);

  bindBlockTile(block);
  bindBlockDrag(block);
  return block;
}

function removeBlock(block) {
  if (window._activeBlock === block) closeSP();
  const col = block.closest('.col');
  block.remove();
  restoreColEmpty(col);
  refreshCode();
}
