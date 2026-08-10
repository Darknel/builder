/* ═══════════════════════════════════════════════
   DELEGATE.JS — делеговані обробники подій
   ───────────────────────────────────────────────
   Замінює inline onclick/oninput/onchange у динамічно
   згенерованій розмітці (панелі полів блоків, налаштування рядка)
   на єдині делеговані слухачі на document. Дозволяє прибрати
   inline-JS з атрибутів і використовувати сувору CSP
   (script-src 'self', без 'unsafe-inline').

   Правила:
   - Будь-який .fi/.fsel/textarea/checkbox всередині #sp-body БЕЗ
     [data-action] — просто рефрешить код (дебаунснуто) на
     input/change. Це покриває переважну більшість простих полів.
   - Елементи з [data-action="…"] обробляються через ACTIONS{} —
     самі обробники (за потреби) викликають refreshCode() у кінці.
   - Клавіатурні комбінації (Ctrl+Z/Ctrl+Y) — persistence.js.
═══════════════════════════════════════════════ */

const refreshCodeDebounced = debounce(() => refreshCode(), 120);

const ACTIONS = {
  /* ─── рядок тексту (textElement.js) ──────────── */
  'tl-remove'(el)      { el.closest('.text-line-item')?.remove(); refreshCode(); },
  'tl-tag'(el)          { applyTagDefaults(el); refreshCode(); },
  'tl-align'(el)        { setAlign(el, el.dataset.group); refreshCode(); },
  'tl-weight'(el)       { setWeight(el); refreshCode(); },
  'tl-style'(el)        { segSingle(el); refreshCode(); },
  'tl-color'(el)        { setTlColor(el); },
  'add-text-line'(el)   { addTextLine(el, el.dataset.bid); },

  /* ─── варіант перемикача (switcherElement.js) ── */
  'sw-remove'(el)       { el.closest('.sw-item')?.remove(); refreshCode(); },
  'sw-set-active'(el)   { setSwActive(el); },
  'add-sw-item'(el)     { addSwitcherItem(el, el.dataset.bid); },
  'color-sync'(el)      { swColorSync(el, el.dataset.targetClass); },

  /* ─── універсальні тумблери ───────────────────── */
  'toggle'(el)          { tToggle(el); },
  'toggle-refresh'()    { tToggleClick(); },
  'sp-toggle'(el)       { spToggle(el); },

  /* ─── налаштування рядка (rowSettings.js) ─────── */
  'row-px-py'(el)       { setRowPy(el.value, el.dataset.prop); },
  'row-gap'(el)         { setRowGap(el.value); },
  'row-align'(el)       { setRowAlign(el); },
  'col-align'(el)       { setColAlign(el); },
  'row-bg-swatch'(el)   { rowBgSwatchChange(el); },
  'row-bg-hex'(el)      { rowBgHexChange(el); },
  'row-bg-clear'()      { clearRowBg(); },
  'row-bg-preset'(el)   { applyRowBgPreset(el.dataset.color); },
  'row-bg-image'(el)    { setRowBgImage(el.value); },
  'row-bg-image-clear'(){ clearRowBgImage(); },
  'row-bg-size'(el)     { setRowBgSize(el.value); },
  'row-bg-pos'(el)      { setRowBgPos(el.value); },
  'row-bg-repeat'(el)   { setRowBgRepeat(el.value); },
  'row-minh'(el)        { setRowMinH(el.value, el.dataset.prop); },
  'row-bg-mode'(el)     { setRowBgMode(el.dataset.mode); },

  /* ─── завантаження зображень (image/swimage/row-bg) ── */
  'img-file-change'(el) {
    const file = el.files && el.files[0];
    if (file) handleImageBlockFile(el, file);
    el.value = '';
  },
  'row-bg-file-change'(el) {
    const file = el.files && el.files[0];
    if (file) handleRowBgFile(file);
    el.value = '';
  },

  /* ─── вкладки-сторінки (pageTabs.js) ──────────── */
  'tab-switch'(el)     { switchToTab(el.dataset.tabId); },
  'tab-duplicate'(el)  { duplicateTab(el.dataset.tabId); },
  'tab-close'(el)      { closeTab(el.dataset.tabId); },
};

function runAction(el, evt) {
  const fn = ACTIONS[el.dataset.action];
  if (fn) fn(el, evt);
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (el) runAction(el, e);
});

document.addEventListener('input', e => {
  const el = e.target;
  const actionEl = el.closest('[data-action]');
  if (actionEl) { runAction(actionEl, e); return; }
  if (el.closest('#sp-body') && el.matches('.fi, .fsel, textarea')) refreshCodeDebounced();
});

document.addEventListener('change', e => {
  const el = e.target;
  const actionEl = el.closest('[data-action]');
  if (actionEl) { runAction(actionEl, e); return; }
  if (el.closest('#sp-body') && el.matches('select, input[type=checkbox], input[type=color]')) refreshCodeDebounced();
});

/* ─── Drag&drop файлу зображення на .img-dropzone ── */
function dropzoneTargetsRowBg(dz) {
  return !!dz.querySelector('[data-action="row-bg-file-change"]');
}
document.addEventListener('dragover', e => {
  const dz = e.target.closest('.img-dropzone');
  if (!dz) return;
  e.preventDefault();
  dz.classList.add('is-dragover');
});
document.addEventListener('dragleave', e => {
  const dz = e.target.closest('.img-dropzone');
  if (!dz) return;
  if (!dz.contains(e.relatedTarget)) dz.classList.remove('is-dragover');
});
document.addEventListener('drop', e => {
  const dz = e.target.closest('.img-dropzone');
  if (!dz) return;
  e.preventDefault();
  dz.classList.remove('is-dragover');
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  if (dropzoneTargetsRowBg(dz)) handleRowBgFile(file);
  else handleImageBlockFile(dz, file);
});
