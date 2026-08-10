/* ═══════════════════════════════════════════════
   COPY CODE — кнопка "Скопіювати HTML"
   Без змін відносно оригіналу.
═══════════════════════════════════════════════ */

/* ─── Copy HTML ──────────────────────────────── */
function copyHTML() {
  const rawCode = document.getElementById('code-out').value;
  if (!rawCode) { showToast('Немає HTML для копіювання', 'error'); return; }
  const standalone = document.getElementById('standalone-toggle')?.checked;
  const code = standalone ? wrapStandaloneHTML(rawCode) : rawCode;
  navigator.clipboard.writeText(code)
    .then(() => showToast('✓ HTML скопійовано'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = code; ta.style.cssText = 'position:fixed;top:-999px;opacity:0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      showToast('✓ HTML скопійовано');
    });
}

document.getElementById('btn-copy').addEventListener('click', copyHTML);
document.getElementById('btn-copy-drawer').addEventListener('click', copyHTML);
