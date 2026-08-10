/* ═══════════════════════════════════════════════
   CORE.JS — спільний "рушій" Builder'а
   ───────────────────────────────────────────────
   Цей файл НЕ знає нічого специфічного про text/image/
   video/switcher/swimage — він лише:

   1) надає спільні хелпери, які використовують усі елементи:
      - esc()               — екранування HTML-спецсимволів
      - blockSrc()           — де фізично шукати значення полів блоку
                               (в самому блоці чи в відкритій панелі sp-body)
      - textLinesToHTML()    — рендер списку текстових рядків
                               (використовується text, а також підписами
                               під image/video і текстом поверх image)

   2) обходить колонку/групує послідовні swimage-блоки в один
      crossfade-стек:
      - renderColBlocks()
      - renderSwimageStack()

   3) є ГОЛОВНИМ ДИСПЕТЧЕРОМ генерації HTML одного блоку:
      - blockToHTML() — рахує спільну "рамку" (відступи блоку),
        а сам вміст делегує функціям render*HTML(), кожна з яких
        визначена у файлі свого елемента:
          renderTextHTML     → textElement.js
          renderImageHTML    → imageElement.js
          renderVideoHTML    → videoElement.js
          renderSwitcherHTML → switcherElement.js
          renderSwimageHTML  → swimageElement.js

   4) є диспетчером побудови полів налаштувань у панелі:
      - buildFields(type, bid) → викликає build*Fields() з файлу
        відповідного елемента
      - buildPadBar(bid) — панель відступів блоку (спільна для всіх)

   5) містить дрібні UI-хелпери, не прив'язані до конкретного типу:
      - tToggle(), spToggle()

   Підключати ПІСЛЯ script.js, і ПЕРЕД файлами елементів
   (textElement.js, imageElement.js, videoElement.js,
   switcherElement.js, swimageElement.js) не обов'язково —
   порядок не критичний завдяки hoisting оголошень function,
   але для читабельності тримаємо саме такий порядок.
═══════════════════════════════════════════════ */

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ─── Helper: debounce ───────────────────────── */
// Затримує виклик fn, поки викликається повторно — виконується лише
// після того, як минуло `wait` мс без нових викликів.
function debounce(fn, wait) {
  let t;
  return function debounced(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/* ─── Helper: safe URL ───────────────────────────
   Пропускає лише http(s) та (опційно, для завантажених файлів)
   data:image/* — усе інше (javascript:, vbscript:, невідомі
   схеми) відкидається, щоб URL-поля (зображення/відео/фон) не
   могли перетворитися на вектор виконання коду в експортованому
   HTML чи в preview iframe. */
function isSafeUrl(url, opts) {
  const allowDataImage = !!(opts && opts.allowDataImage);
  const s = (url || '').trim();
  if (!s) return true; // порожнє значення — просто нічого не рендеримо, не помилка
  if (allowDataImage && /^data:image\/[a-z0-9.+-]+;base64,/i.test(s)) return true;
  return /^https?:\/\//i.test(s);
}
function safeUrl(url, opts) {
  const s = (url || '').trim();
  return isSafeUrl(s, opts) ? s : '';
}

/* ─── Image upload: файл/drag&drop → data URL ──
   Спільна логіка для полів "Зображення"/"Зображення (перемикача)"
   і для фонового зображення рядка — різниця лише в тому, куди
   записати результат (окремі виклики нижче). */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB — обмеження, бо файл лягає в HTML як base64
function loadImageFileAsDataUrl(file, onDone) {
  if (!file) return;
  if (!file.type || !file.type.startsWith('image/')) { showToast('Оберіть файл зображення', 'error'); return; }
  if (file.size > MAX_UPLOAD_BYTES) { showToast('Файл завеликий (макс. 5MB)', 'error'); return; }
  const reader = new FileReader();
  reader.onload = () => onDone(reader.result);
  reader.onerror = () => showToast('Не вдалося прочитати файл', 'error');
  reader.readAsDataURL(file);
}

// Для полів "URL зображення" всередині панелі блоку (.img-url)
function handleImageBlockFile(dropzoneEl, file) {
  const urlInput = dropzoneEl.closest('.sp-group, .block-fields')?.querySelector('.img-url');
  if (!urlInput) return;
  loadImageFileAsDataUrl(file, dataUrl => {
    urlInput.value = dataUrl;
    refreshCode();
    showToast('✓ Зображення завантажено');
  });
}

// Для фонового зображення рядка (#row-bg-img, керується через dataset рядка)
function handleRowBgFile(file) {
  loadImageFileAsDataUrl(file, dataUrl => {
    const input = document.getElementById('row-bg-img');
    if (input) input.value = dataUrl;
    setRowBgImage(dataUrl);
    showToast('✓ Зображення завантажено');
  });
}

/* ─── Helper: get block fields source ────────── */
// Коли панель налаштувань блоку відкрита, його .block-padbar
// і .block-fields фізично переміщені в DOM панелі (#sp-body).
// Тому значення полів треба читати звідти, а не з самого блоку.
function blockSrc(block) {
  return (window._activeBlock === block)
    ? document.getElementById('sp-body')
    : block;
}

/* ─── Text lines to HTML ─────────────────────── */
// Спільна функція: перетворює список .text-line-item
// (текстові рядки блоку "Текст", підписи під фото/відео,
// текст поверх зображення) у готовий HTML.
function textLinesToHTML(listEl, indent) {
  if (!listEl) return '';
  let out = '';
  listEl.querySelectorAll('.text-line-item').forEach(line => {
    const text = line.querySelector('.tl-input')?.value?.trim() || '';
    if (!text) return;
    const tag    = line.querySelector('.tl-tag')?.value    || 'p';
    // Тег-селект має лише 2 опції (0=Заголовок, 1=Нормальний), тому
    // фолбек-значення відповідають лише цим двом випадкам і використовують
    // ту саму bracket-нотацію (text-[NNpx]), що й реальні опції select'у.
    const tagIdx = line.querySelector('.tl-tag')?.selectedIndex ?? 1;
    const _defMob = tagIdx === 0 ? 'text-[20px]' : 'text-[16px]';
    const _defDsk = tagIdx === 0 ? 'text-[28px]' : 'text-[18px]';
    const szMob  = line.querySelector('.tl-sz-mob')?.value || _defMob;
    const szDsk  = line.querySelector('.tl-sz-dsk')?.value || _defDsk;
    const sizeCls= szMob === szDsk ? szMob : `${szMob} md:${szDsk}`;
    const fontMob = line.querySelector('.tl-font.mob-font')?.value || 'font-sans';
    const fontDsk = line.querySelector('.tl-font.dsk-font')?.value || 'font-sans';
    const font    = fontMob === fontDsk ? fontMob : `${fontMob} md:${fontDsk}`;
    const weight = line.querySelector('.tl-w.is-on')?.dataset.val   || '';
    const alignMob = line.querySelector('.tl-align-mob.is-on')?.dataset.val || 'text-left';
    const alignDsk = line.querySelector('.tl-align-dsk.is-on')?.dataset.val || 'text-left';
    const alignCls = alignMob === alignDsk
      ? alignMob
      : `${alignMob} md:${alignDsk}`;
    const italic = line.querySelector('.tl-it.is-on')  ? 'italic'       : '';
    const underl = line.querySelector('.tl-un.is-on')  ? 'underline'    : '';
    const strike = line.querySelector('.tl-str.is-on') ? 'line-through' : '';
    const lh     = line.querySelector('.tl-lh')?.value     || '';
    const ls     = line.querySelector('.tl-ls')?.value     || '';
    const mb     = line.querySelector('.tl-mb')?.value     || '';
    const clrCls = line.querySelector('.tl-clr-cls')?.value?.trim() || '';

    const cls = ['w-full', 'break-words', sizeCls, font, weight, alignCls, italic, underl, strike, lh, ls, mb, clrCls].filter(Boolean).join(' ');
    out += `${indent}<${tag} class="${cls}">${esc(text)}</${tag}>\n`;
  });
  return out;
}

/* ─── Render all blocks of a column, grouping consecutive    ── */
/* ─── swimage blocks into a single crossfade stack wrapper   ── */
function renderColBlocks(col) {
  const blocks = [...col.querySelectorAll('.block')];
  let out = '';
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (block.dataset.type === 'swimage') {
      // collect consecutive swimage blocks
      const group = [];
      let j = i;
      while (j < blocks.length && blocks[j].dataset.type === 'swimage') {
        group.push(blocks[j]);
        j++;
      }
      if (group.length > 1) {
        // Render as crossfade stack
        out += renderSwimageStack(group);
      } else {
        out += blockToHTML(block);
      }
      i = j;
    } else {
      out += blockToHTML(block);
      i++;
    }
  }
  return out;
}

function renderSwimageStack(group) {
  let out = '  <div class="sw-stack relative w-full overflow-hidden" style="min-height:1px">\n';
  group.forEach((block, idx) => {
    const html = blockToHTML(block);
    if (!html.trim()) return;

    // Read the user's chosen object-fit / radius / shadow from the block's fields
    // so visual style settings still apply, but size/position classes are unified.
    const src    = blockSrc(block);
    const radius = src.querySelector('.img-radius')?.value || '';
    const shadow = src.querySelector('.img-shadow')?.value || '';
    const fit    = src.querySelector('.img-fit')?.value    || 'object-cover';

    // All stack images share identical sizing/position so swapping never changes layout.
    const baseCls = ['sw-stack-img', 'absolute', 'inset-0', 'w-full', 'h-full', fit, 'transition-opacity', radius, shadow]
      .filter(Boolean).join(' ');
    const visCls = idx === 0 ? '' : ' opacity-0';

    const patched = html
      // Strip the original size-related classes (w-full/h-auto/block/object-*/mx-auto/ml-auto/rounded-*/shadow-*)
      // and replace the whole class attribute with the unified stack classes.
      .replace(/(<img\b[^>]*?)\bclass="[^"]*"/, `$1class="${baseCls}${visCls}"`)
      .replace(/(<img\b[^>]*?)>/, `$1 style="transition-duration:500ms">`);
    out += patched;
  });
  out += '  </div>\n';
  return out;
}

/* ─── Block to HTML: спільна "рамка" (відступи блоку) +      ── */
/* ─── диспетчер до render*HTML() конкретного типу елемента   ── */
function blockToHTML(block) {
  const type = block.dataset.type;
  const bid  = block.dataset.bid;
  const src  = blockSrc(block); // may be sp-body if active

  const pxCls = src.querySelector('.cb-px')?.value || '';
  const pyCls = src.querySelector('.cb-py')?.value || '';
  const wrap  = [pxCls, pyCls].filter(Boolean).join(' ');
  const ind   = wrap ? '    ' : '  ';
  let inner   = '';

  // Кожна render*HTML() функція визначена у файлі свого елемента:
  if (type === 'text')          inner = renderTextHTML(src, ind);          // textElement.js
  else if (type === 'image')    inner = renderImageHTML(src, bid, ind);    // imageElement.js
  else if (type === 'video')    inner = renderVideoHTML(src, bid, ind);    // videoElement.js
  else if (type === 'switcher') inner = renderSwitcherHTML(src, bid, ind); // switcherElement.js
  else if (type === 'swimage')  inner = renderSwimageHTML(src, ind);       // swimageElement.js

  if (!inner.trim()) return '';
  if (wrap) return `  <div class="${wrap}">\n${inner}  </div>\n`;
  return inner;
}

/* ─── Build pad bar (спільна панель відступів блоку) ─────────
   Ці елементи однакові для будь-якого типу блоку, тому живуть
   у core.js, а не в конкретному файлі елемента.                */
function buildPadBar(bid) {
  return `
    <div class="sp-group">
      <div class="sp-group-title">Відступи блоку</div>
      <div class="f2">
        <div class="form-field">
          <label class="form-label">↔ По горизонталі</label>
          <select class="fsel cb-px">
            <option value="" selected>Без</option>
            <option value="px-1">4px</option>
            <option value="px-2">8px</option>
            <option value="px-3">12px</option>
            <option value="px-4">16px</option>
            <option value="px-6">24px</option>
            <option value="px-8">32px</option>
            <option value="px-10">40px</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">↕ По вертикалі</label>
          <select class="fsel cb-py">
            <option value="" selected>Без</option>
            <option value="py-1">4px</option>
            <option value="py-2">8px</option>
            <option value="py-3">12px</option>
            <option value="py-4">16px</option>
            <option value="py-6">24px</option>
            <option value="py-8">32px</option>
            <option value="py-10">40px</option>
          </select>
        </div>
      </div>
    </div>`;
}

/* ─── Build fields: диспетчер до build*Fields() конкретного типу ── */
function buildFields(type, bid) {
  if (type === 'text')     return buildTextFields(bid);     // textElement.js
  if (type === 'image')    return buildImageFields(bid);    // imageElement.js
  if (type === 'video')    return buildVideoFields(bid);    // videoElement.js
  if (type === 'switcher') return buildSwitcherFields(bid); // switcherElement.js
  if (type === 'swimage')  return buildSwImageFields(bid);  // swimageElement.js
  return '';
}

/* ─── Спільні UI-хелпери (не специфічні для типу елемента) ──── */
// Приймає або id (застаріле використання), або сам елемент .toggle-row —
// у другому випадку чекбокс шукається всередині нього, без залежності від id.
function tToggle(idOrLabel) {
  const el = typeof idOrLabel === 'string'
    ? document.getElementById(idOrLabel)
    : idOrLabel.querySelector('.toggle-input');
  if (el) { el.checked = !el.checked; refreshCode(); }
}

// Раніше приймала id секції — але після dupRow() id-атрибути в клоні
// отримують додатковий суфікс "-cN", тоді як onclick-рядок оновлюється
// лише за номером bid, тому id розходились і секцію не можна було
// розгорнути в дубльованому блоці. Тепер шукаємо секцію відносно самої
// кнопки через DOM-структуру (наступний елемент після .sp-section-head) —
// це не залежить від жодних id.
function spToggle(triggerBtn) {
  const head = triggerBtn.closest('.sp-section-head');
  const el = head ? head.nextElementSibling : null;
  if (!el) return;
  el.classList.toggle('hidden');
  triggerBtn.textContent = el.classList.contains('hidden') ? 'Показати' : 'Сховати';
}
