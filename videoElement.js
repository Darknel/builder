/* ═══════════════════════════════════════════════
   VIDEO ELEMENT — блок "Відео" (▶️)
   ───────────────────────────────────────────────
   Все, що стосується блоку відео, зібрано тут:

   - buildVideoFields(bid) — панель налаштувань у sidebar:
       URL (YouTube/Vimeo/.mp4), пропорції, кути,
       параметри відтворення (контролер, автозапуск, звук,
       повтор, повноекранний), підпис під відео

   - toEmbedUrl(url)       — перетворює звичайне посилання
       YouTube/Vimeo на embed-URL для <iframe>

   - renderVideoHTML(...)  — генерація фінального HTML для експорту
       (викликається з core.js → blockToHTML() для type === 'video').
       Розрізняє два випадки:
         а) пряме посилання на файл (.mp4/.webm/.ogv) → <video>,
            з MIME-типом source, який відповідає реальному
            розширенню файлу
         б) YouTube/Vimeo → <iframe> з embed-URL і параметрами

   Підпис під відео рендериться через textLinesToHTML() з core.js.
   URL відео проходить через safeUrl() (core.js) — приймається лише
   http(s), щоб непризначені схеми (напр. javascript:) не потрапили
   в src атрибут iframe/video.

   Усі поля без inline onclick/oninput — керування через delegate.js.
═══════════════════════════════════════════════ */

/* ─── Fields (панель налаштувань) ────────────── */
function buildVideoFields(bid) {
  return `
    <div class="sp-group">
      <div class="sp-group-title">Відео</div>
      <div class="form-field">
        <label class="form-label">URL відео</label>
        <input class="fi vid-url" type="url" placeholder="YouTube, Vimeo або .mp4">
        <div style="font-size:11px;color:var(--t4);margin-top:4px;line-height:1.5;">Підтримується YouTube, Vimeo та прямі .mp4 / .webm посилання</div>
      </div>
      <div class="f2">
        <div class="form-field">
          <label class="form-label">Пропорції</label>
          <select class="fsel vid-ratio">
            <option value="aspect-video">16:9 (горизонт.)</option>
            <option value="aspect-square">1:1 (квадрат)</option>
            <option value="aspect-[4/3]">4:3 (класика)</option>
            <option value="aspect-[9/16]">9:16 (вертикаль)</option>
            <option value="aspect-[21/9]">21:9 (кіно)</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">Кути</label>
          <select class="fsel vid-radius">
            <option value="">Прямі</option>
            <option value="rounded-lg">Середні</option>
            <option value="rounded-xl">Великі</option>
            <option value="rounded-2xl">Дуже великі</option>
          </select>
        </div>
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-group-title">Параметри відтворення</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;">
        <label class="toggle-row" data-action="toggle">
          <input type="checkbox" class="toggle-input vc-ctrl" checked>
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span class="toggle-label">Панель керування</span>
        </label>
        <label class="toggle-row" data-action="toggle">
          <input type="checkbox" class="toggle-input vc-auto">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span class="toggle-label">Автозапуск</span>
        </label>
        <label class="toggle-row" data-action="toggle">
          <input type="checkbox" class="toggle-input vc-mute" checked>
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span class="toggle-label">Без звуку (muted)</span>
        </label>
        <label class="toggle-row" data-action="toggle">
          <input type="checkbox" class="toggle-input vc-loop">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span class="toggle-label">Повтор (loop)</span>
        </label>
        <label class="toggle-row" data-action="toggle">
          <input type="checkbox" class="toggle-input vc-fs" checked>
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span class="toggle-label">Повноекранний</span>
        </label>
      </div>
    </div>
    <div class="sp-group">
      <div class="sp-section-head">
        <span class="sp-section-name">📎 Підпис під відео</span>
        <button class="sp-toggle-btn" data-action="sp-toggle">Показати</button>
      </div>
      <div class="hidden">
        <div class="tl-list vid-cap-list"></div>
        <button class="add-item-btn" data-action="add-text-line" data-bid="${bid}">+ Додати підпис</button>
      </div>
    </div>`;
}

/* ─── Helper: YouTube/Vimeo URL → embed URL ──── */
function toEmbedUrl(url) {
  if (!url) return '';
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?#\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  return url;
}

/* ─── Render: HTML для експорту ──────────────── */
// Викликається з core.js → blockToHTML() для type === 'video'
function renderVideoHTML(src, bid, ind) {
  let inner = '';

  const url    = safeUrl(src.querySelector('.vid-url')?.value);
  const ratio  = src.querySelector('.vid-ratio')?.value  || 'aspect-video';
  const radius = src.querySelector('.vid-radius')?.value || '';

  const ctrl   = src.querySelector('.vc-ctrl')?.checked;
  const auto   = src.querySelector('.vc-auto')?.checked;
  const mute   = src.querySelector('.vc-mute')?.checked;
  const loop   = src.querySelector('.vc-loop')?.checked;
  const fs     = src.querySelector('.vc-fs')?.checked;
  const pip    = true;    // завжди увімкнено

  if (url) {
    const wrapCls = [ratio, 'w-full overflow-hidden', radius].filter(Boolean).join(' ');

    const fileMatch = url.match(/\.(mp4|webm|ogv)(\?.*)?$/i);
    if (fileMatch) {
      const mimeByExt = { mp4: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg' };
      const mime = mimeByExt[fileMatch[1].toLowerCase()] || 'video/mp4';
      const attrs = [
        auto ? 'autoplay' : '', loop ? 'loop' : '',
        mute ? 'muted' : '', ctrl ? 'controls' : '',
        'playsinline', 'preload="metadata"',
      ].filter(Boolean).join(' ');
      inner += `${ind}<div class="${wrapCls}">\n`;
      inner += `${ind}  <video class="w-full h-full object-cover" ${attrs}>\n`;
      inner += `${ind}    <source src="${esc(url)}" type="${mime}">\n`;
      inner += `${ind}  </video>\n${ind}</div>\n`;
    } else {
      const embed = toEmbedUrl(url);
      const params = [
        auto ? 'autoplay=1' : '', loop ? 'loop=1' : '',
        mute ? 'mute=1' : '', !ctrl ? 'controls=0' : '',
        !fs ? 'fs=0' : '', 'rel=0',
      ].filter(Boolean).join('&');
      const src2  = embed + (params ? (embed.includes('?') ? '&' : '?') + params : '');
      const allow = [
        'accelerometer', auto ? 'autoplay' : '', 'clipboard-write',
        'encrypted-media', 'gyroscope',
        pip ? 'picture-in-picture' : '',
        fs  ? 'fullscreen' : '',
      ].filter(Boolean).join('; ');
      inner += `${ind}<div class="${wrapCls}">\n`;
      inner += `${ind}  <iframe src="${esc(src2)}" class="w-full h-full" allow="${allow}"${fs ? ' allowfullscreen' : ''} loading="lazy"></iframe>\n`;
      inner += `${ind}</div>\n`;
    }
  }

  const capHTML = textLinesToHTML(src.querySelector('.vid-cap-list'), ind + '  ');
  if (capHTML) inner += `${ind}<div class="mt-2">\n${capHTML}${ind}</div>\n`;

  return inner;
}
