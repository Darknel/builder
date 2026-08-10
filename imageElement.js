/* ═══════════════════════════════════════════════
   IMAGE ELEMENT — блок "Зображення" (🖼️)
   ───────────────────────────────────────────────
   Все, що стосується блоку зображення, зібрано тут:

   - buildImageFields(bid) — панель налаштувань у sidebar:
       URL, alt, ширина, вирівнювання, кути, тінь, object-fit,
       підпис під зображенням, текст поверх зображення (overlay)

   - renderImageHTML(...)  — генерація фінального HTML для експорту
       (викликається з core.js → blockToHTML() для type === 'image').
       Формує один із двох варіантів:
         а) звичайне <img> (+ опційно підпис знизу)
         б) <img> з накладеним текстовим шаром поверх (overlay),
            якщо в секції "Текст поверх зображення" є хоч один рядок

   Підпис/оверлей-текст рендериться через textLinesToHTML()
   з core.js — та сама функція, що й для блоку "Текст".
═══════════════════════════════════════════════ */

/* ─── Fields (панель налаштувань) ────────────── */
function buildImageFields(bid) {
  return `
    <div class="sp-group">
      <div class="sp-group-title">Зображення</div>
      <div class="form-field">
        <label class="form-label">URL зображення</label>
        <input class="fi img-url" type="url" placeholder="https://…/photo.jpg" oninput="refreshCode()">
      </div>
      <div class="form-field">
        <label class="form-label">Alt-текст (SEO)</label>
        <input class="fi img-alt" placeholder="Опис зображення" oninput="refreshCode()">
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-group-title">Вигляд</div>
      <div class="f2">
        <div class="form-field mob-only">
          <label class="form-label">📱 Ширина</label>
          <select class="fsel img-w-mob" oninput="refreshCode()">
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
          <select class="fsel img-w-dsk" oninput="refreshCode()">
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
          <select class="fsel img-align-mob" oninput="refreshCode()">
            <option value="mr-auto">Ліво</option>
            <option value="mx-auto">По центру</option>
            <option value="ml-auto">Право</option>
          </select>
        </div>
        <div class="form-field dsk-only">
          <label class="form-label">🖥 Вирівнювання</label>
          <select class="fsel img-align-dsk" oninput="refreshCode()">
            <option value="md:mr-auto md:ml-0">Ліво</option>
            <option value="md:mx-auto">По центру</option>
            <option value="md:ml-auto md:mr-0">Право</option>
          </select>
        </div>

      </div>
      <div class="f2">
        <div class="form-field">
          <label class="form-label">Кути</label>
          <select class="fsel img-radius" oninput="refreshCode()">
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
          <select class="fsel img-shadow" oninput="refreshCode()">
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
        <select class="fsel img-fit" oninput="refreshCode()">
          <option value="object-cover">cover — заповнити</option>
          <option value="object-contain">contain — вмістити</option>
          <option value="object-top">top — зверху</option>
          <option value="object-bottom">bottom — знизу</option>
        </select>
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-section-head">
        <span class="sp-section-name">📎 Підпис під зображенням</span>
        <button class="sp-toggle-btn" onclick="spToggle(this)">Показати</button>
      </div>
      <div class="hidden">
        <div class="tl-list img-cap-list"></div>
        <button class="add-item-btn" onclick="addTextLine(this, ${bid})">+ Додати підпис</button>
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-section-head">
        <span class="sp-section-name">✍️ Текст поверх зображення</span>
        <button class="sp-toggle-btn" onclick="spToggle(this)">Показати</button>
      </div>
      <div class="hidden">
        <div class="f2" style="margin-bottom:8px;">
          <div class="form-field">
            <label class="form-label">Висота блоку</label>
            <select class="fsel img-ov-h" oninput="refreshCode()">
              <option value="h-auto" selected>Оригінальний розмір (за фото)</option>
              <option value="h-24">Мала (96px)</option>
              <option value="h-40">Середня (160px)</option>
              <option value="h-56">Велика (224px)</option>
              <option value="h-72">Дуже велика (288px)</option>
              <option value="h-96">Максимальна (384px)</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label">Позиція тексту</label>
            <select class="fsel img-ov-pos" oninput="refreshCode()">
              <option value="items-start justify-start">Зверху</option>
              <option value="items-center justify-center" selected>По центру</option>
              <option value="items-end justify-end">Знизу</option>
            </select>
          </div>
        </div>
        <div class="form-field" style="margin-bottom:8px;">
          <label class="form-label">Накладання</label>
          <select class="fsel img-overlay" oninput="refreshCode()">
            <option value="bg-black/0">Прозоре</option>
            <option value="bg-black/20">Легке (20%)</option>
            <option value="bg-black/40" selected>Середнє (40%)</option>
            <option value="bg-black/60">Темне (60%)</option>
            <option value="bg-black/80">Дуже темне (80%)</option>
            <option value="bg-gradient-to-t from-black/80 to-transparent">Градієнт знизу</option>
            <option value="bg-gradient-to-b from-black/60 to-transparent">Градієнт зверху</option>
          </select>
        </div>
        <div class="form-field mob-only">
          <label class="form-label">📱 Внутр. відступ</label>
          <select class="fsel img-ov-pad-mob" oninput="refreshCode()">
            ${Array.from({length:21}, (_, i) => i * 5).map(pct =>
              `<option value="p-[${pct}%]"${pct === 5 ? ' selected' : ''}>${pct}%</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-field dsk-only">
          <label class="form-label">🖥 Внутр. відступ</label>
          <select class="fsel img-ov-pad-dsk" oninput="refreshCode()">
            ${Array.from({length:21}, (_, i) => i * 5).map(pct =>
              `<option value="p-[${pct}%]"${pct === 5 ? ' selected' : ''}>${pct}%</option>`
            ).join('')}
          </select>
        </div>
        <div class="tl-list img-ov-list"></div>
        <button class="add-item-btn" onclick="addTextLine(this, ${bid})">+ Додати рядок тексту на фото</button>
      </div>
    </div>`;
}

/* ─── Render: HTML для експорту ──────────────── */
// Викликається з core.js → blockToHTML() для type === 'image'
function renderImageHTML(src, bid, ind) {
  let inner = '';

  const url     = src.querySelector('.img-url')?.value?.trim()  || '';
  const alt     = src.querySelector('.img-alt')?.value?.trim()  || '';
  const wMob    = src.querySelector('.img-w-mob')?.value        ?? 'max-w-full h-auto w-full';
  const wDsk    = src.querySelector('.img-w-dsk')?.value        ?? 'md:max-w-full md:h-auto md:w-full';
  const w       = [wMob, wDsk].filter(Boolean).join(' ');
  const alignMob = src.querySelector('.img-align-mob')?.value   || '';
  const alignDsk = src.querySelector('.img-align-dsk')?.value   || '';
  const align   = [alignMob, alignDsk].filter(Boolean).join(' ');
  const radius  = src.querySelector('.img-radius')?.value       || '';
  const shadow  = src.querySelector('.img-shadow')?.value       || '';

  // Overlay content
  const ovList  = src.querySelector('.img-ov-list');
  const ovHTML  = textLinesToHTML(ovList, ind + '    ');
  const hasOv   = ovHTML.trim() && url;

  if (hasOv) {
    const ovH   = src.querySelector('.img-ov-h')?.value   || 'h-auto';
    const ovPos = src.querySelector('.img-ov-pos')?.value || 'items-center justify-center';
    const ovlay = src.querySelector('.img-overlay')?.value|| 'bg-black/40';
    const padMob = src.querySelector('.img-ov-pad-mob')?.value || 'p-[5%]';
    const padDsk = src.querySelector('.img-ov-pad-dsk')?.value || 'p-[5%]';
    const pad    = padMob === padDsk ? padMob : `${padMob} md:${padDsk}`;

    if (ovH === 'h-auto') {
      // Оригінальний розмір: <img> у звичайному потоці сам задає висоту
      // блоку (за своїм натуральним співвідношенням сторін), а текстовий
      // шар накладається зверху абсолютно на всю площу зображення.
      inner += `${ind}<div class="relative overflow-hidden ${radius}">\n`;
      inner += `${ind}  <img src="${esc(url)}" alt="${esc(alt)}" class="block w-full h-auto">\n`;
      inner += `${ind}  <div class="absolute inset-0 ${ovlay} flex flex-col ${ovPos} ${pad}">\n`;
      inner += ovHTML;
      inner += `${ind}  </div>\n${ind}</div>\n`;
    } else {
      // Фіксована висота: зображення абсолютне на всю площу з обрізкою (cover)
      inner += `${ind}<div class="relative overflow-hidden ${ovH} ${radius}">\n`;
      inner += `${ind}  <img src="${esc(url)}" alt="${esc(alt)}" class="absolute inset-0 w-full h-full object-cover">\n`;
      inner += `${ind}  <div class="absolute inset-0 ${ovlay} flex flex-col ${ovPos} ${pad}">\n`;
      inner += ovHTML;
      inner += `${ind}  </div>\n${ind}</div>\n`;
    }
  } else if (url) {
    // Клас ширини (w) вже містить потрібні max-w-full/h-auto (або їх
    // відсутність для "оригінального розміру") окремо для mob/dsk.
    const imgCls = ['block', w, align, radius, shadow].filter(Boolean).join(' ');
    inner += `${ind}<img src="${esc(url)}" alt="${esc(alt)}" class="${imgCls}">\n`;
  }

  const capHTML = textLinesToHTML(src.querySelector('.img-cap-list'), ind + '  ');
  if (capHTML) inner += `${ind}<div class="mt-2">\n${capHTML}${ind}</div>\n`;

  return inner;
}
