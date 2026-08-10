/* ═══════════════════════════════════════════════
   GENERATE HTML — збірка фінального експортованого HTML
   ───────────────────────────────────────────────
   Цей файл відповідає за РІВЕНЬ КОНТЕЙНЕРІВ (рядків/колонок),
   а не за окремі елементи (text/image/video/...) — ті вже
   зібрані блоком renderColBlocks() з core.js.

   - generateHTML()       — проходить по всіх .row у канвасі,
       для кожного рядка формує <div class="grid ...">, враховуючи
       режим фону (css / overlay / natural), відступи, вирівнювання;
       усередині колонок викликає renderColBlocks() (core.js)
   - refreshCode()         — перегенеровує код і оновлює праву
       панель попереднього перегляду (updateRightPreview, script.js)

   Залежить від core.js (renderColBlocks, blockToHTML) та від
   SWITCHER_RUNTIME_JS (визначено в script.js).
═══════════════════════════════════════════════ */

/* ─── Generate full HTML ─────────────────────── */
function generateHTML() {
  const rows = [...document.querySelectorAll('#canvas .row')];
  if (!rows.length) return '';
  let out = '';

  rows.forEach(rw => {
    const key   = rw.dataset.key;
    const lay   = LAYOUTS[key] || LAYOUTS['1'];
    const cols  = [...rw.querySelectorAll('.col')];

    const pxMob  = rw.dataset.pxMob  ?? 'px-4';
    const pxDsk  = rw.dataset.pxDsk  ?? 'px-4';
    const pyMob  = rw.dataset.pyMob  ?? 'py-4';
    const pyDsk  = rw.dataset.pyDsk  ?? 'py-4';
    const vaMob  = rw.dataset.vaMob || 'items-center';
    const vaDsk  = rw.dataset.vaDsk || 'md:items-center';
    const haMob  = rw.dataset.haMob || '';
    const haDsk  = rw.dataset.haDsk || '';
    const bgColor  = rw.dataset.bgColor  || '';
    const bgImage  = safeUrl(rw.dataset.bgImage, { allowDataImage: true });
    const bgSize   = rw.dataset.bgSize   || 'cover';
    const bgPos    = rw.dataset.bgPos    || 'center';
    const bgRepeat = rw.dataset.bgRepeat || 'no-repeat';
    const bgMode   = rw.dataset.bgMode   || 'css';
    const minHMob  = rw.dataset.minHMob  || '';
    const minHDsk  = rw.dataset.minHDsk  || '';
    const gap      = rw.dataset.gap      || 'gap-4';

    const baseCls = ['grid', lay.out, pxMob, pxDsk ? `md:${pxDsk}` : '', gap, pyMob, pyDsk ? `md:${pyDsk}` : '', vaMob, vaDsk, haMob, haDsk].filter(Boolean).join(' ');

    // ── Mode: css ──────────────────────────────────────────────────────
    if (!bgImage || bgMode === 'css') {
      const styleParts = [];
      if (bgColor) styleParts.push(`background-color:${esc(bgColor)}`);
      if (bgImage) {
        styleParts.push(`background-image:url("${esc(bgImage)}")`);
        styleParts.push(`background-size:${bgSize}`);
        styleParts.push(`background-position:${bgPos}`);
        styleParts.push(`background-repeat:${bgRepeat}`);
      }
      if (minHMob) styleParts.push(`min-height:${minHMob}`);
      let cls = baseCls;
      if (minHDsk) cls += ` md:min-h-[${minHDsk.replace(/\s/g,'_')}]`;
      const style = styleParts.length ? ` style="${styleParts.join(';')}"` : '';
      out += `<div class="${cls}"${style}>\n`;
      cols.forEach((col, i) => {
        const span  = lay.outSpans[i] || '';
        const cvMob = col.dataset.cvMob || 'justify-start';
        const cvDsk = col.dataset.cvDsk || 'md:justify-start';
        // orderMob/orderDsk — опційне перевпорядкування колонок (CSS order),
        // напр. коли зображення має бути зліва на десктопі, але знизу на мобільній.
        // Не виставляється в UI налаштувань, лише деякими готовими шаблонами.
        const orderMob = col.dataset.orderMob || '';
        const orderDsk = col.dataset.orderDsk || '';
        out += `  <div class="${['flex','flex-col',span,cvMob,cvDsk,orderMob,orderDsk].filter(Boolean).join(' ')}">\n`;
        out += renderColBlocks(col);
        out += `  </div>\n`;
      });
      out += `</div>\n\n`;

    // ── Mode: overlay ──────────────────────────────────────────────────
    // <img> absolute behind content; use min-height to size container
    } else if (bgMode === 'overlay') {
      const styleParts = [];
      if (bgColor) styleParts.push(`background-color:${esc(bgColor)}`);
      if (minHMob) styleParts.push(`min-height:${minHMob}`);
      let cls = `${baseCls} relative overflow-hidden`;
      if (minHDsk) cls += ` md:min-h-[${minHDsk.replace(/\s/g,'_')}]`;
      const style = styleParts.length ? ` style="${styleParts.join(';')}"` : '';
      out += `<div class="${cls}"${style}>\n`;
      out += `  <img src="${esc(bgImage)}" alt="" class="absolute inset-0 w-full h-full"${styleAttr(IMG_BASE_STYLE, `object-fit:${bgSize==='contain'?'contain':'cover'}`, `object-position:${bgPos}`)} aria-hidden="true">\n`;
      cols.forEach((col, i) => {
        const span  = lay.outSpans[i] || '';
        const cvMob = col.dataset.cvMob || 'justify-start';
        const cvDsk = col.dataset.cvDsk || 'md:justify-start';
        const orderMob = col.dataset.orderMob || '';
        const orderDsk = col.dataset.orderDsk || '';
        out += `  <div class="${['flex','flex-col',span,cvMob,cvDsk,orderMob,orderDsk,'relative','z-10'].filter(Boolean).join(' ')}">\n`;
        out += renderColBlocks(col);
        out += `  </div>\n`;
      });
      out += `</div>\n\n`;

    // ── Mode: natural ──────────────────────────────────────────────────
    // <img> in flow → sets container height naturally; content overlaid absolute
    } else if (bgMode === 'natural') {
      const styleParts = [];
      if (bgColor) styleParts.push(`background-color:${esc(bgColor)}`);
      const style = styleParts.length ? ` style="${styleParts.join(';')}"` : '';
      out += `<div class="relative overflow-hidden"${style}>\n`;
      out += `  <img src="${esc(bgImage)}" alt="" class="w-full block"${styleAttr(IMG_BASE_STYLE, bgPos !== 'center' ? `object-position:${bgPos}` : '')} aria-hidden="true">\n`;
      // Grid overlay — absolute, fills container
      out += `  <div class="absolute inset-0 ${baseCls}">\n`;
      cols.forEach((col, i) => {
        const span  = lay.outSpans[i] || '';
        const cvMob = col.dataset.cvMob || 'justify-start';
        const cvDsk = col.dataset.cvDsk || 'md:justify-start';
        const orderMob = col.dataset.orderMob || '';
        const orderDsk = col.dataset.orderDsk || '';
        out += `    <div class="${['flex','flex-col',span,cvMob,cvDsk,orderMob,orderDsk].filter(Boolean).join(' ')}">\n`;
        out += renderColBlocks(col);
        out += `    </div>\n`;
      });
      out += `  </div>\n`;
      out += `</div>\n\n`;
    }
  });

  if (out.includes('sw-btn') || out.includes('data-sw-image')) {
    out += `<script>
${SWITCHER_RUNTIME_JS}
swInit();
<\/script>\n`;
  }

  return out.trimEnd();
}

function refreshCode() {
  const html = generateHTML();
  document.getElementById('code-out').value = html;
  updateRightPreview(html);
  // Хук для persistence.js (undo/redo історія + автозбереження).
  // Перевірка typeof — щоб generateHTML.js не залежав від порядку
  // підключення persistence.js.
  if (typeof onProjectChanged === 'function') onProjectChanged();
}

/* ─── Standalone export ───────────────────────────
   Експортований фрагмент розрахований на сторінку, де Tailwind
   вже підключено (напр. CMS "Zhuk" з власними brand/zhuk-* токенами
   в конфігу). Для випадків, коли код вставляється в довільну
   сторінку БЕЗ Tailwind, "Самодостатній HTML" загортає фрагмент
   у повний документ з Tailwind CDN + мінімальним конфігом тем,
   що відтворює brand/zhuk-* кольори з палітри редактора тексту. */
const STANDALONE_TAILWIND_CONFIG = `tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand-color, #2563eb)',
        'brand-dark': 'var(--brand-color, #1d4ed8)',
        'zhuk-dark-gray': '#222222',
        'zhuk-gray': '#96979A',
        'zhuk-red': '#d23434',
        'zhuk-yellow': '#FDBB2F',
      },
    },
  },
};`;

function wrapStandaloneHTML(html) {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Сторінка</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<script>
${STANDALONE_TAILWIND_CONFIG}
<\/script>
<style>*,*::before,*::after{box-sizing:border-box}img{max-width:100%;height:auto;display:block}</style>
</head>
<body>
${html}
</body>
</html>`;
}
