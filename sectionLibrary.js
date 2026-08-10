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
  // Щойно створений текстовий блок (makeBlock('text') → buildTextFields())
  // вже містить один порожній рядок за замовчуванням, щоб користувачу було
  // куди одразу друкувати. Коли шаблон додає СВІЙ перший рядок у той самий
  // список, той порожній рядок лишався б попереду — шаблон виглядав би так,
  // ніби починається з порожнього рядка, а вже потім іде текст. Прибираємо
  // його, але лише якщо він єдиний і справді порожній (не чіпаємо підписи
  // під фото/відео — їхні списки й так стартують порожніми, без цього рядка).
  const existing = [...list.children];
  if (existing.length === 1 && !existing[0].querySelector('.tl-input')?.value.trim()) {
    existing[0].remove();
  }
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
  if (opts.colorCls) {
    node.querySelectorAll('.tl-clr-btn').forEach(b => b.classList.toggle('is-on', b.dataset.cls === opts.colorCls));
    const hidden = node.querySelector('.tl-clr-cls');
    if (hidden) hidden.value = opts.colorCls;
  }
  if (opts.weight) {
    node.querySelectorAll('.tl-w').forEach(b => b.classList.toggle('is-on', b.dataset.val === opts.weight));
  }
  list.appendChild(node);
}

// Рядок "зображення + текст" (2 колонки, layout 1,1): заголовок(h3) +
// підзаголовок + текст в одній колонці, зображення в іншій.
//
// На мобільній верстці (grid-cols-1) колонки завжди стають одна під
// одною у DOM-порядку — тому текстова колонка ЗАВЖДИ йде першою в DOM
// (щоб на мобільній текст був згори, а зображення знизу — це те, що
// попросили для ОБОХ варіантів). Щоб на десктопі зображення могло
// опинитись ЗЛІВА (а не завжди справа, як диктував би DOM-порядок),
// використовуємо CSS order (md:order-*) — самі колонки в DOM не
// рухаємо, лише міняємо їх візуальну позицію на десктопі.
function buildImageTextRow(imageSide) {
  const rw = addRow('1,1');
  rw.dataset.pyMob = 'py-10'; rw.dataset.pyDsk = 'py-14';
  const [textCol, imgCol] = rw.querySelectorAll('.col');

  if (imageSide === 'left') {
    // setColOrder (rowSystem.js) виставляє і Tailwind-клас для експорту,
    // і інлайновий CSS order прямо на .col — щоб редактор одразу
    // показував зображення зліва, а не лише експортований код.
    setColOrder(imgCol, 1);
    setColOrder(textCol, 2);
  }
  // imageSide === 'right' — DOM-порядок (текст, зображення) вже і так
  // дає "текст зліва / зображення справа" і в редакторі, і на десктопі
  // в експорті — order не потрібен.

  const title = addBlockSilently('text', textCol);
  addTemplateTextLine(title, '.tl-list', 'Заголовок', { tag: 'h3' });
  addTemplateTextLine(title, '.tl-list', 'Підзаголовок', { weight: 'font-semibold' });
  addTemplateTextLine(title, '.tl-list', 'Текст, що розкриває деталі вашої пропозиції.', {});

  addBlockSilently('image', imgCol);
  return rw;
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
  {
    key: 'image-left-text-right', icon: '🖼️', label: 'Зображення зліва + текст справа',
    build() { buildImageTextRow('left'); },
  },
  {
    key: 'image-right-text-left', icon: '🏞️', label: 'Зображення справа + текст зліва',
    build() { buildImageTextRow('right'); },
  },
  {
    key: 'title-text-image-stack', icon: '📚', label: 'Заголовок + текст + зображення',
    build() {
      const rw = addRow('1');
      rw.dataset.pyMob = 'py-10'; rw.dataset.pyDsk = 'py-14';
      const col = rw.querySelector('.col');
      const t = addBlockSilently('text', col);
      addTemplateTextLine(t, '.tl-list', 'Заголовок', { tag: 'h3' });
      addTemplateTextLine(t, '.tl-list', 'Підзаголовок', { weight: 'font-semibold' });
      addTemplateTextLine(t, '.tl-list', 'Текст, що розкриває деталі вашої пропозиції.', {});
      addBlockSilently('image', col);
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
