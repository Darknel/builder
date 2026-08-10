/* ═══════════════════════════════════════════════
   TRANSLATION — модалка "Перекласти на російську через AI"
   ───────────────────────────────────────────────
   Збирає всі текстові значення (.tl-input, .img-alt) з канвасу
   та з відкритої панелі налаштувань (#sp-body), перекладає їх
   через Google Translate API і підставляє назад у згенерований
   HTML. Без змін відносно оригіналу.
═══════════════════════════════════════════════ */

document.getElementById('btn-translate').addEventListener('click', () => {
  document.getElementById('translate-overlay').classList.add('is-open');
  document.getElementById('ru-html-out').value = '';
  document.getElementById('btn-copy-ru').disabled = true;
  setTranslateStatus('Готовий до перекладу', '');
});
document.getElementById('translate-modal-close').addEventListener('click', () => {
  document.getElementById('translate-overlay').classList.remove('is-open');
});
document.getElementById('translate-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) document.getElementById('translate-overlay').classList.remove('is-open');
});

function setTranslateStatus(text, type) {
  const el = document.getElementById('translate-status-text');
  el.textContent = text;
  el.style.color = type === 'error' ? 'var(--red)' : type === 'ok' ? 'var(--green)' : 'var(--t3)';
}

document.getElementById('btn-do-translate').addEventListener('click', async () => {
  const html = generateHTML();
  if (!html.trim()) { setTranslateStatus('Немає HTML для перекладу', 'error'); return; }

  // Collect all texts to translate
  // Search both #canvas AND #sp-body — when a block is open its fields move to sp-body
  const allItems = [];
  document.querySelectorAll('#canvas .tl-input, #sp-body .tl-input').forEach(ta => {
    const val = ta.value.trim();
    if (val) allItems.push({ text: val, kind: 'text' });
  });
  document.querySelectorAll('#canvas .img-alt, #sp-body .img-alt').forEach(inp => {
    const val = inp.value.trim();
    if (val) allItems.push({ text: val, kind: 'alt' });
  });
  // Текст кнопок перемикача та його заголовок — теж видимий у фінальному
  // HTML, тому має перекладатись нарівні з .tl-input/.img-alt.
  document.querySelectorAll('#canvas .sw-label, #sp-body .sw-label, #canvas .sw-title, #sp-body .sw-title').forEach(inp => {
    const val = inp.value.trim();
    if (val) allItems.push({ text: val, kind: 'sw' });
  });

  if (!allItems.length) { setTranslateStatus('Немає тексту для перекладу', 'error'); return; }

  const btn = document.getElementById('btn-do-translate');
  btn.disabled = true;
  btn.textContent = '⏳ Перекладаю…';
  setTranslateStatus('Перекладаю…', '');

  async function gtranslate(text) {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=uk&tl=ru&dt=t&q=' + encodeURIComponent(text);
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map(chunk => chunk[0]).join('');
  }

  try {
    const translations = [];
    for (let i = 0; i < allItems.length; i++) {
      setTranslateStatus(`Перекладаю ${i + 1} / ${allItems.length}…`, '');
      translations.push(await gtranslate(allItems[i].text));
    }

    // Екранування спецсимволів для безпечного використання у RegExp
    function escapeRegExp(s) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    let ruHtml = html;
    // Порядок замін — від найдовшого тексту до найкоротшого. Якщо один
    // підпис є підрядком іншого (напр. "Ціна" всередині "Ціна: 100грн"),
    // це знижує ризик, що коротший встигне замінити свій фрагмент
    // усередині довшого раніше, ніж дійде черга до самого довшого.
    const order = allItems.map((_, i) => i).sort((a, b) => allItems[b].text.length - allItems[a].text.length);
    order.forEach(i => {
      const item = allItems[i];
      const original = esc(item.text);
      const translated = esc(translations[i] || item.text);
      // Глобальна заміна — щоб перекласти ВСІ входження однакового тексту
      // (напр. однаковий підпис, що повторюється в crossfade-стеку swimage)
      ruHtml = ruHtml.replace(new RegExp(escapeRegExp(original), 'g'), translated);
    });

    document.getElementById('ru-html-out').value = ruHtml;
    document.getElementById('btn-copy-ru').disabled = false;
    setTranslateStatus('✓ Перекладено ' + translations.length + ' текстів', 'ok');

  } catch (err) {
    setTranslateStatus('Помилка: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🌐 Перекласти';
  }
});

document.getElementById('btn-copy-ru').addEventListener('click', () => {
  const code = document.getElementById('ru-html-out').value;
  if (!code) return;
  navigator.clipboard.writeText(code)
    .then(() => showToast('✓ RU HTML скопійовано'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = code; ta.style.cssText = 'position:fixed;top:-999px;opacity:0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      showToast('✓ RU HTML скопійовано');
    });
});
