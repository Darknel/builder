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

   Усі поля тут НЕ мають inline onclick/oninput/onchange — керування
   відбувається через делеговані обробники в delegate.js за
   атрибутом data-action (щоб можна було увімкнути сувору CSP
   без 'unsafe-inline'). Прості поля (текст/select без побічних
   ефектів) взагалі не позначені — delegate.js рефрешить код для
   будь-якого .fi/.fsel/textarea всередині #sp-body автоматично.
═══════════════════════════════════════════════ */

/* ─── Fields (панель налаштувань) ────────────── */
function buildTextFields(bid) {
  return `
    <div class="sp-group">
      <div class="sp-group-title">Рядки тексту</div>
      <div class="tl-list" id="tl-${bid}">${makeTextLine(bid)}</div>
      <button class="add-item-btn" data-action="add-text-line" data-bid="${bid}">+ Додати рядок</button>
    </div>`;
}

/* ─── Full text line ─────────────────────────── */
function makeTextLine(bid) {
  return `<div class="text-line-item">
    <div class="tli-row flex-end">
      <button class="ib danger bg-red-800 hover:bg-red-300 text-white" style="flex:1;flex-shrink:0;font-size:12px;font-weight:700;" data-action="tl-remove">✕ Видалити</button>
    </div>
    <div class="tli-row">
      <textarea class="fi tl-input" style="flex:1;min-height:60px;resize:vertical;white-space:pre-wrap;word-break:break-word;" placeholder="Текст рядка…"></textarea>
    </div>
    <div class="tli-controls">
      <div class="tli-ctrl-row">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">Тег</span>
        <select class="fsel tl-tag" style="flex: 1 1 0%;flex-shrink:0;" data-action="tl-tag">
          <option value="h3">Заголовок</option>
          <option value="p" selected>Нормальний</option>
        </select>
      </div>
      <div class="tli-ctrl-row mob-only">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">📱 Розмір</span>
        <select class="fsel tl-sz-mob" style="flex: 1 1 0%;">
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
        <select class="fsel tl-sz-dsk" style="flex: 1 1 0%;">
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
        <select class="fsel tl-font mob-font" style="flex: 1 1 0%;">
          <option value="font-sans" selected>Sans</option>
          <option value="font-serif">Serif</option>
          <option value="font-mono">Mono</option>
        </select>
      </div>
      <div class="tli-ctrl-row dsk-only">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">Шрифт</span>
        <select class="fsel tl-font dsk-font" style="flex: 1 1 0%;">
          <option value="font-sans" selected>Sans</option>
          <option value="font-serif">Serif</option>
          <option value="font-mono">Mono</option>
        </select>
      </div>
      <div class="tli-ctrl-row mob-only">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">Вирівнювання</span>
        <div class="btn-row">
          <button class="seg-btn tl-align-mob is-on"  data-val="text-left"    data-action="tl-align" data-group="tl-align-mob">←</button>
          <button class="seg-btn tl-align-mob"        data-val="text-center"  data-action="tl-align" data-group="tl-align-mob">≡</button>
          <button class="seg-btn tl-align-mob"        data-val="text-right"   data-action="tl-align" data-group="tl-align-mob">→</button>
          <button class="seg-btn tl-align-mob"        data-val="text-justify" data-action="tl-align" data-group="tl-align-mob">⇔</button>
        </div>
      </div>
      <div class="tli-ctrl-row dsk-only">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">Вирівнювання</span>
        <div class="btn-row">
          <button class="seg-btn tl-align-dsk is-on"  data-val="text-left"    data-action="tl-align" data-group="tl-align-dsk">←</button>
          <button class="seg-btn tl-align-dsk"        data-val="text-center"  data-action="tl-align" data-group="tl-align-dsk">≡</button>
          <button class="seg-btn tl-align-dsk"        data-val="text-right"   data-action="tl-align" data-group="tl-align-dsk">→</button>
          <button class="seg-btn tl-align-dsk"        data-val="text-justify" data-action="tl-align" data-group="tl-align-dsk">⇔</button>
        </div>
      </div>
      <div class="tli-ctrl-row justify-between">
        <div class="btn-row">
          <button class="seg-btn tl-w is-on"  data-val=""               data-action="tl-weight">N</button>
          <button class="seg-btn tl-w"        data-val="font-medium"    data-action="tl-weight">M</button>
          <button class="seg-btn tl-w"        data-val="font-semibold"  data-action="tl-weight">SB</button>
          <button class="seg-btn tl-w"        data-val="font-bold"      data-action="tl-weight">B</button>
        </div>
        <div class="btn-row">
          <button class="seg-btn tl-it"  data-val="italic"       data-action="tl-style"><em>I</em></button>
          <button class="seg-btn tl-un"  data-val="underline"    data-action="tl-style"><u>U</u></button>
          <button class="seg-btn tl-str" data-val="line-through" data-action="tl-style"><s>S</s></button>
        </div>
      </div>
      <div class="tli-ctrl-row">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">Інтервал між рядками</span>
        <select class="fsel tl-lh" style="flex: 1 1 0%;">
          <option value="leading-tight">Тісний</option>
          <option value="leading-snug">Щільний</option>
          <option value="" selected>Стандартний</option>
          <option value="leading-relaxed">Вільний</option>
          <option value="leading-loose">Широкий</option>
        </select>
      </div>
      <div class="tli-ctrl-row">
        <span style="flex: 1 1 0%;font-size:12px;color:var(--t4);font-weight:700;">Між літерами</span>
        <select class="fsel tl-ls" style="flex: 1 1 0%;">
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
          ${TEXT_COLOR_PALETTE.map(({cls, hex, label, border}) =>
            `<button type="button" class="tl-clr-btn${cls===''?' is-on':''}" data-cls="${cls}"
              title="${label}${cls ? ' ('+cls+')' : ' (default)'}"
              data-action="tl-color"
              style="width:20px;height:20px;border-radius:4px;border:${border?'1.5px solid var(--line2)':'1.5px solid transparent'};background:${hex};cursor:pointer;flex-shrink:0;box-sizing:border-box;"></button>`
          ).join('')}
        </div>
        <input type="hidden" class="tl-clr-cls" value="">
      </div>
    </div>
  </div>`;
}

function addTextLine(btn, bid) {
  // Знаходимо найближчий .tl-list всередині тієї ж групи полів
  const list = btn.closest('.sp-group, .block-fields')?.querySelector('.tl-list')
      || btn.previousElementSibling;
  if (!list) return;
  const div = document.createElement('div');
  div.innerHTML = makeTextLine(bid);
  const node = div.firstElementChild;
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
