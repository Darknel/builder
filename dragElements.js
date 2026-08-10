/* ═══════════════════════════════════════════════
   DRAG ELEMENTS — drag & drop для рядків і блоків
   ───────────────────────────────────────────────
   Не залежить від типу елемента. Відповідає за:
   - перетягування рядків (.row) місцями всередині канвасу
   - перетягування блоків (.block) між колонками/позиціями
   Без змін відносно оригіналу.
═══════════════════════════════════════════════ */

/* ─── Shared "arm/disarm" state for drag handles ──
   Раніше кожен виклик bindRowDrag()/bindBlockDrag() вішав власний
   document.addEventListener('mouseup', ...), який ніколи не знімався
   при видаленні рядка/блока (removeRow/removeBlock цього не робили).
   При активному редагуванні (багато додавань/дублювань/видалень)
   кількість "мертвих" слухачів на document постійно росла — витік
   памʼяті. Тепер слухач один, глобальний, а armed-елемент відстежується
   змінною. ──────────────────────────────────────────────────────── */
let _armedDraggable = null;
document.addEventListener('mouseup', () => {
  if (_armedDraggable) { _armedDraggable.draggable = false; _armedDraggable = null; }
});

/* ─── Row drag ───────────────────────────────── */
function bindRowDrag(rw) {
  const handle = rw.querySelector('.row-handle');
  if (!handle) return;
  handle.addEventListener('mousedown', () => { rw.draggable = true; _armedDraggable = rw; });

  rw.addEventListener('dragstart', e => {
    if (dragBlock) { e.preventDefault(); return; }
    dragRow = rw;
    rw.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  });
  rw.addEventListener('dragend', () => {
    dragRow = null; rw.draggable = false;
    rw.classList.remove('is-dragging');
    document.querySelectorAll('.row.is-drag-over').forEach(r => r.classList.remove('is-drag-over'));
    renumRows(); refreshCode();
  });
  rw.addEventListener('dragover', e => {
    if (!dragRow || dragRow === rw) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverRow !== rw) {
      document.querySelectorAll('.row.is-drag-over').forEach(r => r.classList.remove('is-drag-over'));
      dragOverRow = rw;
      rw.classList.add('is-drag-over');
    }
  });
  rw.addEventListener('drop', e => {
    if (!dragRow || dragRow === rw) return;
    e.preventDefault();
    rw.classList.remove('is-drag-over');
    const canvas = document.getElementById('canvas');
    const rows   = [...canvas.querySelectorAll('.row')];
    const from   = rows.indexOf(dragRow);
    const to     = rows.indexOf(rw);
    const dragGap = dragRow.previousElementSibling?.classList.contains('row-gap') ? dragRow.previousElementSibling : null;
    if (from < to) {
      rw.insertAdjacentElement('afterend', dragRow);
      if (dragGap) dragRow.insertAdjacentElement('beforebegin', dragGap);
    } else {
      const tgtGap = rw.previousElementSibling?.classList.contains('row-gap') ? rw.previousElementSibling : null;
      if (tgtGap) canvas.insertBefore(dragRow, tgtGap);
      else        canvas.insertBefore(dragRow, rw);
      if (dragGap) dragRow.insertAdjacentElement('beforebegin', dragGap);
    }
  });
}

/* ─── Column drop ────────────────────────────── */
function bindColDrop(col) {
  if (col._dropBound) return;
  col._dropBound = true;

  col.addEventListener('dragover', e => {
    if (!dragBlock) return;
    if (e.target.closest('.block')) return;
    e.preventDefault();
    col.classList.add('drop-over');
  });
  col.addEventListener('dragleave', e => {
    if (!col.contains(e.relatedTarget)) col.classList.remove('drop-over');
  });
  col.addEventListener('drop', e => {
    col.classList.remove('drop-over');
    if (!dragBlock) return;
    if (e.target.closest('.block')) return;
    e.preventDefault();
    e.stopPropagation();
    const addBtn = col.querySelector('.add-block-btn');
    col.insertBefore(dragBlock, addBtn || null);
    restoreColEmpty(dragSrcCol);
    refreshCode();
  });
}

function restoreColEmpty(col) {
  if (!col) return;
  if (!col.querySelector('.block') && !col.querySelector('.add-block-btn')) {
    col.appendChild(makeAddBlockBtn(col));
  }
}
/* ─── Block drag ─────────────────────────────── */
function bindBlockDrag(block) {
  const dragHandle = block.querySelector('[data-action="drag"]');
  if (!dragHandle) return;
  dragHandle.addEventListener('mousedown', () => { block.draggable = true; _armedDraggable = block; });

  block.addEventListener('dragstart', e => {
    if (dragRow) { e.preventDefault(); return; }
    dragBlock  = block;
    dragSrcCol = block.closest('.col');
    setTimeout(() => block.classList.add('is-dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  });
  block.addEventListener('dragend', () => {
    dragBlock = null; dragSrcCol = null;
    block.draggable = false;
    block.classList.remove('is-dragging');
    document.querySelectorAll('.block.drop-before').forEach(b => b.classList.remove('drop-before'));
    refreshCode();
  });
  block.addEventListener('dragover', e => {
    if (!dragBlock || dragBlock === block) return;
    e.preventDefault(); e.stopPropagation();
    document.querySelectorAll('.block.drop-before').forEach(b => b.classList.remove('drop-before'));
    block.classList.add('drop-before');
  });
  block.addEventListener('dragleave', e => {
    if (!block.contains(e.relatedTarget)) block.classList.remove('drop-before');
  });
  block.addEventListener('drop', e => {
    if (!dragBlock || dragBlock === block) return;
    e.preventDefault(); e.stopPropagation();
    block.classList.remove('drop-before');
    const targetCol = block.closest('.col');
    targetCol.insertBefore(dragBlock, block);
    restoreColEmpty(dragSrcCol);
    refreshCode();
  });
}
