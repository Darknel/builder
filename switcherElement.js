/* ═══════════════════════════════════════════════
   SWITCHER ELEMENT — блок "Перемикач" (🔀)
   ───────────────────────────────────────────────
   Кнопки-перемикачі, які клікають і показують відповідне
   зображення (пов'язане через spimage-блок з тим самим ID).

   - buildSwitcherFields(bid)  — панель налаштувань у sidebar:
       заголовок, стиль кнопок (список/таблетки), розмір тексту,
       товщина/колір рамки, радіус кутів, налаштування crossfade-
       анімації зображень, список варіантів (кнопок)

   - makeSwitcherItem(bid, isFirst) — HTML одного варіанту-кнопки
   - addSwitcherItem(...)      — додавання нового варіанту
   - setSwActive(...)          — позначити варіант активним за замовч.
   - swColorSync(...)          — синхронізація color-picker ↔ hex-поля
   - tToggleClick(...)         — рефреш після кліку по toggle

   - renderSwitcherHTML(...)   — генерація фінального HTML для
       експорту (викликається з core.js → blockToHTML() для
       type === 'switcher'). Сама логіка перемикання (клік по
       кнопці → зміна класів і показ потрібного зображення)
       виконується в браузері через SWITCHER_RUNTIME_JS
       (визначено у script.js) і вставляється в експортований
       HTML лише якщо в документі є хоч один switcher/swimage.

   Тут також живуть дрібні хелпери керування рядком тексту, які
   історично ділять файл з switcher (segToggle і споріднені —
   дивись textElement.js, там вони фактично й використовуються).
═══════════════════════════════════════════════ */

/* ─── Fields (панель налаштувань) ────────────── */
function buildSwitcherFields(bid) {
  return `
    <div class="sp-group">
      <div class="sp-group-title">Перемикач</div>
      <div class="form-field">
        <label class="form-label">Заголовок (необов'язково)</label>
        <input class="fi sw-title" type="text" placeholder="Напр. Колір" oninput="refreshCode()">
      </div>
      <div class="form-field">
        <label class="form-label">Стиль кнопок</label>
        <select class="fsel sw-style" oninput="refreshCode()">
          <option value="list">Список (текст, рамка при виборі)</option>
          <option value="pills">Кнопки-таблетки</option>
        </select>
      </div>
      <div class="form-field mob-only">
        <label class="form-label">📱 Розмір тексту</label>
        <select class="fsel sw-fsz-mob" oninput="refreshCode()">
          <option value="text-xs">12px</option>
          <option value="text-sm" selected>14px</option>
          <option value="text-base">16px</option>
          <option value="text-lg">18px</option>
          <option value="text-xl">20px</option>
          <option value="text-2xl">24px</option>
        </select>
      </div>
      <div class="form-field dsk-only">
        <label class="form-label">🖥 Розмір тексту</label>
        <select class="fsel sw-fsz-dsk" oninput="refreshCode()">
          <option value="text-xs">12px</option>
          <option value="text-sm" selected>14px</option>
          <option value="text-base">16px</option>
          <option value="text-lg">18px</option>
          <option value="text-xl">20px</option>
          <option value="text-2xl">24px</option>
        </select>
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-group-title">Рамка кнопок</div>
      <div class="f2">
        <div class="form-field">
          <label class="form-label">Товщина (неактивна)</label>
          <select class="fsel sw-bw-off" oninput="refreshCode()">
            <option value="border-0">0px</option>
            <option value="border" selected>1px</option>
            <option value="border-2">2px</option>
            <option value="border-[3px]">3px</option>
            <option value="border-4">4px</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">Товщина (активна)</label>
          <select class="fsel sw-bw-on" oninput="refreshCode()">
            <option value="border-0">0px</option>
            <option value="border">1px</option>
            <option value="border-2" selected>2px</option>
            <option value="border-[3px]">3px</option>
            <option value="border-4">4px</option>
          </select>
        </div>
      </div>
      <div class="f2" style="margin-top:8px;">
        <div class="form-field">
          <label class="form-label">Колір (неактивна)</label>
          <div class="color-row">
            <input type="color" class="color-swatch sw-bc-off-swatch" value="#d1d5db" oninput="swColorSync(this,'sw-bc-off-hex')">
            <input type="text" class="fi color-hex sw-bc-off-hex" value="#d1d5db" oninput="swColorSync(this,'sw-bc-off-swatch')" style="flex:1;">
          </div>
        </div>
        <div class="form-field">
          <label class="form-label">Колір (активна)</label>
          <div class="color-row">
            <input type="color" class="color-swatch sw-bc-on-swatch" value="#111827" oninput="swColorSync(this,'sw-bc-on-hex')">
            <input type="text" class="fi color-hex sw-bc-on-hex" value="#111827" oninput="swColorSync(this,'sw-bc-on-swatch')" style="flex:1;">
          </div>
        </div>
      </div>
      <div class="form-field" style="margin-top:8px;">
        <label class="form-label">Радіус кутів</label>
        <select class="fsel sw-radius" oninput="refreshCode()">
          <option value="rounded-none">Прямі</option>
          <option value="rounded" selected>Слабкі</option>
          <option value="rounded-md">Середні</option>
          <option value="rounded-lg">Великі</option>
          <option value="rounded-xl">Дуже великі</option>
          <option value="rounded-full">Круглі (для таблеток)</option>
        </select>
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-group-title">Анімація зображень</div>
      <div class="form-field">
        <label class="toggle-row" onclick="tToggleClick(this)">
          <input type="checkbox" class="toggle-input sw-fade-on" checked oninput="refreshCode()">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span class="toggle-label">Плавний crossfade між зображеннями</span>
        </label>
      </div>
      <div class="form-field" style="margin-top:8px;">
        <label class="form-label">Тривалість переходу</label>
        <select class="fsel sw-fade-dur" oninput="refreshCode()">
          <option value="150">150 мс (швидко)</option>
          <option value="300">300 мс</option>
          <option value="500" selected>500 мс (рекомендовано)</option>
          <option value="800">800 мс (повільно)</option>
          <option value="1200">1200 мс (дуже повільно)</option>
        </select>
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-group-title">Варіанти</div>
      <div class="sw-list">${makeSwitcherItem(bid, true)}</div>
      <button class="add-item-btn" onclick="addSwitcherItem(this, ${bid})">+ Додати варіант</button>
    </div>`;
}

/* ─── Синхронізація color-picker ↔ hex-поле ──── */
function swColorSync(el, otherCls) {
  const item = el.closest('.sp-group') || el.closest('.block-fields') || document.getElementById('sp-body');
  const other = item?.querySelector(`.${otherCls}`);
  if (other) other.value = el.value;
  refreshCode();
}

function tToggleClick(label) {
  setTimeout(refreshCode, 0);
}

/* ─── Один варіант-кнопка ─────────────────────── */
function makeSwitcherItem(bid, isFirst) {
  return `<div class="text-line-item sw-item">
    <div class="tli-row flex-end">
      <button class="ib danger bg-red-800 hover:bg-red-300 text-white" style="flex:1;flex-shrink:0;font-size:12px;font-weight:700;" onclick="this.closest('.sw-item').remove();refreshCode()">✕ Видалити варіант</button>
    </div>
    <div class="form-field">
      <label class="form-label">Текст кнопки</label>
      <input class="fi sw-label" type="text" placeholder="Напр. Синій" oninput="refreshCode()">
    </div>
    <div class="form-field" style="margin-top:8px;">
      <label class="form-label">ID зображення-цілі</label>
      <input class="fi sw-target" type="text" placeholder="Напр. img-blue" oninput="refreshCode()">
      <div style="font-size:11px;color:var(--t4);margin-top:4px;line-height:1.5;">Впишіть той самий ID, що й у полі «ID для перемикача» в блоці зображення</div>
    </div>
    <div class="form-field" style="margin-top:8px;">
      <label class="toggle-row" onclick="setSwActive(this)">
        <input type="checkbox" class="toggle-input sw-active"${isFirst ? ' checked' : ''}>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
        <span class="toggle-label">Активний за замовчуванням</span>
      </label>
    </div>
  </div>`;
}

function addSwitcherItem(btnOrId, bid) {
  let list;
  if (typeof btnOrId === 'string') {
    list = document.getElementById(btnOrId);
  } else {
    list = btnOrId.closest('.sp-group, .block-fields')?.querySelector('.sw-list')
        || btnOrId.previousElementSibling;
  }
  if (!list) return;
  const div = document.createElement('div');
  div.innerHTML = makeSwitcherItem(bid, false);
  const node = div.firstElementChild;
  node.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input',  refreshCode);
    el.addEventListener('change', refreshCode);
  });
  list.appendChild(node);
  refreshCode();
}

function setSwActive(label) {
  const list = label.closest('.sw-list');
  if (list) list.querySelectorAll('.sw-active').forEach(cb => { cb.checked = false; });
  setTimeout(() => { const cb = label.querySelector('.sw-active'); if (cb) cb.checked = true; refreshCode(); }, 0);
}

/* ─── Render: HTML для експорту ──────────────── */
// Викликається з core.js → blockToHTML() для type === 'switcher'
function renderSwitcherHTML(src, bid, ind) {
  let inner = '';

  const title = src.querySelector('.sw-title')?.value?.trim() || '';
  const style = src.querySelector('.sw-style')?.value || 'list';

  const bwOff   = src.querySelector('.sw-bw-off')?.value || 'border';
  const bwOn    = src.querySelector('.sw-bw-on')?.value  || 'border-2';
  const bcOff   = src.querySelector('.sw-bc-off-hex')?.value?.trim() || '#d1d5db';
  const bcOn    = src.querySelector('.sw-bc-on-hex')?.value?.trim()  || '#111827';
  const radius  = src.querySelector('.sw-radius')?.value || 'rounded';
  const fadeOn  = src.querySelector('.sw-fade-on')?.checked !== false;
  const fadeDur = src.querySelector('.sw-fade-dur')?.value || '500';
  const fszMob  = src.querySelector('.sw-fsz-mob')?.value || 'text-sm';
  const fszDsk  = src.querySelector('.sw-fsz-dsk')?.value || 'text-sm';
  const fszCls  = fszMob === fszDsk ? fszMob : `${fszMob} md:${fszDsk}`;

  const listEl = src.querySelector('.sw-list');
  const itemEls = listEl ? [...listEl.querySelectorAll('.sw-item')] : [];

  if (title) inner += `${ind}<div class="font-semibold mb-2">${esc(title)}</div>\n`;

  if (itemEls.length) {
    const btnBase = style === 'pills'
      ? `px-4 py-2 ${radius} ${fszCls} cursor-pointer transition-colors`
      : `block w-full text-left px-3 py-2 ${radius} ${fszCls} cursor-pointer transition-colors`;
    const onExtra  = style === 'pills' ? 'bg-blue-600 text-white' : 'font-semibold';
    const offExtra = style === 'pills' ? 'bg-white text-gray-800' : 'text-gray-700';

    const onCls  = `${bwOn} ${onExtra}`;
    const offCls = `${bwOff} ${offExtra}`;
    const fadeAttrs = ` data-sw-fade="${fadeOn ? '1' : '0'}" data-sw-fade-ms="${esc(fadeDur)}"`;

    inner += `${ind}<div class="sw-group flex flex-col gap-2" data-sw-on-cls="${onCls}" data-sw-off-cls="${offCls}"${fadeAttrs}>\n`;
    itemEls.forEach(it => {
      const label  = it.querySelector('.sw-label')?.value?.trim()  || '';
      const target = it.querySelector('.sw-target')?.value?.trim() || '';
      const active = it.querySelector('.sw-active')?.checked || false;
      if (!label) return;
      const clsNow  = `${btnBase} ${active ? onCls : offCls}`;
      const borderColor = active ? bcOn : bcOff;
      inner += `${ind}  <button type="button" class="sw-btn ${clsNow}" style="border-color:${esc(borderColor)}" data-sw-target="${esc(target)}" data-sw-bc-on="${esc(bcOn)}" data-sw-bc-off="${esc(bcOff)}">${esc(label)}</button>\n`;
    });
    inner += `${ind}</div>\n`;
  }

  return inner;
}
