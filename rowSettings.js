/* ═══════════════════════════════════════════════
   ROW SETTINGS — панель налаштувань контейнера (рядка)
   ───────────────────────────────────────────────
   buildRowSettingsHTML(rw) генерує розмітку панелі, яка щоразу
   перечитує поточні dataset-значення рядка (bgColor/bgImage тощо)
   і вставляє їх назад у value="..." — тому вони ОБОВ'ЯЗКОВО йдуть
   через esc() (інакше значення, введене користувачем у полі
   кольору/URL, могло б вирватися за межі атрибута при наступному
   рендері панелі).

   Усі поля без inline onclick/oninput/onchange — керування через
   делеговані обробники в delegate.js за data-action.
═══════════════════════════════════════════════ */

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
          ${vvMap.mob.map(([v,l]) => `<button class="seg-btn col-align-btn${cvMob===v?' is-on':''}" data-val="${v}" data-col="${i}" data-prop="cvMob" data-action="col-align">${l}</button>`).join('')}
        </div>
      </div>
      <div class="form-field dsk-only" style="margin-bottom:0;">
        <label class="form-label">🖥 Вертикальне</label>
        <div class="btn-row">
          ${vvMap.dsk.map(([v,l]) => `<button class="seg-btn col-align-btn${cvDsk===v?' is-on':''}" data-val="${v}" data-col="${i}" data-prop="cvDsk" data-action="col-align">${l}</button>`).join('')}
        </div>
      </div>
    </div>`;
  });

  return `
    <div class="sp-group">
      <div class="sp-group-title">Відступи контейнера</div>
      <div class="form-field mob-only">
        <label class="form-label">📱 Горизонтальний відступ</label>
        <select class="fsel" data-action="row-px-py" data-prop="pxMob" id="row-px-mob">
          ${pxOpts.map(([v,l]) => `<option value="${v}"${pxMob===v?' selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-field dsk-only">
        <label class="form-label">🖥 Горизонтальний відступ</label>
        <select class="fsel" data-action="row-px-py" data-prop="pxDsk" id="row-px-dsk">
          ${pxOpts.map(([v,l]) => `<option value="${v}"${pxDsk===v?' selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-field mob-only">
        <label class="form-label">📱 Вертикальний відступ</label>
        <select class="fsel" data-action="row-px-py" data-prop="pyMob" id="row-py-mob">
          ${pyOpts.map(([v,l]) => `<option value="${v}"${pyMob===v?' selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-field dsk-only">
        <label class="form-label">🖥 Вертикальний відступ</label>
        <select class="fsel" data-action="row-px-py" data-prop="pyDsk" id="row-py-dsk">
          ${pyOpts.map(([v,l]) => `<option value="${v}"${pyDsk===v?' selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label class="form-label">↔ Відступ між колонками</label>
        <select class="fsel" data-action="row-gap" id="row-gap">
          ${gapOpts.map(([v,l]) => `<option value="${v}"${gap===v?" selected":""}>${l}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-group-title">Вирівнювання контейнера (вертикально)</div>
      <div class="form-field mob-only" style="margin-bottom:8px;">
        <div class="btn-row">
          ${vaMap.mob.map(([v,l]) => `<button class="seg-btn row-va-btn${vaMob===v?' is-on':''}" data-val="${v}" data-prop="vaMob" data-action="row-align">${l}</button>`).join('')}
        </div>
      </div>
      <div class="form-field dsk-only" style="margin-bottom:0;">
        <div class="btn-row">
          ${vaMap.dsk.map(([v,l]) => `<button class="seg-btn row-va-btn${vaDsk===v?' is-on':''}" data-val="${v}" data-prop="vaDsk" data-action="row-align">${l}</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-group-title">Вирівнювання контейнера (горизонтально)</div>
      <div class="form-field mob-only" style="margin-bottom:8px;">
        <div class="btn-row">
          ${haMap.mob.map(([v,l]) => `<button class="seg-btn row-ha-btn${haMob===v?' is-on':''}" data-val="${v}" data-prop="haMob" data-action="row-align">${l}</button>`).join('')}
        </div>
      </div>
      <div class="form-field dsk-only" style="margin-bottom:0;">
        <div class="btn-row">
          ${haMap.dsk.map(([v,l]) => `<button class="seg-btn row-ha-btn${haDsk===v?' is-on':''}" data-val="${v}" data-prop="haDsk" data-action="row-align">${l}</button>`).join('')}
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
            data-action="row-bg-swatch">
          <input type="text" class="fi color-hex" id="row-bg-hex"
            value="${esc(bgColor)}" placeholder="transparent / #fff / rgba(0,0,0,.5) / …"
            data-action="row-bg-hex" style="flex:1;">
          <button class="seg-btn" style="flex-shrink:0;padding:0 8px;" data-action="row-bg-clear" title="Очистити фон">✕</button>
        </div>
        <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">
          ${['#ffffff','#f9fafb','#f3f4f6','#111827','#1e3a5f','#1d4ed8','#dc2626','#16a34a','#ca8a04','#7c3aed'].map(c =>
            `<button class="swatch-btn" data-action="row-bg-preset" data-color="${c}" title="${c}"
              style="width:22px;height:22px;border-radius:4px;border:1.5px solid var(--line);background:${c};cursor:pointer;flex-shrink:0;"></button>`
          ).join('')}
        </div>
      </div>
      <div class="form-field" style="margin-top:12px;">
        <label class="form-label">Фонове зображення (URL)</label>
        <div style="display:flex;gap:4px;align-items:center;">
          <input type="url" class="fi" id="row-bg-img"
            value="${esc(bgImage)}" placeholder="https://…"
            data-action="row-bg-image" style="flex:1;">
          <button class="seg-btn" style="flex-shrink:0;padding:0 8px;" data-action="row-bg-image-clear" title="Очистити зображення">✕</button>
        </div>
        <label class="img-dropzone" style="margin-top:6px;display:block;">
          📁 Або перетягніть файл сюди / натисніть, щоб обрати
          <input type="file" accept="image/*" data-action="row-bg-file-change">
        </label>
      </div>
      <div class="form-field${bgImage ? '' : ' hidden'}" id="row-bg-img-opts">
        <div style="margin-top:8px;padding:8px 10px;background:var(--blue-bg);border:1px solid var(--blue-mid);border-radius:var(--radius-sm);">
          <div style="font-size:11px;font-weight:700;color:var(--blue);margin-bottom:8px;letter-spacing:.3px;">📐 ВИСОТА КОНТЕЙНЕРА</div>
          <div class="f2" style="margin-bottom:0;">
            <div class="mob-only">
              <label class="form-label">📱 Мін. висота</label>
              <select class="fsel" id="row-minh-mob" data-action="row-minh" data-prop="minHMob">
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
              <select class="fsel" id="row-minh-dsk" data-action="row-minh" data-prop="minHDsk">
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
            <select class="fsel" id="row-bg-size" data-action="row-bg-size">
              <option value="cover"${bgSize==='cover'?' selected':''}>cover — заповнити</option>
              <option value="contain"${bgSize==='contain'?' selected':''}>contain — вмістити</option>
              <option value="auto"${bgSize==='auto'?' selected':''}>auto — оригінал</option>
              <option value="100% 100%"${bgSize==='100% 100%'?' selected':''}>розтягнути</option>
            </select>
          </div>
          <div>
            <label class="form-label">Позиція</label>
            <select class="fsel" id="row-bg-pos" data-action="row-bg-pos">
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
          <select class="fsel" id="row-bg-repeat" data-action="row-bg-repeat">
            <option value="no-repeat"${bgRepeat==='no-repeat'?' selected':''}>без повторення</option>
            <option value="repeat"${bgRepeat==='repeat'?' selected':''}>повторювати</option>
            <option value="repeat-x"${bgRepeat==='repeat-x'?' selected':''}>горизонтально</option>
            <option value="repeat-y"${bgRepeat==='repeat-y'?' selected':''}>вертикально</option>
          </select>
        </div>
        <div style="margin-top:8px;padding:8px 10px;background:var(--surface3);border:1px solid var(--line);border-radius:var(--radius-sm);">
          <div style="font-size:11px;font-weight:700;color:var(--t3);margin-bottom:8px;letter-spacing:.3px;">🖼 РЕЖИМ ЗОБРАЖЕННЯ</div>
          <div class="btn-row" style="gap:3px;">
            <button class="seg-btn${bgMode==='css'?' is-on':''}" style="flex:1;justify-content:center;" data-action="row-bg-mode" data-mode="css">CSS фон</button>
            <button class="seg-btn${bgMode==='overlay'?' is-on':''}" style="flex:1;justify-content:center;" data-action="row-bg-mode" data-mode="overlay">Абсолютне</button>
            <button class="seg-btn${bgMode==='natural'?' is-on':''}" style="flex:1;justify-content:center;" data-action="row-bg-mode" data-mode="natural">Природнє</button>
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
