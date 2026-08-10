/* ═══════════════════════════════════════════════
   SWIMAGE ELEMENT — блок "Зображення (перемикача)" (🖇️)
   ───────────────────────────────────────────────
   Зображення, пов'язане з блоком "Перемикач" (switcherElement.js)
   через спільний ID. Кілька swimage-блоків підряд в одній колонці
   автоматично групуються в один crossfade-стек — цю логіку
   виконує renderSwimageStack() в core.js, а не тут.

   - buildSwImageFields(bid) — панель налаштувань у sidebar:
       ID для перемикача, URL (або завантаження файлу) базового
       зображення, alt, ширина, вирівнювання, кути, тінь, object-fit

   - renderSwimageHTML(...)  — генерація фінального HTML для
       одного <img> (викликається з core.js → blockToHTML()
       для type === 'swimage', а також з renderSwimageStack()
       коли кілька swimage йдуть підряд)

   URL зображення проходить через safeUrl() (core.js) — приймаються
   лише http(s) та (для завантажених файлів) data:image/*.

   Усі поля без inline onclick/oninput — керування через delegate.js.
═══════════════════════════════════════════════ */

/* ─── Fields (панель налаштувань) ────────────── */
function buildSwImageFields(bid) {
  return `
    <div class="sp-group">
      <div class="sp-group-title">Зображення (перемикач)</div>
      <div class="form-field">
        <label class="form-label">ID для перемикача</label>
        <input class="fi sw-id" type="text" placeholder="Напр. img-blue">
        <div style="font-size:11px;color:var(--t4);margin-top:4px;line-height:1.5;">Той самий ID впишіть у «ID зображення-цілі» відповідної кнопки перемикача</div>
      </div>
      <div class="form-field" style="margin-top:8px;">
        <label class="form-label">URL зображення (базове, поки нічого не вибрано)</label>
        <input class="fi img-url" type="url" placeholder="https://…/photo.jpg">
      </div>
      <div class="form-field">
        <label class="img-dropzone">
          📁 Перетягніть файл сюди або натисніть, щоб обрати
          <input type="file" accept="image/*" data-action="img-file-change">
        </label>
      </div>
      <div class="form-field">
        <label class="form-label">Alt-текст (SEO)</label>
        <input class="fi img-alt" placeholder="Опис зображення">
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-group-title">Вигляд</div>
      <div class="f2">
        <div class="form-field mob-only">
          <label class="form-label">📱 Ширина</label>
          <select class="fsel img-w-mob">
            <option value="max-w-full h-auto w-full">На всю ширину</option>
            <option value="">Оригінальний розмір (1:1)</option>
            <option value="max-w-full h-auto w-auto">Авто</option>
            <option value="max-w-full h-auto w-1/2">50%</option>
            <option value="max-w-full h-auto w-2/3">67%</option>
            <option value="max-w-full h-auto w-1/3">33%</option>
          </select>
        </div>
        <div class="form-field dsk-only">
          <label class="form-label">🖥 Ширина</label>
          <select class="fsel img-w-dsk">
            <option value="md:max-w-full md:h-auto md:w-full">На всю ширину</option>
            <option value="md:max-w-none md:h-auto md:w-auto">Оригінальний розмір (1:1)</option>
            <option value="md:max-w-full md:h-auto md:w-auto">Авто</option>
            <option value="md:max-w-full md:h-auto md:w-1/2">50%</option>
            <option value="md:max-w-full md:h-auto md:w-2/3">67%</option>
            <option value="md:max-w-full md:h-auto md:w-1/3">33%</option>
          </select>
        </div>
        <div class="form-field mob-only">
          <label class="form-label">📱 Вирівнювання</label>
          <select class="fsel img-align-mob">
            <option value="mr-auto">Ліво</option>
            <option value="mx-auto">По центру</option>
            <option value="ml-auto">Право</option>
          </select>
        </div>
        <div class="form-field dsk-only">
          <label class="form-label">🖥 Вирівнювання</label>
          <select class="fsel img-align-dsk">
            <option value="md:mr-auto md:ml-0">Ліво</option>
            <option value="md:mx-auto">По центру</option>
            <option value="md:ml-auto md:mr-0">Право</option>
          </select>
        </div>

      </div>
      <div class="f2">
        <div class="form-field">
          <label class="form-label">Кути</label>
          <select class="fsel img-radius">
            <option value="">Прямі</option>
            <option value="rounded">Слабкі</option>
            <option value="rounded-lg">Середні</option>
            <option value="rounded-xl">Великі</option>
            <option value="rounded-2xl">Дуже великі</option>
            <option value="rounded-full">Круглі</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">Тінь</label>
          <select class="fsel img-shadow">
            <option value="">Без</option>
            <option value="shadow-sm">Легка</option>
            <option value="shadow">Нормальна</option>
            <option value="shadow-md">Середня</option>
            <option value="shadow-xl">Сильна</option>
            <option value="shadow-2xl">Максимальна</option>
          </select>
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Підгонка (object-fit)</label>
        <select class="fsel img-fit">
          <option value="object-cover">cover — заповнити</option>
          <option value="object-contain">contain — вмістити</option>
          <option value="object-top">top — зверху</option>
          <option value="object-bottom">bottom — знизу</option>
        </select>
      </div>
    </div>`;
}

/* ─── Render: HTML для експорту ──────────────── */
// Викликається з core.js → blockToHTML() для type === 'swimage'
function renderSwimageHTML(src, ind) {
  let inner = '';

  const swId    = src.querySelector('.sw-id')?.value?.trim()    || '';
  const url     = safeUrl(src.querySelector('.img-url')?.value, { allowDataImage: true });
  const alt     = src.querySelector('.img-alt')?.value?.trim()  || '';
  const wMob    = src.querySelector('.img-w-mob')?.value        ?? 'max-w-full h-auto w-full';
  const wDsk    = src.querySelector('.img-w-dsk')?.value        ?? 'md:max-w-full md:h-auto md:w-full';
  const w       = [wMob, wDsk].filter(Boolean).join(' ');
  const alignMob = src.querySelector('.img-align-mob')?.value   || '';
  const alignDsk = src.querySelector('.img-align-dsk')?.value   || '';
  const align   = [alignMob, alignDsk].filter(Boolean).join(' ');
  const radius  = src.querySelector('.img-radius')?.value       || '';
  const shadow  = src.querySelector('.img-shadow')?.value       || '';
  const fit     = src.querySelector('.img-fit')?.value          || 'object-cover';

  if (url) {
    // Клас ширини (w) вже містить потрібні max-w-full/h-auto (або їх
    // відсутність для "оригінального розміру") окремо для mob/dsk.
    // Примітка: якщо цей swimage потрапить у crossfade-стек (renderSwimageStack
    // у core.js), розміри однаково буде уніфіковано під w-full h-full — це
    // навмисно, щоб перемикання не «стрибало» по розміру.
    const imgCls = ['block', w, align, radius, shadow, fit].filter(Boolean).join(' ');
    const idAttr = swId ? ` id="${esc(swId)}" data-sw-image="${esc(swId)}"` : '';
    inner += `${ind}<img src="${esc(url)}" alt="${esc(alt)}" class="${imgCls}"${idAttr}${styleAttr(IMG_BASE_STYLE)}>\n`;
  }

  return inner;
}
