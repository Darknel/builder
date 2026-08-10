/* ═══════════════════════════════════════════════
   ROW SYSTEM.JS — панель налаштувань рядка + CRUD рядків/колонок
═══════════════════════════════════════════════ */

/* ─── Row settings panel ─────────────────────── */
function openRowSP(rw) {
  // Close block settings if open
  if (window._activeBlock) {
    const body = document.getElementById('sp-body');
    const padBar = body.querySelector('.block-padbar');
    const fields = body.querySelector('.block-fields');
    if (padBar) window._activeBlock.appendChild(padBar);
    if (fields) window._activeBlock.appendChild(fields);
    window._activeBlock.classList.remove('is-active');
    window._activeBlock = null;
  }

  // Toggle if same row
  if (window._activeRow === rw) { closeSP(); return; }
  if (window._activeRow) window._activeRow.classList.remove('is-settings-active');

  window._activeRow = rw;
  rw.classList.add('is-settings-active');

  document.getElementById('sp-icon').textContent  = '⊞';
  document.getElementById('sp-title').textContent = 'Налаштування контейнера';
  document.getElementById('sp-body').innerHTML = buildRowSettingsHTML(rw);
  document.getElementById('settings-panel').classList.add('is-open');
}

/* ═══════════════════════════════════════════════
   ROW SYSTEM
═══════════════════════════════════════════════ */
function makeGap() {
  const gap = document.createElement('div');
  gap.className = 'row-gap';
  gap.innerHTML = `<div class="row-gap-line"></div><button class="row-gap-btn" title="Додати контейнер тут">+</button>`;
  gap.querySelector('.row-gap-btn').addEventListener('click', e => { e.stopPropagation(); openLayoutModal(gap); });
  return gap;
}

function makeAddBlockBtn(col) {
  const btn = document.createElement('button');
  btn.className = 'add-block-btn';
  btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/></svg> Блок`;
  btn.addEventListener('click', e => { e.stopPropagation(); openBlockModal(col); });
  return btn;
}

// Прив'язує клік по панелі рядка (⚙/↑/↓/⧉/✕). Винесено в окрему
// функцію — використовується і для нового рядка (addRow), і для
// дубльованого (dupRow: рядок-клон замінює собі .row-bar на "чистий"
// вузол через cloneNode, щоб зняти застарілі слухачі, прив'язані до
// оригінального рядка, а тоді викликає bindRowBar(clone)), і при
// відновленні збереженого проєкту (persistence.js).
function bindRowBar(rw) {
  const bar = rw.querySelector('.row-bar');
  if (!bar || bar._bound) return;
  bar._bound = true;
  bar.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'settings') openRowSP(rw);
    if (action === 'up')   moveRow(rw, -1);
    if (action === 'down') moveRow(rw, 1);
    if (action === 'dup')  dupRow(rw);
    if (action === 'del')  removeRow(rw);
  });
}

function addRow(key) {
  const lay = LAYOUTS[key] || LAYOUTS['1'];
  const id  = ++rowCnt;

  const rw = document.createElement('div');
  rw.className   = 'row';
  rw.dataset.key = key;
  rw.id          = `rw-${id}`;
  // Row alignment defaults
  rw.dataset.pxMob = 'px-4';
  rw.dataset.pxDsk = 'px-4';
  rw.dataset.pyMob = 'py-4';
  rw.dataset.pyDsk = 'py-4';
  rw.dataset.vaMob = 'items-center';
  rw.dataset.vaDsk = 'md:items-center';

  const bar = document.createElement('div');
  bar.className = 'row-bar';
  bar.innerHTML = `
    <span class="row-handle" title="Перетягнути рядок">⠿</span>
    <span class="row-label">Контейнер <span class="row-num"></span></span>
    <span class="row-tag">${lay.label}</span>
    <div class="row-actions">
      <button class="ib" data-action="settings" title="Налаштування контейнера">⚙</button>
      <button class="ib" data-action="up"  title="Вгору">↑</button>
      <button class="ib" data-action="down" title="Вниз">↓</button>
      <button class="ib" data-action="dup" title="Копіювати контейнер">⧉</button>
      <button class="ib danger" data-action="del" title="Видалити контейнер">✕</button>
    </div>`;

  const colsWrap = document.createElement('div');
  colsWrap.className = 'row-cols';
  colsWrap.id = `rcols-${id}`;

  lay.flex.forEach((f, i) => {
    const col = document.createElement('div');
    col.className  = 'col';
    col.style.flex = f;
    col.dataset.colIndex = i;
    // Column alignment defaults
    col.dataset.haMob = 'items-start';
    col.dataset.haDsk = 'md:items-start';
    col.dataset.cvMob = 'justify-start';
    col.dataset.cvDsk = 'md:justify-start';
    col.appendChild(makeAddBlockBtn(col));
    bindColDrop(col);
    colsWrap.appendChild(col);
  });

  rw.appendChild(bar);
  rw.appendChild(colsWrap);

  const canvas  = document.getElementById('canvas');
  const addZone = document.getElementById('add-row-zone');

  if (_pendingAfterEl) {
    const newGap = makeGap();
    _pendingAfterEl.insertAdjacentElement('afterend', rw);
    rw.insertAdjacentElement('afterend', newGap);
  } else {
    const topGap = makeGap();
    canvas.insertBefore(topGap, addZone);
    canvas.insertBefore(rw, addZone);
  }

  document.getElementById('empty-state')?.classList.add('hidden');
  bindRowBar(rw);
  bindRowDrag(rw);
  renumRows();
  refreshCode();
  showToast('Контейнер додано');
  return rw;
}

function removeRow(rw) {
  if (window._activeBlock && rw.contains(window._activeBlock)) closeSP();
  if (window._activeRow === rw) closeSP();
  const prev = rw.previousElementSibling;
  if (prev?.classList.contains('row-gap')) prev.remove();
  rw.remove();
  if (!document.querySelector('#canvas .row')) document.getElementById('empty-state')?.classList.remove('hidden');
  renumRows();
  refreshCode();
}

function renumRows() {
  document.querySelectorAll('#canvas .row .row-num').forEach((el, i) => { el.textContent = i + 1; });
}

function moveRow(rw, dir) {
  const canvas = document.getElementById('canvas');
  const rows   = [...canvas.querySelectorAll('.row')];
  const idx    = rows.indexOf(rw);
  const target = rows[idx + dir];
  if (!target) return;
  const rwGap  = rw.previousElementSibling?.classList.contains('row-gap')     ? rw.previousElementSibling     : null;
  const tgtGap = target.previousElementSibling?.classList.contains('row-gap') ? target.previousElementSibling : null;
  if (dir === -1) {
    if (tgtGap) canvas.insertBefore(rw, tgtGap);
    else        canvas.insertBefore(rw, target);
    if (rwGap)  canvas.insertBefore(rwGap, rw);
  } else {
    if (rwGap)  canvas.insertBefore(target, rwGap);
    else        canvas.insertBefore(target, rw);
    if (tgtGap) canvas.insertBefore(tgtGap, target);
  }
  renumRows();
  refreshCode();
}

function dupRow(srcRw) {
  // If a block inside this row is currently open in the settings panel,
  // temporarily move its fields back into the block so cloneNode captures them.
  let _restoredBlock = null;
  let _restoredPadBar = null;
  let _restoredFields = null;
  if (window._activeBlock && srcRw.contains(window._activeBlock)) {
    const spBody = document.getElementById('sp-body');
    _restoredBlock  = window._activeBlock;
    _restoredPadBar = spBody.querySelector('.block-padbar');
    _restoredFields = spBody.querySelector('.block-fields');
    if (_restoredPadBar) _restoredBlock.appendChild(_restoredPadBar);
    if (_restoredFields) _restoredBlock.appendChild(_restoredFields);
  }

  // Sync form values to attributes before cloning
  srcRw.querySelectorAll('input').forEach(el => {
    if (el.type === 'checkbox') el.checked ? el.setAttribute('checked','') : el.removeAttribute('checked');
    else el.setAttribute('value', el.value);
  });
  // textarea: value is textContent, not an attribute — set it directly before clone
  srcRw.querySelectorAll('textarea').forEach(el => { el.textContent = el.value; });
  srcRw.querySelectorAll('select').forEach(s => {
    [...s.options].forEach((opt, i) => i === s.selectedIndex ? opt.setAttribute('selected','') : opt.removeAttribute('selected'));
  });

  const clone  = srcRw.cloneNode(true);

  // After clone, restore textareas (textContent change affects live DOM too)
  srcRw.querySelectorAll('textarea').forEach(el => { el.textContent = el.value; });
  // Also sync clone's textareas .value from textContent
  const srcTAs  = [...srcRw.querySelectorAll('textarea')];
  const cloneTAs = [...clone.querySelectorAll('textarea')];
  srcTAs.forEach((src, i) => { if (cloneTAs[i]) cloneTAs[i].value = src.value; });

  // Move the fields back to the settings panel if we temporarily moved them
  if (_restoredBlock) {
    const spBody = document.getElementById('sp-body');
    if (_restoredPadBar) spBody.appendChild(_restoredPadBar);
    if (_restoredFields) spBody.appendChild(_restoredFields);
  }
  const newId  = ++rowCnt;
  clone.id     = `rw-${newId}`;
  clone.querySelectorAll('[id]').forEach(el => { el.id = el.id + '-c' + newId; });

  // Re-bind columns
  clone.querySelectorAll('.col').forEach(col => {
    col._dropBound = false;
    const oldBtn = col.querySelector('.add-block-btn');
    if (oldBtn) oldBtn.replaceWith(makeAddBlockBtn(col));
    bindColDrop(col);
  });

  // Re-bind blocks. sw-id/sw-target у switcher/swimage-блоках (та id
  // самого <img>) — це вільний текст, який користувач вписав сам, тому
  // копія рядка матиме ТІ САМІ значення, доки користувач їх не змінить
  // вручну (інакше довелось би вгадувати новий унікальний ID за нього).
  clone.querySelectorAll('.block').forEach(b => {
    const oldBid = b.dataset.bid;
    const newBid = ++blkCnt;
    b.dataset.bid = newBid;
    // ВАЖЛИВО: раніше тут була "сліпа" заміна підрядка "-oldBid" по
    // всьому innerHTML блоку. Це ламало Tailwind-класи, чиє числове
    // закінчення випадково збігалося з bid (напр. bid=3 і клас "px-3"
    // → ставало "px-14"; так само могло зачепити "rounded-2xl",
    // "border-2", "shadow-2xl", "gap-3" тощо). Тепер bid переписуємо
    // лише в точно визначених місцях, де він реально використовується:
    // id="tl-N" — і більше ніде (data-action-виклики більше не несуть
    // bid у собі напряму — bid передається через data-bid атрибут).
    b.innerHTML = b.innerHTML.replace(new RegExp(`id="tl-${oldBid}"`, 'g'), `id="tl-${newBid}"`);
    b.querySelectorAll('[data-bid]').forEach(el => { el.dataset.bid = newBid; });
    // Замінюємо плитку блоку на "чисту" копію (без застарілих слухачів)
    // і прив'язуємо заново до НОВОГО елемента b, а не до srcRw.
    const oldTile = b.querySelector('.block-tile');
    if (oldTile) { const freshTile = oldTile.cloneNode(true); oldTile.replaceWith(freshTile); }
    bindBlockTile(b);
    bindBlockDrag(b);
  });

  // Замінюємо панель рядка на "чисту" копію і прив'язуємо до clone
  const oldBar = clone.querySelector('.row-bar');
  if (oldBar) { const freshBar = oldBar.cloneNode(true); oldBar.replaceWith(freshBar); }
  bindRowBar(clone);

  const newGap = makeGap();
  const addZone = document.getElementById('add-row-zone');
  const canvas2 = document.getElementById('canvas');
  canvas2.insertBefore(newGap, addZone);
  canvas2.insertBefore(clone, addZone);
  bindRowDrag(clone);
  renumRows();
  refreshCode();
  showToast('Рядок скопійовано');
}
