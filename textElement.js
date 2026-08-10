/* ═══════════════════════════════════════════════
   TEXT ELEMENT — блок "Текст" (📝)
   ───────────────────────────────────────────────
   Все, що стосується текстового блоку, зібрано тут:

   - buildTextFields(bid)   — панель налаштувань у sidebar
   - makeTextLine(bid)      — HTML одного рядка тексту (з усіма
                               контролами: розмір, шрифт, вирівнювання,
                               міжрядковий інтервал, колір і т.д.)
   - addTextLine(...)       — додавання нового рядка тексту в список
   - renderTextHTML(...)    — генерація фінального HTML для експорту
                               (викликається з core.js → blockToHTML())

   Хелпери керування конкретним рядком тексту (кнопки в редакторі,
   а не сам HTML-вивід):
   - segToggle, setAlign, setWeight, segSingle
   - applyTagDefaults — застосовує пресет розміру/жирності при виборі тега
   - setTlColor        — вибір кольору тексту з палітри

   Примітка: textLinesToHTML() (сам рендер списку рядків у HTML)
   лежить у core.js, бо його використовують також image.js і
   video.js (підписи під фото/відео, текст поверх фото).
═══════════════════════════════════════════════ */

/* ─── Fields (панель налаштувань) ────────────── */
function buildTextFields(bid) {
  return `
    <div class="sp-group">
      <div class="sp-group-title">Рядки тексту</div>
      <div class="tl-list" id="tl-${bid}">${makeTextLine(bid)}</div>
      <button class="add-item-btn" onclick="addTextLine(this, ${bid})">+ Додати рядок</button>
    </div>`;
}

/* ─── Full text line ─────────────────────────── */
function makeTextLine(bid) {
  return `<div class="text-line-item">
    <div class="tli-row flex-end">
      <button class="ib danger bg-red-800 hover:bg-red-300 text-white" style="flex:1;flex-shrink:0;font-size:12px;font-weight:700;" onclick="this.closest('.text-line-item').remove();refreshCode()">✕ Видалити</button>
    </div>
    <div class="tli-row">
      <textarea class="fi tl-input" style="flex:1;min-height:60px;resize:vertical;white-space:pre-wrap;word-break:break-word;" placeholder="Текст рядка…" oninput="refreshCode()"></textarea>
    </div>
    <div class="tli-controls">
      <div class="tli-ctrl-row">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">Тег</span>
        <select class="fsel tl-tag" style="flex: 1 1 0%;flex-shrink:0;" oninput="applyTagDefaults(this);refreshCode()">
          <option value="h3">Заголовок</option>
          <option value="p" selected>Нормальний</option>
        </select>
      </div>
      <div class="tli-ctrl-row mob-only">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">📱 Розмір</span>
        <select class="fsel tl-sz-mob" style="flex: 1 1 0%;" oninput="refreshCode()">
          <option value="text-[10px]">10px</option>
          <option value="text-[12px]">12px</option>
          <option value="text-[14px]">14px</option>
          <option value="text-[16px]" selected>16px</option>
          <option value="text-[18px]">18px</option>
          <option value="text-[20px]">20px</option>
          <option value="text-[24px]">24px</option>
          <option value="text-[28px]">28px</option>
          <option value="text-[32px]">32px</option>
          <option value="text-[36px]">36px</option>
          <option value="text-[40px]">40px</option>
          <option value="text-[48px]">48px</option>
          <option value="text-[56px]">56px</option>
          <option value="text-[64px]">64px</option>
        </select>
      </div>
      <div class="tli-ctrl-row dsk-only">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">🖥 Розмір</span>
        <select class="fsel tl-sz-dsk" style="flex: 1 1 0%;" oninput="refreshCode()">
          <option value="text-[10px]">10px</option>
          <option value="text-[12px]">12px</option>
          <option value="text-[14px]">14px</option>
          <option value="text-[16px]" selected>16px</option>
          <option value="text-[18px]">18px</option>
          <option value="text-[20px]">20px</option>
          <option value="text-[24px]">24px</option>
          <option value="text-[28px]">28px</option>
          <option value="text-[32px]">32px</option>
          <option value="text-[36px]">36px</option>
          <option value="text-[40px]">40px</option>
          <option value="text-[48px]">48px</option>
          <option value="text-[56px]">56px</option>
          <option value="text-[64px]">64px</option>
        </select>
      </div>
      <div class="tli-ctrl-row mob-only">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">Шрифт</span>
        <select class="fsel tl-font mob-font" style="flex: 1 1 0%;" oninput="refreshCode()">
          <option value="font-sans" selected>Sans</option>
          <option value="font-serif">Serif</option>
          <option value="font-mono">Mono</option>
        </select>
      </div>
      <div class="tli-ctrl-row dsk-only">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">Шрифт</span>
        <select class="fsel tl-font dsk-font" style="flex: 1 1 0%;" oninput="refreshCode()">
          <option value="font-sans" selected>Sans</option>
          <option value="font-serif">Serif</option>
          <option value="font-mono">Mono</option>
        </select>
      </div>
      <div class="tli-ctrl-row mob-only">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">Вирівнювання</span>
        <div class="btn-row">
          <button class="seg-btn tl-align-mob is-on"  data-val="text-left"    onclick="setAlign(this,'tl-align-mob');refreshCode()">←</button>
          <button class="seg-btn tl-align-mob"        data-val="text-center"  onclick="setAlign(this,'tl-align-mob');refreshCode()">≡</button>
          <button class="seg-btn tl-align-mob"        data-val="text-right"   onclick="setAlign(this,'tl-align-mob');refreshCode()">→</button>
          <button class="seg-btn tl-align-mob"        data-val="text-justify" onclick="setAlign(this,'tl-align-mob');refreshCode()">⇔</button>
        </div>
      </div>
      <div class="tli-ctrl-row dsk-only">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">Вирівнювання</span>
        <div class="btn-row">
          <button class="seg-btn tl-align-dsk is-on"  data-val="text-left"    onclick="setAlign(this,'tl-align-dsk');refreshCode()">←</button>
          <button class="seg-btn tl-align-dsk"        data-val="text-center"  onclick="setAlign(this,'tl-align-dsk');refreshCode()">≡</button>
          <button class="seg-btn tl-align-dsk"        data-val="text-right"   onclick="setAlign(this,'tl-align-dsk');refreshCode()">→</button>
          <button class="seg-btn tl-align-dsk"        data-val="text-justify" onclick="setAlign(this,'tl-align-dsk');refreshCode()">⇔</button>
        </div>
      </div>
      <div class="tli-ctrl-row justify-between">
        <div class="btn-row">
          <button class="seg-btn tl-w is-on"  data-val=""               onclick="setWeight(this);refreshCode()">N</button>
          <button class="seg-btn tl-w"        data-val="font-medium"    onclick="setWeight(this);refreshCode()">M</button>
          <button class="seg-btn tl-w"        data-val="font-semibold"  onclick="setWeight(this);refreshCode()">SB</button>
          <button class="seg-btn tl-w"        data-val="font-bold"      onclick="setWeight(this);refreshCode()">B</button>
        </div>
        <div class="btn-row">
          <button class="seg-btn tl-it"  data-val="italic"       onclick="segSingle(this);refreshCode()"><em>I</em></button>
          <button class="seg-btn tl-un"  data-val="underline"    onclick="segSingle(this);refreshCode()"><u>U</u></button>
          <button class="seg-btn tl-str" data-val="line-through" onclick="segSingle(this);refreshCode()"><s>S</s></button>
        </div>
      </div>
      <div class="tli-ctrl-row">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">Інтервал між рядками</span>
        <select class="fsel tl-lh" style="flex: 1 1 0%;" oninput="refreshCode()">
          <option value="leading-tight">Тісний</option>
          <option value="leading-snug">Щільний</option>
          <option value="" selected>Стандартний</option>
          <option value="leading-relaxed">Вільний</option>
          <option value="leading-loose">Широкий</option>
        </select>
      </div>
      <div class="tli-ctrl-row">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">Між літерами</span>
        <select class="fsel tl-ls" style="flex: 1 1 0%;" oninput="refreshCode()">
          <option value="tracking-tighter">Найтісніший</option>
          <option value="tracking-tight">Тісний</option>
          <option value="" selected>Стандартний</option>
          <option value="tracking-wide">Широкий</option>
          <option value="tracking-widest">Найширший</option>
        </select>
      </div>
      <div class="tli-ctrl-row" style="flex-wrap:wrap;gap:4px;">
        <span style="font-size:11px;color:var(--t3);font-weight:600;width:100%;margin-bottom:2px;">Колір тексту:</span>
        <div class="tl-clr-palette" style="display:flex;flex-wrap:wrap;gap:3px;">
          ${[
            {cls:'',           hex:'transparent', label:'За замовч.',  border:true},
            {cls:'text-black',         hex:'#000000', label:'Чорний'},
            {cls:'text-neutral-900',   hex:'#171717', label:'Нейтр. 900'},
            {cls:'text-neutral-800',   hex:'#262626', label:'Нейтр. 800'},
            {cls:'text-zhuk-dark-gray',hex:'#222222', label:'Dark gray'},
            {cls:'text-gray-600',      hex:'#666666', label:'Gray 600'},
            {cls:'text-zhuk-gray',     hex:'#96979A', label:'Zhuk gray'},
            {cls:'text-gray-400',      hex:'#BDBDBD', label:'Gray 400'},
            {cls:'text-white',         hex:'#FFFFFF', label:'Білий',    border:true},
            {cls:'text-brand',         hex:'var(--brand-color,#2563eb)', label:'Brand'},
            {cls:'text-brand-dark',    hex:'var(--brand-color,#1d4ed8)', label:'Brand dark'},
            {cls:'text-red-600',       hex:'#D31A1F', label:'Red 600'},
            {cls:'text-red-700',       hex:'#E00B0B', label:'Red 700'},
            {cls:'text-zhuk-red',      hex:'#d23434', label:'Zhuk red'},
            {cls:'text-orange-500',    hex:'#FA871D', label:'Orange'},
            {cls:'text-zhuk-yellow',   hex:'#FDBB2F', label:'Yellow'},
            {cls:'text-green-500',     hex:'#5DB075', label:'Green 500'},
            {cls:'text-green-600',     hex:'#4B9460', label:'Green 600'},
          ].map(({cls, hex, label, border}) =>
            `<button type="button" class="tl-clr-btn${cls===''?' is-on':''}" data-cls="${cls}"
              title="${label}${cls ? ' ('+cls+')' : ' (default)'}"
              onclick="setTlColor(this)"
              style="width:20px;height:20px;border-radius:4px;border:${border?'1.5px solid var(--line2)':'1.5px solid transparent'};background:${hex};cursor:pointer;flex-shrink:0;transition:all .1s;box-sizing:border-box;"
              onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform=''"></button>`
          ).join('')}
        </div>
        <input type="hidden" class="tl-clr-cls" value="">
      </div>
    </div>
  </div>`;
}

function addTextLine(btnOrId, bid) {
  // Support passing the button element directly (for cloned blocks with renamed IDs)
  let list;
  if (typeof btnOrId === 'string') {
    list = document.getElementById(btnOrId);
  } else {
    // btnOrId is the button element — find the nearest .tl-list sibling
    list = btnOrId.closest('.sp-group, .block-fields')?.querySelector('.tl-list') 
        || btnOrId.previousElementSibling;
  }
  if (!list) return;
  const div = document.createElement('div');
  div.innerHTML = makeTextLine(bid);
  const node = div.firstElementChild;
  node.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input',  refreshCode);
    el.addEventListener('change', refreshCode);
  });
  list.appendChild(node);
  refreshCode();
}

/* ─── Render: HTML для експорту ──────────────── */
// Викликається з core.js → blockToHTML() для type === 'text'
function renderTextHTML(src, ind) {
  return textLinesToHTML(src.querySelector('.tl-list'), ind);
}

/* ─── Segment / toggle helpers для рядка тексту ── */
function segToggle(btn) {
  const cls = [...btn.classList].find(c => c.startsWith('tl-') && c !== 'seg-btn');
  if (!cls) return;
  const group = btn.closest('.text-line-item')?.querySelectorAll(`.${cls}`) || [];
  group.forEach(b => b.classList.remove('is-on'));
  btn.classList.add('is-on');
}
function setAlign(btn, cls) {
  const item = btn.closest('.text-line-item');
  if (!item) return;
  item.querySelectorAll('.' + cls).forEach(b => b.classList.remove('is-on'));
  btn.classList.add('is-on');
}
function setWeight(btn) {
  const item = btn.closest('.text-line-item');
  if (!item) return;
  item.querySelectorAll('.tl-w').forEach(b => b.classList.remove('is-on'));
  btn.classList.add('is-on');
}
function segSingle(btn) { btn.classList.toggle('is-on'); }

/* ─── Tag presets (Великий/Середній/Маленький) ── */
function applyTagDefaults(sel) {
  const item = sel.closest('.text-line-item');
  if (!item) return;
  const idx = sel.selectedIndex; // 0=Заголовок, 1=Нормальний (тег-селект має лише ці 2 опції)
  // Значення мають збігатися з реальними value опцій .tl-sz-mob/.tl-sz-dsk
  // (bracket-нотація text-[NNpx]) — інакше select.value стає "" (invalid value).
  const presets = [
    { szMob: 'text-[20px]', szDsk: 'text-[28px]', weight: '' }, // Заголовок
    { szMob: 'text-[16px]', szDsk: 'text-[18px]', weight: '' }, // Нормальний
  ];
  const p = presets[idx] || presets[1];
  const szMobSel = item.querySelector('.tl-sz-mob');
  const szDskSel = item.querySelector('.tl-sz-dsk');
  if (szMobSel) szMobSel.value = p.szMob;
  if (szDskSel) szDskSel.value = p.szDsk;
  item.querySelectorAll('.tl-w').forEach(b => b.classList.remove('is-on'));
  const wb = item.querySelector(`.tl-w[data-val="${p.weight}"]`);
  if (wb) wb.classList.add('is-on');
}

/* ─── Вибір кольору тексту з палітри ─────────── */
function setTlColor(btn) {
  const item = btn.closest('.text-line-item');
  if (!item) return;
  item.querySelectorAll('.tl-clr-btn').forEach(b => b.classList.remove('is-on'));
  btn.classList.add('is-on');
  const hidden = item.querySelector('.tl-clr-cls');
  if (hidden) hidden.value = btn.dataset.cls;
  refreshCode();
}
