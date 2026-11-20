/* RU / EN без перезагрузки. Словари — i18n/ru.js и i18n/en.js (window.SZNP_I18N).
   Словари в JS, а не JSON: страницы должны открываться двойным кликом (file://), где fetch запрещён. */
(function () {
  const dict = window.SZNP_I18N || {};
  const KEY = 'sznp-lang';
  const params = new URLSearchParams(location.search);

  // Тексты RU берём прямо из разметки, чтобы HTML без JS оставался полным
  const nodes = document.querySelectorAll('[data-i18n], [data-i18n-attr]');
  nodes.forEach((el) => {
    if (el.dataset.i18n) el.dataset.i18nRu = el.innerHTML;
  });

  function readSaved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) { /* приватный режим */ }
  }
const ruTitle = document.title;
const pageKey = 'title.' + ((location.pathname.split('/').pop() || 'index.html').replace(/\.html$/i, '') || 'index');

  function apply(lang) {
    const table = dict[lang] || {};
    nodes.forEach((el) => {
      const key = el.dataset.i18n;
      if (key) el.innerHTML = lang === 'ru' ? el.dataset.i18nRu : (table[key] ?? el.dataset.i18nRu);
      // data-i18n-attr="aria-label:key;placeholder:key2"
      if (el.dataset.i18nAttr) {
        el.dataset.i18nAttr.split(';').forEach((pair) => {
          const [attr, k] = pair.split(':');
          const ruAttr = 'i18nRu' + attr.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
          if (!(ruAttr in el.dataset)) el.dataset[ruAttr] = el.getAttribute(attr) || '';
          el.setAttribute(attr, lang === 'ru' ? el.dataset[ruAttr] : (table[k] ?? el.dataset[ruAttr]));
        });
      }
    });
    document.documentElement.lang = lang;
    document.querySelectorAll('.lang__btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
document.title = lang === 'ru' ? ruTitle : (table[pageKey] ?? ruTitle);
document.querySelectorAll('[data-file-name]').forEach((el) => {
if (!el.dataset.ruEmpty) el.dataset.ruEmpty = el.dataset.empty || el.textContent;
const val = lang === 'ru' ? el.dataset.ruEmpty : (table['form.file.hint'] ?? el.dataset.ruEmpty);
const isDefault = el.textContent.trim() === (el.dataset.empty || '').trim();
el.dataset.empty = val;
if (isDefault) el.textContent = val;
});
document.querySelectorAll('.map-links a').forEach((a) => {
const node = [...a.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim());
if (!node) return;
if (!a.dataset.ruMap) a.dataset.ruMap = node.nodeValue.trim();
const key = a.dataset.ruMap.includes('2ГИС') ? 'map.2gis' : 'map.yandex';
node.nodeValue = lang === 'ru' ? a.dataset.ruMap : (table[key] ?? a.dataset.ruMap);
});
    window.dispatchEvent(new CustomEvent('sznp:lang', { detail: lang }));
  }

  const initial = params.get('lang') || readSaved() || 'ru';
  apply(initial === 'en' ? 'en' : 'ru');

  document.querySelectorAll('.lang__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      apply(btn.dataset.lang);
      save(btn.dataset.lang);
    });
  });
})();
