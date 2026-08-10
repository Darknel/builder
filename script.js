/* ═══════════════════════════════════════════════
   SCRIPT.JS — базовий стан і UI Builder'а
   ───────────────────────────────────────────────
   Не специфічний для окремих елементів (text/image/...).
   Відповідає за:
   - опис макетів рядків (LAYOUTS) і списку блоків (BLOCK_DEFS/META)
   - toast-повідомлення, код-шухляду, модалки вибору
     макету/блоку, панель налаштувань (sp-body) і перемикання
     мобільний/десктоп режим
   - SWITCHER_RUNTIME_JS — JS-рантайм перемикача, що вставляється
     у сам експортований HTML (працює в браузері користувача,
     без залежності від Builder'а)
   - праву панель live-перегляду (pp-frame)
   - систему рядків (row): додавання, дублювання, переміщення,
     видалення, панель налаштувань контейнера (фон, відступи,
     вирівнювання)
   - систему блоків (block): створення/видалення обгортки блоку
     (сама специфіка полів — у файлах елементів)
═══════════════════════════════════════════════ */

/* ─── State ──────────────────────────────────── */
let rowCnt   = 0;
let blkCnt   = 0;
let dragRow  = null, dragOverRow = null;
let dragBlock = null, dragSrcCol = null;

/* ─── Layouts ────────────────────────────────── */
const LAYOUTS = {
  '1':       { label:'1 кол.',  bars:[1],       flex:[1],       out:'grid-cols-1',                outSpans:[''] },
  '1,1':     { label:'50 / 50', bars:[1,1],     flex:[1,1],     out:'grid-cols-1 md:grid-cols-2', outSpans:['',''] },
  '1,2':     { label:'33 / 67', bars:[1,2],     flex:[1,2],     out:'grid-cols-1 md:grid-cols-3', outSpans:['','md:col-span-2'] },
  '2,1':     { label:'67 / 33', bars:[2,1],     flex:[2,1],     out:'grid-cols-1 md:grid-cols-3', outSpans:['md:col-span-2',''] },
  '3,1':     { label:'75 / 25', bars:[3,1],     flex:[3,1],     out:'grid-cols-1 md:grid-cols-4', outSpans:['md:col-span-3',''] },
  '1,3':     { label:'25 / 75', bars:[1,3],     flex:[1,3],     out:'grid-cols-1 md:grid-cols-4', outSpans:['','md:col-span-3'] },
  '1,1,1':   { label:'3 рівні', bars:[1,1,1],   flex:[1,1,1],   out:'grid-cols-1 md:grid-cols-3', outSpans:['','',''] },
  '1,1,1,1': { label:'4 рівні', bars:[1,1,1,1], flex:[1,1,1,1], out:'grid-cols-1 md:grid-cols-4', outSpans:['','','',''] },
  '1,1,1,1,1': { label:'5 рівнів', bars:[1,1,1,1,1], flex:[1,1,1,1,1], out:'grid-cols-1 md:grid-cols-5', outSpans:['','','','',''] },
};

const LAYOUT_DEFS = [
  { key:'1' },{ key:'1,1' },{ key:'1,2' },{ key:'2,1' },
  { key:'3,1' },{ key:'1,3' },{ key:'1,1,1' },{ key:'1,1,1,1' },{ key:'1,1,1,1,1' }
];

const BLOCK_DEFS = [
  { type:'text',     icon:'📝', label:'Текст' },
  { type:'image',    icon:'🖼️', label:'Зображення' },
  { type:'video',    icon:'▶️', label:'Відео' },
  { type:'switcher', icon:'🔀', label:'Перемикач' },
  { type:'swimage',  icon:'🖇️', label:'Зображення (перемикача)' },
];

const BLOCK_META = {
  text:     { icon:'📝', label:'Текстовий блок' },
  image:    { icon:'🖼️', label:'Зображення' },
  video:    { icon:'▶️', label:'Відео' },
  switcher: { icon:'🔀', label:'Перемикач' },
  swimage:  { icon:'🖇️', label:'Зображення (перемикача)' },
};

/* ─── Toast ──────────────────────────────────── */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} is-show`;
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('is-show'), 2400);
}

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
  closeLayoutModal(); closeBlockModal(); closeSP();
});

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

/* ─── Switcher runtime (shared JS for preview iframes & exported HTML) ── */
const SWITCHER_RUNTIME_JS = `
function swSwitch(btn){
  var group = btn.closest('.sw-group');
  var target = btn.getAttribute('data-sw-target');
  if (group) {
    var onCls = (group.getAttribute('data-sw-on-cls')||'').split(' ').filter(Boolean);
    var offCls = (group.getAttribute('data-sw-off-cls')||'').split(' ').filter(Boolean);
    var bcOn = btn.getAttribute('data-sw-bc-on') || '';
    var bcOff = btn.getAttribute('data-sw-bc-off') || '';
    var btns = group.querySelectorAll('.sw-btn');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (offCls.length) { b.classList.remove.apply(b.classList, onCls); b.classList.add.apply(b.classList, offCls); }
      var bOff = b.getAttribute('data-sw-bc-off');
      if (bOff) b.style.borderColor = bOff;
    }
    if (onCls.length) { btn.classList.remove.apply(btn.classList, offCls); btn.classList.add.apply(btn.classList, onCls); }
    if (bcOn) btn.style.borderColor = bcOn;
  }
  if (target) { swShowTarget(target, group); }
}
function swShowTarget(target, group){
  var fadeOn = true, fadeMs = 500;
  if (group) {
    fadeOn = group.getAttribute('data-sw-fade') !== '0';
    fadeMs = parseInt(group.getAttribute('data-sw-fade-ms'), 10) || 500;
  }
  var imgs = document.querySelectorAll('[data-sw-image]');
  for (var j = 0; j < imgs.length; j++) {
    var img = imgs[j];
    var isTarget = img.getAttribute('data-sw-image') === target;
    var stack = img.closest('.sw-stack');
    if (stack) {
      // Crossfade mode: use opacity, keep all images laid out (absolute except first)
      img.style.transitionDuration = fadeOn ? (fadeMs + 'ms') : '0ms';
      img.style.opacity = isTarget ? '1' : '0';
      img.style.pointerEvents = isTarget ? 'auto' : 'none';
      img.style.zIndex = isTarget ? '1' : '0';
    } else {
      // Legacy mode: single image per id, show/hide via display
      img.style.display = isTarget ? '' : 'none';
    }
  }
}
function swInit(){
  var groups = document.querySelectorAll('.sw-group');
  for (var g = 0; g < groups.length; g++) {
    var group = groups[g];
    var onCls = (group.getAttribute('data-sw-on-cls')||'').split(' ').filter(Boolean);
    var btns = group.querySelectorAll('.sw-btn');
    var firstActiveTarget = null;
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var isOn = onCls.length > 0;
      for (var k = 0; k < onCls.length && isOn; k++) { if (!b.classList.contains(onCls[k])) isOn = false; }
      if (isOn && !firstActiveTarget) firstActiveTarget = b.getAttribute('data-sw-target');
    }
    if (firstActiveTarget) swShowTarget(firstActiveTarget, group);
  }
  var allBtns = document.querySelectorAll('.sw-btn');
  for (var m = 0; m < allBtns.length; m++) {
    allBtns[m].onclick = function(){ swSwitch(this); };
  }
  var stacks = document.querySelectorAll('.sw-stack');
  for (var s = 0; s < stacks.length; s++) { swSizeStack(stacks[s]); }
}
function swSizeStack(stack){
  var imgs = stack.querySelectorAll('img');
  if (!imgs.length) return;
  var tallestRatio = 0; // height / width of the tallest image (by natural aspect)
  var pending = imgs.length;
  function consider(img){
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      var ratio = img.naturalHeight / img.naturalWidth;
      if (ratio > tallestRatio) tallestRatio = ratio;
    }
    pending--;
    if (pending <= 0 && tallestRatio > 0) {
      stack.style.aspectRatio = (1 / tallestRatio).toFixed(6) + ' / 1';
    }
  }
  for (var i = 0; i < imgs.length; i++) {
    var img = imgs[i];
    if (img.complete && img.naturalWidth > 0) {
      consider(img);
    } else {
      img.addEventListener('load', function(){ consider(this); });
      img.addEventListener('error', function(){ pending--; });
    }
  }
}
`;

/* ─── Right preview panel ────────────────────── */
let _ppDevice = 'desktop';
let _ppFrameReady = false;
const PP_WIDTHS = { desktop: 1024, mobile: 375 };

function updateRightPreview(html) {
  const frame = document.getElementById('pp-frame');
  const scaleWrap = document.getElementById('pp-scale-wrap');
  const viewportWrap = document.getElementById('pp-viewport-wrap');
  if (!frame) return;

  const w = PP_WIDTHS[_ppDevice] || 1024;
  const availW = viewportWrap.clientWidth - 24;
  const scale = Math.min(1, availW / w);
  const scaledH = Math.max(300, viewportWrap.clientHeight - 24);

  frame.style.width  = w + 'px';
  frame.style.height = (scaledH / scale) + 'px';
  scaleWrap.style.transform = `scale(${scale})`;
  scaleWrap.style.width  = w + 'px';
  scaleWrap.style.height = (scaledH / scale) + 'px';

  // Якщо iframe вже завантажений — оновлюємо лише body через postMessage (без перезавантаження)
  if (_ppFrameReady) {
    frame.contentWindow.postMessage({ type: 'pp-update', html: html || '' }, '*');
    return;
  }

  // Перше завантаження: вбудовуємо слухач повідомлень у iframe
  const fullDoc = `<!DOCTYPE html><html lang="uk"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script>tailwind.config={theme:{extend:{screens:{xs:'0px'}}},safelist:['xs:text-left','xs:text-center','xs:text-right','xs:text-justify','md:text-left','md:text-center','md:text-right','md:text-justify']}<\/script>
    <style>*,*::before,*::after{box-sizing:border-box}img{max-width:100%;height:auto;display:block}body{overflow-x:hidden}</style>
    <script>
      ${SWITCHER_RUNTIME_JS}
      window.addEventListener('message',function(e){
        if(e.data&&e.data.type==='pp-update'){
          document.body.innerHTML=e.data.html;
          swInit();
        }
      });
    <\/script>
  </head><body class="bg-white font-sans text-gray-900 leading-relaxed">${html || ''}
  </body></html>`;

  frame.srcdoc = fullDoc;
  frame.addEventListener('load', () => { _ppFrameReady = true; }, { once: true });
}

document.querySelectorAll('.pp-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pp-tab').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    _ppDevice = btn.dataset.device;
    updateRightPreview(document.getElementById('code-out').value);
  });
});

window.addEventListener('resize', () => {
  updateRightPreview(document.getElementById('code-out').value);
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

/* ─── Row settings panel ─────────────────────── */
function openRowSP(rw) {
  // Close block settings if open
  if (window._activeBlock) {
    const body = document.getElementById('sp-body');
    const padBar = body.querySelector('.block-padbar');
    const fields = body.querySelector('.block-fields');
    if (padBar) window._activeBlock.appendChild(padBar);
    if (fields) window._activeBlock.appendChild(fields);
    window._activeBlock.classList.remove('is-active');
    window._activeBlock = null;
  }

  // Toggle if same row
  if (window._activeRow === rw) { closeSP(); return; }
  if (window._activeRow) window._activeRow.classList.remove('is-settings-active');

  window._activeRow = rw;
  rw.classList.add('is-settings-active');

  document.getElementById('sp-icon').textContent  = '⊞';
  document.getElementById('sp-title').textContent = 'Налаштування контейнера';
  document.getElementById('sp-body').innerHTML = buildRowSettingsHTML(rw);
  document.getElementById('settings-panel').classList.add('is-open');
}

function buildRowSettingsHTML(rw) {
  const pxMob  = rw.dataset.pxMob  ?? 'px-4';
  const pxDsk  = rw.dataset.pxDsk  ?? 'px-4';
  const pyMob  = rw.dataset.pyMob  ?? 'py-4';
  const pyDsk  = rw.dataset.pyDsk  ?? 'py-4';
  const vaMob  = rw.dataset.vaMob  || 'items-center';
  const vaDsk  = rw.dataset.vaDsk  || 'md:items-center';
  const haMob  = rw.dataset.haMob  || 'justify-items-start';
  const haDsk  = rw.dataset.haDsk  || 'md:justify-items-start';
  const bgColor  = rw.dataset.bgColor  || '';
  const bgImage  = rw.dataset.bgImage  || '';
  const bgSize   = rw.dataset.bgSize   || 'cover';
  const bgPos    = rw.dataset.bgPos    || 'center';
  const bgRepeat = rw.dataset.bgRepeat || 'no-repeat';
  const bgMode   = rw.dataset.bgMode   || 'css';   // 'css' | 'overlay' | 'natural'
  const minHMob  = rw.dataset.minHMob  || '';
  const minHDsk  = rw.dataset.minHDsk  || '';
  const gap      = rw.dataset.gap      || 'gap-4';
  const cols   = [...rw.querySelectorAll('.col')];

  const pxOpts  = [['','Без відступу'],['px-2','8px'],['px-3','12px'],['px-4','16px'],['px-6','24px'],['px-8','32px'],['px-10','40px'],['px-12','48px'],['px-16','64px']];
  const pyOpts  = [['','Без відступу'],['py-2','8px'],['py-4','16px'],['py-6','24px'],['py-8','32px'],['py-10','40px'],['py-12','48px'],['py-16','64px']];
  const gapOpts = [['gap-0','0px'],['gap-1','4px'],['gap-2','8px'],['gap-3','12px'],['gap-4','16px'],['gap-5','20px'],['gap-6','24px'],['gap-8','32px'],['gap-10','40px'],['gap-12','48px']];

  const vaMap = {
    mob: [['items-start','↑ Зверху'],['items-center','↕ Центр'],['items-end','↓ Знизу'],['items-stretch','⇕ Розтягнути']],
    dsk: [['md:items-start','↑ Зверху'],['md:items-center','↕ Центр'],['md:items-end','↓ Знизу'],['md:items-stretch','⇕ Розтягнути']],
  };

  const haMap = {
    mob: [['justify-items-start','← Ліво'],['justify-items-center','≡ Центр'],['justify-items-end','→ Право'],['justify-items-stretch','⇔ Розтягнути']],
    dsk: [['md:justify-items-start','← Ліво'],['md:justify-items-center','≡ Центр'],['md:justify-items-end','→ Право'],['md:justify-items-stretch','⇔ Розтягнути']],
  };
  const vvMap = {
    mob: [['justify-start','↑'],['justify-center','↕'],['justify-end','↓'],['justify-between','⇅']],
    dsk: [['md:justify-start','↑'],['md:justify-center','↕'],['md:justify-end','↓'],['md:justify-between','⇅']],
  };

  let colsHTML = '';
  cols.forEach((col, i) => {
    const cvMob = col.dataset.cvMob || 'justify-start';
    const cvDsk = col.dataset.cvDsk || 'md:justify-start';

    colsHTML += `<div class="col-settings-block">
      <div class="col-settings-title">Колонка ${i + 1}</div>
      <div class="form-field mob-only" style="margin-bottom:8px;">
        <label class="form-label">📱 Вертикальне</label>
        <div class="btn-row">
          ${vvMap.mob.map(([v,l]) => `<button class="seg-btn col-align-btn${cvMob===v?' is-on':''}" data-val="${v}" data-col="${i}" data-prop="cvMob" onclick="setColAlign(this)">${l}</button>`).join('')}
        </div>
      </div>
      <div class="form-field dsk-only" style="margin-bottom:0;">
        <label class="form-label">🖥 Вертикальне</label>
        <div class="btn-row">
          ${vvMap.dsk.map(([v,l]) => `<button class="seg-btn col-align-btn${cvDsk===v?' is-on':''}" data-val="${v}" data-col="${i}" data-prop="cvDsk" onclick="setColAlign(this)">${l}</button>`).join('')}
        </div>
      </div>
    </div>`;
  });

  return `
    <div class="sp-group">
      <div class="sp-group-title">Відступи контейнера</div>
      <div class="form-field mob-only">
        <label class="form-label">📱 Горизонтальний відступ</label>
        <select class="fsel" onchange="setRowPy(this.value,'pxMob')" id="row-px-mob">
          ${pxOpts.map(([v,l]) => `<option value="${v}"${pxMob===v?' selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-field dsk-only">
        <label class="form-label">🖥 Горизонтальний відступ</label>
        <select class="fsel" onchange="setRowPy(this.value,'pxDsk')" id="row-px-dsk">
          ${pxOpts.map(([v,l]) => `<option value="${v}"${pxDsk===v?' selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-field mob-only">
        <label class="form-label">📱 Вертикальний відступ</label>
        <select class="fsel" onchange="setRowPy(this.value,'pyMob')" id="row-py-mob">
          ${pyOpts.map(([v,l]) => `<option value="${v}"${pyMob===v?' selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-field dsk-only">
        <label class="form-label">🖥 Вертикальний відступ</label>
        <select class="fsel" onchange="setRowPy(this.value,'pyDsk')" id="row-py-dsk">
          ${pyOpts.map(([v,l]) => `<option value="${v}"${pyDsk===v?' selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label class="form-label">↔ Відступ між колонками</label>
        <select class="fsel" onchange="setRowGap(this.value)" id="row-gap">
          ${gapOpts.map(([v,l]) => `<option value="${v}"${gap===v?" selected":""}>${l}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-group-title">Вирівнювання контейнера (вертикально)</div>
      <div class="form-field mob-only" style="margin-bottom:8px;">
        <div class="btn-row">
          ${vaMap.mob.map(([v,l]) => `<button class="seg-btn row-va-btn${vaMob===v?' is-on':''}" data-val="${v}" data-prop="vaMob" onclick="setRowAlign(this)">${l}</button>`).join('')}
        </div>
      </div>
      <div class="form-field dsk-only" style="margin-bottom:0;">
        <div class="btn-row">
          ${vaMap.dsk.map(([v,l]) => `<button class="seg-btn row-va-btn${vaDsk===v?' is-on':''}" data-val="${v}" data-prop="vaDsk" onclick="setRowAlign(this)">${l}</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-group-title">Вирівнювання контейнера (горизонтально)</div>
      <div class="form-field mob-only" style="margin-bottom:8px;">
        <div class="btn-row">
          ${haMap.mob.map(([v,l]) => `<button class="seg-btn row-ha-btn${haMob===v?' is-on':''}" data-val="${v}" data-prop="haMob" onclick="setRowAlign(this)">${l}</button>`).join('')}
        </div>
      </div>
      <div class="form-field dsk-only" style="margin-bottom:0;">
        <div class="btn-row">
          ${haMap.dsk.map(([v,l]) => `<button class="seg-btn row-ha-btn${haDsk===v?' is-on':''}" data-val="${v}" data-prop="haDsk" onclick="setRowAlign(this)">${l}</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-group-title">Вирівнювання колонок</div>
      ${colsHTML}
    </div>
    <div class="sp-group">
      <div class="sp-group-title">Фон контейнера</div>
      <div class="form-field">
        <label class="form-label">Колір фону</label>
        <div class="color-row" style="gap:6px;align-items:center;">
          <input type="color" class="color-swatch" id="row-bg-swatch"
            value="${/^#[0-9a-fA-F]{6}$/.test(bgColor) ? bgColor : '#ffffff'}"
            oninput="rowBgSwatchChange(this)">
          <input type="text" class="fi color-hex" id="row-bg-hex"
            value="${bgColor}" placeholder="transparent / #fff / rgba(0,0,0,.5) / …"
            oninput="rowBgHexChange(this)" style="flex:1;">
          <button class="seg-btn" style="flex-shrink:0;padding:0 8px;" onclick="clearRowBg()" title="Очистити фон">✕</button>
        </div>
        <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">
          ${['#ffffff','#f9fafb','#f3f4f6','#111827','#1e3a5f','#1d4ed8','#dc2626','#16a34a','#ca8a04','#7c3aed'].map(c =>
            `<button onclick="applyRowBgPreset('${c}')" title="${c}"
              style="width:22px;height:22px;border-radius:4px;border:1.5px solid var(--line);background:${c};cursor:pointer;flex-shrink:0;transition:transform .1s;"
              onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform=''"></button>`
          ).join('')}
        </div>
      </div>
      <div class="form-field" style="margin-top:12px;">
        <label class="form-label">Фонове зображення (URL)</label>
        <div style="display:flex;gap:4px;align-items:center;">
          <input type="url" class="fi" id="row-bg-img"
            value="${bgImage}" placeholder="https://…"
            oninput="setRowBgImage(this.value)" style="flex:1;">
          <button class="seg-btn" style="flex-shrink:0;padding:0 8px;" onclick="clearRowBgImage()" title="Очистити зображення">✕</button>
        </div>
      </div>
      <div class="form-field${bgImage ? '' : ' hidden'}" id="row-bg-img-opts">
        <div style="margin-top:8px;padding:8px 10px;background:var(--blue-bg);border:1px solid var(--blue-mid);border-radius:var(--radius-sm);">
          <div style="font-size:11px;font-weight:700;color:var(--blue);margin-bottom:8px;letter-spacing:.3px;">📐 ВИСОТА КОНТЕЙНЕРА</div>
          <div class="f2" style="margin-bottom:0;">
            <div class="mob-only">
              <label class="form-label">📱 Мін. висота</label>
              <select class="fsel" id="row-minh-mob" onchange="setRowMinH(this.value,'minHMob')">
                <option value=""${minHMob===''?' selected':''}>авто (за вмістом)</option>
                <option value="150px"${minHMob==='150px'?' selected':''}>150px</option>
                <option value="200px"${minHMob==='200px'?' selected':''}>200px</option>
                <option value="300px"${minHMob==='300px'?' selected':''}>300px</option>
                <option value="400px"${minHMob==='400px'?' selected':''}>400px</option>
                <option value="500px"${minHMob==='500px'?' selected':''}>500px</option>
                <option value="50vh"${minHMob==='50vh'?' selected':''}>50vh (пів екрану)</option>
                <option value="100vh"${minHMob==='100vh'?' selected':''}>100vh (весь екран)</option>
              </select>
            </div>
            <div class="dsk-only">
              <label class="form-label">🖥 Мін. висота</label>
              <select class="fsel" id="row-minh-dsk" onchange="setRowMinH(this.value,'minHDsk')">
                <option value=""${minHDsk===''?' selected':''}>авто (за вмістом)</option>
                <option value="150px"${minHDsk==='150px'?' selected':''}>150px</option>
                <option value="200px"${minHDsk==='200px'?' selected':''}>200px</option>
                <option value="300px"${minHDsk==='300px'?' selected':''}>300px</option>
                <option value="400px"${minHDsk==='400px'?' selected':''}>400px</option>
                <option value="500px"${minHDsk==='500px'?' selected':''}>500px</option>
                <option value="600px"${minHDsk==='600px'?' selected':''}>600px</option>
                <option value="50vh"${minHDsk==='50vh'?' selected':''}>50vh (пів екрану)</option>
                <option value="100vh"${minHDsk==='100vh'?' selected':''}>100vh (весь екран)</option>
              </select>
            </div>
          </div>
        </div>
        <div class="f2" style="margin-top:8px;">
          <div>
            <label class="form-label">Розмір</label>
            <select class="fsel" id="row-bg-size" onchange="setRowBgSize(this.value)">
              <option value="cover"${bgSize==='cover'?' selected':''}>cover — заповнити</option>
              <option value="contain"${bgSize==='contain'?' selected':''}>contain — вмістити</option>
              <option value="auto"${bgSize==='auto'?' selected':''}>auto — оригінал</option>
              <option value="100% 100%"${bgSize==='100% 100%'?' selected':''}>розтягнути</option>
            </select>
          </div>
          <div>
            <label class="form-label">Позиція</label>
            <select class="fsel" id="row-bg-pos" onchange="setRowBgPos(this.value)">
              <option value="center"${bgPos==='center'?' selected':''}>по центру</option>
              <option value="top"${bgPos==='top'?' selected':''}>зверху</option>
              <option value="bottom"${bgPos==='bottom'?' selected':''}>знизу</option>
              <option value="left"${bgPos==='left'?' selected':''}>ліво</option>
              <option value="right"${bgPos==='right'?' selected':''}>право</option>
              <option value="top left"${bgPos==='top left'?' selected':''}>ліво-зверху</option>
              <option value="top right"${bgPos==='top right'?' selected':''}>право-зверху</option>
            </select>
          </div>
        </div>
        <div style="margin-top:6px;">
          <label class="form-label">Повторення</label>
          <select class="fsel" id="row-bg-repeat" onchange="setRowBgRepeat(this.value)">
            <option value="no-repeat"${bgRepeat==='no-repeat'?' selected':''}>без повторення</option>
            <option value="repeat"${bgRepeat==='repeat'?' selected':''}>повторювати</option>
            <option value="repeat-x"${bgRepeat==='repeat-x'?' selected':''}>горизонтально</option>
            <option value="repeat-y"${bgRepeat==='repeat-y'?' selected':''}>вертикально</option>
          </select>
        </div>
        <div style="margin-top:8px;padding:8px 10px;background:var(--surface3);border:1px solid var(--line);border-radius:var(--radius-sm);">
          <div style="font-size:11px;font-weight:700;color:var(--t3);margin-bottom:8px;letter-spacing:.3px;">🖼 РЕЖИМ ЗОБРАЖЕННЯ</div>
          <div class="btn-row" style="gap:3px;">
            <button class="seg-btn${bgMode==='css'?' is-on':''}" style="flex:1;justify-content:center;" onclick="setRowBgMode('css')">CSS фон</button>
            <button class="seg-btn${bgMode==='overlay'?' is-on':''}" style="flex:1;justify-content:center;" onclick="setRowBgMode('overlay')">Абсолютне</button>
            <button class="seg-btn${bgMode==='natural'?' is-on':''}" style="flex:1;justify-content:center;" onclick="setRowBgMode('natural')">Природнє</button>
          </div>
          <div style="margin-top:8px;font-size:11px;color:var(--t4);line-height:1.6;">
            ${bgMode === 'css'
              ? '⬜ <b>CSS фон</b> — <code style="font-family:monospace">background-image</code>. Висота залежить від вмісту. Використовуйте мін. висоту.'
              : bgMode === 'overlay'
              ? '🔲 <b>Абсолютне</b> — <code style="font-family:monospace">&lt;img&gt;</code> з <code style="font-family:monospace">position:absolute</code> за вмістом. Задайте мін. висоту або заповніть колонки.'
              : '🖼 <b>Природнє</b> — зображення у потоці визначає висоту контейнера. Вміст накладається поверх через <code style="font-family:monospace">position:absolute</code>.'
            }
          </div>
        </div>
      </div>
    </div>`;
}

function setRowPy(val, prop) {
  if (!window._activeRow) return;
  window._activeRow.dataset[prop] = val;
  refreshCode();
}

function setRowGap(val) {
  if (!window._activeRow) return;
  window._activeRow.dataset.gap = val;
  refreshCode();
}

function setRowAlign(btn) {
  if (!window._activeRow) return;
  const prop = btn.dataset.prop;
  window._activeRow.dataset[prop] = btn.dataset.val;
  // update btn states within same prop group
  btn.closest('.btn-row').querySelectorAll('.seg-btn').forEach(b => b.classList.remove('is-on'));
  btn.classList.add('is-on');
  refreshCode();
}

function setRowBg(val) {
  if (!window._activeRow) return;
  window._activeRow.dataset.bgColor = val;
  // live-tint the canvas row for feedback
  window._activeRow.style.backgroundColor = val || '';
  refreshCode();
}

function rowBgSwatchChange(swatch) {
  const hex = swatch.value;
  const hexInput = document.getElementById('row-bg-hex');
  if (hexInput) hexInput.value = hex;
  setRowBg(hex);
}

function rowBgHexChange(input) {
  const val = input.value.trim();
  // Try to sync swatch if it's a valid 6-digit hex
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    const swatch = document.getElementById('row-bg-swatch');
    if (swatch) swatch.value = val;
  }
  setRowBg(val);
}

function clearRowBg() {
  const hexInput  = document.getElementById('row-bg-hex');
  const swatch    = document.getElementById('row-bg-swatch');
  if (hexInput) hexInput.value = '';
  if (swatch)   swatch.value  = '#ffffff';
  setRowBg('');
}

function applyRowBgPreset(color) {
  const hexInput = document.getElementById('row-bg-hex');
  const swatch   = document.getElementById('row-bg-swatch');
  if (hexInput) hexInput.value = color;
  if (swatch)   swatch.value  = color;
  setRowBg(color);
}

function setRowBgImage(url) {
  if (!window._activeRow) return;
  window._activeRow.dataset.bgImage = url.trim();
  // Show/hide options block
  const opts = document.getElementById('row-bg-img-opts');
  if (opts) opts.classList.toggle('hidden', !url.trim());
  refreshCode();
}

function clearRowBgImage() {
  const inp = document.getElementById('row-bg-img');
  if (inp) inp.value = '';
  setRowBgImage('');
}

function setRowBgSize(val) {
  if (!window._activeRow) return;
  window._activeRow.dataset.bgSize = val;
  refreshCode();
}

function setRowBgPos(val) {
  if (!window._activeRow) return;
  window._activeRow.dataset.bgPos = val;
  refreshCode();
}

function setRowBgRepeat(val) {
  if (!window._activeRow) return;
  window._activeRow.dataset.bgRepeat = val;
  refreshCode();
}

function setRowMinH(val, prop) {
  if (!window._activeRow) return;
  window._activeRow.dataset[prop] = val;
  refreshCode();
}

function setRowBgMode(mode) {
  if (!window._activeRow) return;
  window._activeRow.dataset.bgMode = mode;
  // Re-render settings panel to update description text and button states
  document.getElementById('sp-body').innerHTML = buildRowSettingsHTML(window._activeRow);
  refreshCode();
}

function setColAlign(btn) {
  if (!window._activeRow) return;
  const prop   = btn.dataset.prop;
  const colIdx = parseInt(btn.dataset.col);
  const cols   = [...window._activeRow.querySelectorAll('.col')];
  const col    = cols[colIdx];
  if (!col) return;
  col.dataset[prop] = btn.dataset.val;
  btn.closest('.btn-row').querySelectorAll('.seg-btn').forEach(b => b.classList.remove('is-on'));
  btn.classList.add('is-on');
  refreshCode();
}

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

/* ═══════════════════════════════════════════════
   ROW SYSTEM
═══════════════════════════════════════════════ */
function makeGap() {
  const gap = document.createElement('div');
  gap.className = 'row-gap';
  gap.innerHTML = `<div class="row-gap-line"></div><button class="row-gap-btn" title="Додати контейнер тут">+</button>`;
  gap.querySelector('.row-gap-btn').addEventListener('click', e => { e.stopPropagation(); openLayoutModal(gap); });
  return gap;
}

function makeAddBlockBtn(col) {
  const btn = document.createElement('button');
  btn.className = 'add-block-btn';
  btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/></svg> Блок`;
  btn.addEventListener('click', e => { e.stopPropagation(); openBlockModal(col); });
  return btn;
}

function addRow(key) {
  const lay = LAYOUTS[key] || LAYOUTS['1'];
  const id  = ++rowCnt;

  const rw = document.createElement('div');
  rw.className   = 'row';
  rw.dataset.key = key;
  rw.id          = `rw-${id}`;
  // Row alignment defaults
  rw.dataset.pxMob = 'px-4';
  rw.dataset.pxDsk = 'px-4';
  rw.dataset.pyMob = 'py-4';
  rw.dataset.pyDsk = 'py-4';
  rw.dataset.vaMob = 'items-center';
  rw.dataset.vaDsk = 'md:items-center';

  const bar = document.createElement('div');
  bar.className = 'row-bar';
  bar.innerHTML = `
    <span class="row-handle" title="Перетягнути рядок">⠿</span>
    <span class="row-label">Контейнер <span class="row-num"></span></span>
    <span class="row-tag">${lay.label}</span>
    <div class="row-actions">
      <button class="ib" data-action="settings" title="Налаштування контейнера">⚙</button>
      <button class="ib" data-action="up"  title="Вгору">↑</button>
      <button class="ib" data-action="down" title="Вниз">↓</button>
      <button class="ib" data-action="dup" title="Копіювати контейнер">⧉</button>
      <button class="ib danger" data-action="del" title="Видалити контейнер">✕</button>
    </div>`;

  bar.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'settings') openRowSP(rw);
    if (action === 'up')   moveRow(rw, -1);
    if (action === 'down') moveRow(rw, 1);
    if (action === 'dup')  dupRow(rw);
    if (action === 'del')  removeRow(rw);
  });

  const colsWrap = document.createElement('div');
  colsWrap.className = 'row-cols';
  colsWrap.id = `rcols-${id}`;

  lay.flex.forEach((f, i) => {
    const col = document.createElement('div');
    col.className  = 'col';
    col.style.flex = f;
    col.dataset.colIndex = i;
    // Column alignment defaults
    col.dataset.haMob = 'items-start';
    col.dataset.haDsk = 'md:items-start';
    col.dataset.cvMob = 'justify-start';
    col.dataset.cvDsk = 'md:justify-start';
    col.appendChild(makeAddBlockBtn(col));
    bindColDrop(col);
    colsWrap.appendChild(col);
  });

  rw.appendChild(bar);
  rw.appendChild(colsWrap);

  const canvas  = document.getElementById('canvas');
  const addZone = document.getElementById('add-row-zone');

  if (_pendingAfterEl) {
    const newGap = makeGap();
    _pendingAfterEl.insertAdjacentElement('afterend', rw);
    rw.insertAdjacentElement('afterend', newGap);
  } else {
    const topGap = makeGap();
    canvas.insertBefore(topGap, addZone);
    canvas.insertBefore(rw, addZone);
  }

  document.getElementById('empty-state')?.classList.add('hidden');
  bindRowDrag(rw);
  renumRows();
  refreshCode();
  showToast('Контейнер додано');
  return rw;
}

function removeRow(rw) {
  if (window._activeBlock && rw.contains(window._activeBlock)) closeSP();
  if (window._activeRow === rw) closeSP();
  const prev = rw.previousElementSibling;
  if (prev?.classList.contains('row-gap')) prev.remove();
  rw.remove();
  if (!document.querySelector('#canvas .row')) document.getElementById('empty-state')?.classList.remove('hidden');
  renumRows();
  refreshCode();
}

function renumRows() {
  document.querySelectorAll('#canvas .row .row-num').forEach((el, i) => { el.textContent = i + 1; });
}

function moveRow(rw, dir) {
  const canvas = document.getElementById('canvas');
  const rows   = [...canvas.querySelectorAll('.row')];
  const idx    = rows.indexOf(rw);
  const target = rows[idx + dir];
  if (!target) return;
  const rwGap  = rw.previousElementSibling?.classList.contains('row-gap')     ? rw.previousElementSibling     : null;
  const tgtGap = target.previousElementSibling?.classList.contains('row-gap') ? target.previousElementSibling : null;
  if (dir === -1) {
    if (tgtGap) canvas.insertBefore(rw, tgtGap);
    else        canvas.insertBefore(rw, target);
    if (rwGap)  canvas.insertBefore(rwGap, rw);
  } else {
    if (rwGap)  canvas.insertBefore(target, rwGap);
    else        canvas.insertBefore(target, rw);
    if (tgtGap) canvas.insertBefore(tgtGap, target);
  }
  renumRows();
  refreshCode();
}

function dupRow(srcRw) {
  // If a block inside this row is currently open in the settings panel,
  // temporarily move its fields back into the block so cloneNode captures them.
  let _restoredBlock = null;
  let _restoredPadBar = null;
  let _restoredFields = null;
  if (window._activeBlock && srcRw.contains(window._activeBlock)) {
    const spBody = document.getElementById('sp-body');
    _restoredBlock  = window._activeBlock;
    _restoredPadBar = spBody.querySelector('.block-padbar');
    _restoredFields = spBody.querySelector('.block-fields');
    if (_restoredPadBar) _restoredBlock.appendChild(_restoredPadBar);
    if (_restoredFields) _restoredBlock.appendChild(_restoredFields);
  }

  // Sync form values to attributes before cloning
  srcRw.querySelectorAll('input').forEach(el => {
    if (el.type === 'checkbox') el.checked ? el.setAttribute('checked','') : el.removeAttribute('checked');
    else el.setAttribute('value', el.value);
  });
  // textarea: value is textContent, not an attribute — set it directly before clone
  srcRw.querySelectorAll('textarea').forEach(el => { el.textContent = el.value; });
  srcRw.querySelectorAll('select').forEach(s => {
    [...s.options].forEach((opt, i) => i === s.selectedIndex ? opt.setAttribute('selected','') : opt.removeAttribute('selected'));
  });

  const clone  = srcRw.cloneNode(true);

  // After clone, restore textareas (textContent change affects live DOM too)
  srcRw.querySelectorAll('textarea').forEach(el => { el.textContent = el.value; });
  // Also sync clone's textareas .value from textContent
  const srcTAs  = [...srcRw.querySelectorAll('textarea')];
  const cloneTAs = [...clone.querySelectorAll('textarea')];
  srcTAs.forEach((src, i) => { if (cloneTAs[i]) cloneTAs[i].value = src.value; });

  // Move the fields back to the settings panel if we temporarily moved them
  if (_restoredBlock) {
    const spBody = document.getElementById('sp-body');
    if (_restoredPadBar) spBody.appendChild(_restoredPadBar);
    if (_restoredFields) spBody.appendChild(_restoredFields);
  }
  const newId  = ++rowCnt;
  clone.id     = `rw-${newId}`;
  clone.querySelectorAll('[id]').forEach(el => { el.id = el.id + '-c' + newId; });

  // Re-bind columns
  clone.querySelectorAll('.col').forEach(col => {
    col._dropBound = false;
    const oldBtn = col.querySelector('.add-block-btn');
    if (oldBtn) oldBtn.replaceWith(makeAddBlockBtn(col));
    bindColDrop(col);
  });

  // Re-bind blocks
  clone.querySelectorAll('.block').forEach(b => {
    const oldBid = b.dataset.bid;
    const newBid = ++blkCnt;
    b.dataset.bid = newBid;
    // ВАЖЛИВО: раніше тут була "сліпа" заміна підрядка "-oldBid" по
    // всьому innerHTML блоку. Це ламало Tailwind-класи, чиє числове
    // закінчення випадково збігалося з bid (напр. bid=3 і клас "px-3"
    // → ставало "px-14"; так само могло зачепити "rounded-2xl",
    // "border-2", "shadow-2xl", "gap-3" тощо). Тепер bid переписуємо
    // лише в точно визначених місцях, де він реально використовується:
    // виклики addTextLine(this, N) / addSwitcherItem(this, N) та
    // id="tl-N" — і більше ніде.
    b.innerHTML = b.innerHTML
      .replace(new RegExp(`id="tl-${oldBid}"`, 'g'), `id="tl-${newBid}"`)
      .replace(new RegExp(`\\b(addTextLine|addSwitcherItem)\\(this,\\s*${oldBid}\\)`, 'g'), `$1(this, ${newBid})`);
    bindBlockDrag(b);
    // Replace tile node to clear any cloned event listeners
    const oldTile = b.querySelector('.block-tile');
    if (oldTile) {
      const freshTile = oldTile.cloneNode(true);
      oldTile.replaceWith(freshTile);
      freshTile.addEventListener('click', e => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action === 'del') { e.stopPropagation(); removeBlock(b); return; }
        if (action === 'drag') return;
        openSP(b);
      });
    }
  });

  // Re-bind bar click handler for the clone
  const cloneBar = clone.querySelector('.row-bar');
  if (cloneBar) {
    // Remove old cloned listeners by replacing with a fresh clone of bar
    const freshBar = cloneBar.cloneNode(true);
    cloneBar.replaceWith(freshBar);
    freshBar.addEventListener('click', e => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'settings') openRowSP(clone);
      if (action === 'up')       moveRow(clone, -1);
      if (action === 'down')     moveRow(clone, 1);
      if (action === 'dup')      dupRow(clone);
      if (action === 'del')      removeRow(clone);
    });
  }

  const newGap = makeGap();
  const addZone = document.getElementById('add-row-zone');
  const canvas2 = document.getElementById('canvas');
  canvas2.insertBefore(newGap, addZone);
  canvas2.insertBefore(clone, addZone);
  bindRowDrag(clone);
  renumRows();
  refreshCode();
  showToast('Рядок скопійовано');
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
  tile.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'del') { e.stopPropagation(); removeBlock(block); return; }
    if (action === 'drag') return;
    openSP(block);
  });

  const padBar = document.createElement('div');
  padBar.className = 'block-padbar';
  padBar.innerHTML = buildPadBar(bid);

  const fields = document.createElement('div');
  fields.className = 'block-fields';
  fields.innerHTML = buildFields(type, bid);

  block.appendChild(tile);
  block.appendChild(padBar);
  block.appendChild(fields);

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
