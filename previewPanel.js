/* ═══════════════════════════════════════════════
   PREVIEW PANEL.JS — права панель живого перегляду (iframe)
═══════════════════════════════════════════════ */

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

// Дебаунс на resize — без нього кожен піксель зміни розміру вікна
// перераховує масштаб і шле postMessage у iframe.
window.addEventListener('resize', debounce(() => {
  updateRightPreview(document.getElementById('code-out').value);
}, 120));
