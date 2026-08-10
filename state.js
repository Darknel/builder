/* ═══════════════════════════════════════════════
   STATE.JS — глобальний стан і статичні дані Builder'а
   ───────────────────────────────────────────────
   Раніше все це жило в одному великому script.js разом з
   модалками/preview/row/block системами. Розбито на модулі для
   читабельності — сам файл ПОВИНЕН підключатись першим (до
   core.js і решти), бо оголошує стан, яким користуються всі інші.

   - Стан drag&drop і лічильники id рядків/блоків
   - LAYOUTS / LAYOUT_DEFS — розмітки контейнерів
   - BLOCK_DEFS / BLOCK_META — типи блоків
   - showToast()
   - SWITCHER_RUNTIME_JS — JS-рантайм перемикача, що вставляється
     у сам експортований HTML (працює в браузері користувача,
     без залежності від Builder'а) і в preview iframe
═══════════════════════════════════════════════ */

/* ─── State ──────────────────────────────────── */
let rowCnt   = 0;
let blkCnt   = 0;
let dragRow  = null, dragOverRow = null;
let dragBlock = null, dragSrcCol = null;

/* ─── Layouts ────────────────────────────────── */
const LAYOUTS = {
  '1':       { label:'1 кол.',  bars:[1],       flex:[1],       out:'grid-cols-1',                outSpans:[''] },
  '1,1':     { label:'50 / 50', bars:[1,1],     flex:[1,1],     out:'grid-cols-1 md:grid-cols-2', outSpans:['',''] },
  '1,2':     { label:'33 / 67', bars:[1,2],     flex:[1,2],     out:'grid-cols-1 md:grid-cols-3', outSpans:['','md:col-span-2'] },
  '2,1':     { label:'67 / 33', bars:[2,1],     flex:[2,1],     out:'grid-cols-1 md:grid-cols-3', outSpans:['md:col-span-2',''] },
  '3,1':     { label:'75 / 25', bars:[3,1],     flex:[3,1],     out:'grid-cols-1 md:grid-cols-4', outSpans:['md:col-span-3',''] },
  '1,3':     { label:'25 / 75', bars:[1,3],     flex:[1,3],     out:'grid-cols-1 md:grid-cols-4', outSpans:['','md:col-span-3'] },
  '1,1,1':   { label:'3 рівні', bars:[1,1,1],   flex:[1,1,1],   out:'grid-cols-1 md:grid-cols-3', outSpans:['','',''] },
  '1,1,1,1': { label:'4 рівні', bars:[1,1,1,1], flex:[1,1,1,1], out:'grid-cols-1 md:grid-cols-4', outSpans:['','','',''] },
  '1,1,1,1,1': { label:'5 рівнів', bars:[1,1,1,1,1], flex:[1,1,1,1,1], out:'grid-cols-1 md:grid-cols-5', outSpans:['','','','',''] },
};

const LAYOUT_DEFS = [
  { key:'1' },{ key:'1,1' },{ key:'1,2' },{ key:'2,1' },
  { key:'3,1' },{ key:'1,3' },{ key:'1,1,1' },{ key:'1,1,1,1' },{ key:'1,1,1,1,1' }
];

const BLOCK_DEFS = [
  { type:'text',     icon:'📝', label:'Текст' },
  { type:'image',    icon:'🖼️', label:'Зображення' },
  { type:'video',    icon:'▶️', label:'Відео' },
  { type:'switcher', icon:'🔀', label:'Перемикач' },
  { type:'swimage',  icon:'🖇️', label:'Зображення (перемикача)' },
];

const BLOCK_META = {
  text:     { icon:'📝', label:'Текстовий блок' },
  image:    { icon:'🖼️', label:'Зображення' },
  video:    { icon:'▶️', label:'Відео' },
  switcher: { icon:'🔀', label:'Перемикач' },
  swimage:  { icon:'🖇️', label:'Зображення (перемикача)' },
};

/* ─── Toast ──────────────────────────────────── */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} is-show`;
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('is-show'), 2400);
}

/* ─── Switcher runtime (shared JS for preview iframes & exported HTML) ── */
const SWITCHER_RUNTIME_JS = `
function swSwitch(btn){
  var group = btn.closest('.sw-group');
  var target = btn.getAttribute('data-sw-target');
  if (group) {
    var onCls = (group.getAttribute('data-sw-on-cls')||'').split(' ').filter(Boolean);
    var offCls = (group.getAttribute('data-sw-off-cls')||'').split(' ').filter(Boolean);
    var bcOn = btn.getAttribute('data-sw-bc-on') || '';
    var bcOff = btn.getAttribute('data-sw-bc-off') || '';
    var btns = group.querySelectorAll('.sw-btn');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (offCls.length) { b.classList.remove.apply(b.classList, onCls); b.classList.add.apply(b.classList, offCls); }
      var bOff = b.getAttribute('data-sw-bc-off');
      if (bOff) b.style.borderColor = bOff;
    }
    if (onCls.length) { btn.classList.remove.apply(btn.classList, offCls); btn.classList.add.apply(btn.classList, onCls); }
    if (bcOn) btn.style.borderColor = bcOn;
  }
  if (target) { swShowTarget(target, group); }
}
function swShowTarget(target, group){
  var fadeOn = true, fadeMs = 500;
  if (group) {
    fadeOn = group.getAttribute('data-sw-fade') !== '0';
    fadeMs = parseInt(group.getAttribute('data-sw-fade-ms'), 10) || 500;
  }
  var imgs = document.querySelectorAll('[data-sw-image]');
  for (var j = 0; j < imgs.length; j++) {
    var img = imgs[j];
    var isTarget = img.getAttribute('data-sw-image') === target;
    var stack = img.closest('.sw-stack');
    if (stack) {
      // Crossfade mode: use opacity, keep all images laid out (absolute except first)
      img.style.transitionDuration = fadeOn ? (fadeMs + 'ms') : '0ms';
      img.style.opacity = isTarget ? '1' : '0';
      img.style.pointerEvents = isTarget ? 'auto' : 'none';
      img.style.zIndex = isTarget ? '1' : '0';
    } else {
      // Legacy mode: single image per id, show/hide via display
      img.style.display = isTarget ? '' : 'none';
    }
  }
}
function swInit(){
  var groups = document.querySelectorAll('.sw-group');
  for (var g = 0; g < groups.length; g++) {
    var group = groups[g];
    var onCls = (group.getAttribute('data-sw-on-cls')||'').split(' ').filter(Boolean);
    var btns = group.querySelectorAll('.sw-btn');
    var firstActiveTarget = null;
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var isOn = onCls.length > 0;
      for (var k = 0; k < onCls.length && isOn; k++) { if (!b.classList.contains(onCls[k])) isOn = false; }
      if (isOn && !firstActiveTarget) firstActiveTarget = b.getAttribute('data-sw-target');
    }
    if (firstActiveTarget) swShowTarget(firstActiveTarget, group);
  }
  var allBtns = document.querySelectorAll('.sw-btn');
  for (var m = 0; m < allBtns.length; m++) {
    allBtns[m].onclick = function(){ swSwitch(this); };
  }
  var stacks = document.querySelectorAll('.sw-stack');
  for (var s = 0; s < stacks.length; s++) { swSizeStack(stacks[s]); }
}
function swSizeStack(stack){
  var imgs = stack.querySelectorAll('img');
  if (!imgs.length) return;
  var tallestRatio = 0; // height / width of the tallest image (by natural aspect)
  var pending = imgs.length;
  function consider(img){
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      var ratio = img.naturalHeight / img.naturalWidth;
      if (ratio > tallestRatio) tallestRatio = ratio;
    }
    pending--;
    if (pending <= 0 && tallestRatio > 0) {
      stack.style.aspectRatio = (1 / tallestRatio).toFixed(6) + ' / 1';
    }
  }
  for (var i = 0; i < imgs.length; i++) {
    var img = imgs[i];
    if (img.complete && img.naturalWidth > 0) {
      consider(img);
    } else {
      img.addEventListener('load', function(){ consider(this); });
      img.addEventListener('error', function(){ pending--; });
    }
  }
}
`;
