/* ═══════════════════════════════════════════════
   CLEAR BUTTON — кнопка "Очистити" (скидає весь канвас)
   Без змін відносно оригіналу.
═══════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════
   CLEAR ALL
═══════════════════════════════════════════════ */
function clearAll() {
  closeSP();
  const canvas  = document.getElementById('canvas');
  const addZone = document.getElementById('add-row-zone');
  const emptyEl = document.getElementById('empty-state');
  [...canvas.children].forEach(child => { if (child !== emptyEl && child !== addZone) child.remove(); });
  rowCnt = 0; blkCnt = 0;
  emptyEl.classList.remove('hidden');
  document.getElementById('code-out').value = '';
  _ppFrameReady = false;
  updateRightPreview('');
  showToast('Очищено', 'info');
}
document.getElementById('btn-clear').addEventListener('click', clearAll);
