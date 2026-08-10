/* ═══════════════════════════════════════════════
   TEMPLATES.JS — бібліотека готових секцій
   ───────────────────────────────────────────────
   Кожен шаблон — це звичайний рядок(и)/блоки, зібрані програмно
   через ті самі addRow()/makeBlock(), що й ручне додавання, з
   попередньо заповненими полями. Це НЕ окрема система збереження —
   шаблон один раз створює DOM-вузли так само, як користувач зробив
   би вручну, тому подальше редагування/дублювання/undo працює
   без жодних спеціальних випадків.
═══════════════════════════════════════════════ */

// Додає блок у колонку БЕЗ автовідкриття панелі налаштувань
// (на відміну від addBlockToCol(), яке одразу відкриває sp-body —
// для пакетного заповнення шаблону це було б нав'язливим).
function addBlockSilently(type, col) {
  const addBtn = col.querySelector('.add-block-btn');
  const block  = makeBlock(type);
  col.insertBefore(block, addBtn || null);
  return block;
}

function setField(block, selector, value) {
  const el = block.querySelector(selector);
  if (el) el.value = value;
}

function addTemplateTextLine(block, listSelector, text, opts = {}) {
  const list = block.querySelector(listSelector);
  if (!list) return;
  const div = document.createElement('div');
  div.innerHTML = makeTextLine(block.dataset.bid);
  const node = div.firstElementChild;
  node.querySelector('.tl-input').value = text;
  if (opts.tag) {
    const tagSel = node.querySelector('.tl-tag');
    tagSel.value = opts.tag;
    applyTagDefaults(tagSel);
  }
  if (opts.align) {
    ['tl-align-mob', 'tl-align-dsk'].forEach(cls => {
      node.querySelectorAll(`.${cls}`).forEach(b => b.classList.toggle('is-on', b.dataset.val === opts.align));
    });
  }
  list.appendChild(node);
}

const SECTION_TEMPLATES = [
  {
    key: 'hero', icon: '🏔️', label: 'Hero-секція',
    build() {
      const rw = addRow('1');
      rw.dataset.pyMob = 'py-12'; rw.dataset.pyDsk = 'py-16';
      const col = rw.querySelector('.col');
      const title = addBlockSilently('text', col);
      addTemplateTextLine(title, '.tl-list', 'Заголовок вашої пропозиції', { tag: 'h3', align: 'text-center' });
      addTemplateTextLine(title, '.tl-list', 'Короткий підзаголовок, що пояснює цінність продукту.', { align: 'text-center' });
    },
  },
  {
    key: 'features', icon: '🧱', label: 'Переваги (3 колонки)',
    build() {
      const rw = addRow('1,1,1');
      rw.dataset.pyMob = 'py-10'; rw.dataset.pyDsk = 'py-14';
      rw.querySelectorAll('.col').forEach((col, i) => {
        const t = addBlockSilently('text', col);
        addTemplateTextLine(t, '.tl-list', `Перевага ${i + 1}`, { tag: 'h3', align: 'text-center' });
        addTemplateTextLine(t, '.tl-list', 'Короткий опис цієї переваги для клієнта.', { align: 'text-center' });
      });
    },
  },
  {
    key: 'cta', icon: '📣', label: 'Заклик до дії (CTA)',
    build() {
      const rw = addRow('1');
      rw.dataset.pyMob = 'py-10'; rw.dataset.pyDsk = 'py-14';
      rw.dataset.bgColor = '#111827';
      const col = rw.querySelector('.col');
      const t = addBlockSilently('text', col);
      addTemplateTextLine(t, '.tl-list', 'Готові почати?', { tag: 'h3', align: 'text-center' });
      addTemplateTextLine(t, '.tl-list', 'Залиште заявку — ми зв’яжемося з вами протягом дня.', { align: 'text-center' });
    },
  },
  {
    key: 'footer', icon: '📄', label: 'Підвал (текст)',
    build() {
      const rw = addRow('1');
      rw.dataset.pyMob = 'py-6'; rw.dataset.pyDsk = 'py-8';
      const col = rw.querySelector('.col');
      const t = addBlockSilently('text', col);
      addTemplateTextLine(t, '.tl-list', '© 2026 Компанія. Усі права захищено.', { align: 'text-center' });
    },
  },
];

function openTemplatesModal() {
  document.getElementById('templates-overlay').classList.add('is-open');
}
function closeTemplatesModal() {
  document.getElementById('templates-overlay')?.classList.remove('is-open');
}
document.getElementById('templates-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeTemplatesModal();
});
document.getElementById('templates-modal-close').addEventListener('click', closeTemplatesModal);
document.getElementById('btn-templates').addEventListener('click', openTemplatesModal);

(function buildTemplatesGrid() {
  const grid = document.getElementById('tpl-grid');
  SECTION_TEMPLATES.forEach(tpl => {
    const card = document.createElement('div');
    card.className = 'tpl-card';
    card.innerHTML = `<div class="tpl-card-icon">${tpl.icon}</div><div class="tpl-card-label">${tpl.label}</div>`;
    card.addEventListener('click', () => {
      tpl.build();
      renumRows();
      refreshCode();
      closeTemplatesModal();
      showToast(`✓ Додано: ${tpl.label}`);
    });
    grid.appendChild(card);
  });
})();
