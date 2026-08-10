/* ═══════════════════════════════════════════════
   MODALS.JS — код-шухляда, модалка розмітки, модалка блоку,
   Escape-хендлер, побудова карток модалок
═══════════════════════════════════════════════ */

/* ─── Code drawer ────────────────────────────── */
document.getElementById('btn-code').addEventListener('click', () => {
  document.getElementById('code-drawer').classList.toggle('is-open');
});
document.getElementById('btn-drawer-close').addEventListener('click', () => {
  document.getElementById('code-drawer').classList.remove('is-open');
});
document.getElementById('btn-refresh').addEventListener('click', () => { refreshCode(); });

document.querySelectorAll('.dtab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.dtab').forEach(t => t.classList.remove('is-active'));
    document.querySelectorAll('.drawer-pane').forEach(p => p.classList.remove('is-active'));
    tab.classList.add('is-active');
    const pane = document.getElementById('pane-' + tab.dataset.tab);
    if (pane) pane.classList.add('is-active');
  });
});

/* ─── Layout modal ───────────────────────────── */
let _pendingAfterEl = null;

function openLayoutModal(afterEl) {
  _pendingAfterEl = afterEl || null;
  document.getElementById('layout-overlay').classList.add('is-open');
}
function closeLayoutModal() {
  document.getElementById('layout-overlay').classList.remove('is-open');
  _pendingAfterEl = null;
}
document.getElementById('layout-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeLayoutModal(); });
document.getElementById('layout-modal-close').addEventListener('click', closeLayoutModal);

/* ─── Block modal ────────────────────────────── */
let _pendingCol = null;

function openBlockModal(col) {
  _pendingCol = col;
  document.getElementById('block-overlay').classList.add('is-open');
}
function closeBlockModal() {
  document.getElementById('block-overlay').classList.remove('is-open');
  _pendingCol = null;
}
document.getElementById('block-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeBlockModal(); });
document.getElementById('block-modal-close').addEventListener('click', closeBlockModal);

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeLayoutModal(); closeBlockModal(); closeSP(); closeTemplatesModal();
});

/* ─── Click canvas bg → close panel ──────────── */
document.getElementById('canvas-area').addEventListener('click', e => {
  if (e.target === e.currentTarget || e.target === document.getElementById('canvas')) closeSP();
});

/* ═══════════════════════════════════════════════
   BUILD MODALS
═══════════════════════════════════════════════ */
(function buildModals() {
  const lg = document.getElementById('layout-grid');
  LAYOUT_DEFS.forEach(def => {
    const lay  = LAYOUTS[def.key];
    const card = document.createElement('div');
    card.className = 'layout-card';
    card.innerHTML = `
      <div class="layout-preview">${lay.bars.map(f => `<div class="layout-bar" style="flex:${f}"></div>`).join('')}</div>
      <div class="layout-label">${lay.label}</div>`;
    card.addEventListener('click', () => { addRow(def.key); closeLayoutModal(); });
    lg.appendChild(card);
  });

  const bg = document.getElementById('block-pick-grid');
  BLOCK_DEFS.forEach(def => {
    const card = document.createElement('div');
    card.className = 'block-pick-card';
    card.innerHTML = `<div class="bpc-icon">${def.icon}</div><div class="bpc-label">${def.label}</div>`;
    card.addEventListener('click', () => { if (_pendingCol) addBlockToCol(def.type, _pendingCol); closeBlockModal(); });
    bg.appendChild(card);
  });
})();

document.getElementById('empty-state').addEventListener('click', () => openLayoutModal(null));
document.getElementById('empty-state').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openLayoutModal(null); });
document.getElementById('add-row-main').addEventListener('click', () => openLayoutModal(null));
