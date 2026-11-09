/* Каталог: поиск, фильтры, вид, «показать ещё» */
(function () {
  var DATA = window.SZNP_CATALOG || [];
  var root = document.querySelector('[data-catalog]');
  if (!root || !DATA.length) return;

  var PAGE = 24;
  var TYPES = [
    ['seals', 'Уплотнения и кольца'],
    ['kits', 'Ремкомплекты'],
    ['hydraulics', 'Гидроцилиндры и гидравлика'],
    ['lines', 'Трубки, шланги, соединения'],
    ['mech', 'Валы, втулки, механика'],
    ['plates', 'Плиты и изнашиваемые детали'],
    ['other', 'Другие детали']
  ];
  var BRAND_GROUPS = [
    ['Горно-шахтная техника', ['Sandvik', 'Epiroc', 'Normet', 'Atlas Copco']],
    ['Карьерная техника', ['Komatsu', 'CAT', 'TEREX']],
    ['Торкрет-установки', ['Aliva', 'Торнадо', 'Putzmeister', 'Meyco']]
  ];
  // Переходы с главной: catalog.html#seals и т. п.
  var PRESETS = {
    seals: { type: ['seals', 'kits'] },
    hydraulics: { type: ['hydraulics', 'lines'] },
    materials: { type: ['seals', 'plates'] },
    shotcrete: { brand: ['Aliva', 'Торнадо', 'Putzmeister', 'Meyco'] }
  };
  var TYPE_NAME = {}; TYPES.forEach(function (t) { TYPE_NAME[t[0]] = t[1]; });

  /* ---------- Данные ---------- */
  function norm(s) { return String(s).toLowerCase().replace(/ё/g, 'е'); }
  function squash(s) { return norm(s).replace(/[\s\-–./]+/g, ''); }
  var items = DATA.map(function (r, i) {
    return { i: i, code: r[0], name: r[1], brand: r[2], model: r[3], type: r[4], img: r[5],
      text: norm(r[1] + ' ' + r[2] + ' ' + r[3] + ' ' + TYPE_NAME[r[4]]), codeKey: squash(r[0]) };
  });
  var brandCount = {}; items.forEach(function (it) { brandCount[it.brand] = (brandCount[it.brand] || 0) + 1; });
  var grouped = {}; BRAND_GROUPS.forEach(function (g) { g[1].forEach(function (b) { grouped[b] = 1; }); });
  var otherBrands = Object.keys(brandCount).filter(function (b) { return !grouped[b]; })
    .sort(function (a, b) { return a === 'Без марки' ? 1 : b === 'Без марки' ? -1 : brandCount[b] - brandCount[a]; });

  /* ---------- Состояние ---------- */
  var state = { q: '', type: [], brand: [], photo: false, sort: 'default', view: 'grid', shown: PAGE };

  function readUrl() {
    var p = new URLSearchParams(location.search);
    state.q = p.get('q') || '';
    state.type = (p.get('type') || '').split(',').filter(function (t) { return TYPE_NAME[t]; });
    state.brand = (p.get('brand') || '').split(',').filter(function (b) { return brandCount[b]; });
    state.photo = p.get('photo') === '1';
    state.sort = p.get('sort') || 'default';
    state.view = p.get('view') === 'list' ? 'list' : 'grid';
    var h = location.hash.slice(1);
    if (PRESETS[h] && !['q', 'type', 'brand', 'photo'].some(function (k) { return p.has(k); })) {
      state.type = (PRESETS[h].type || []).slice();
      state.brand = (PRESETS[h].brand || []).slice();
    }
  }
  function writeUrl() {
    var p = new URLSearchParams(location.search);
    function set(k, v) { if (v) p.set(k, v); else p.delete(k); }
    set('q', state.q.trim()); set('type', state.type.join(',')); set('brand', state.brand.join(','));
    set('photo', state.photo ? '1' : ''); set('sort', state.sort === 'default' ? '' : state.sort);
    set('view', state.view === 'list' ? 'list' : '');
    var qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  /* ---------- Фильтрация ---------- */
  function tokens() { return norm(state.q).split(/\s+/).filter(Boolean); }
  function matchQ(it, toks) {
    for (var k = 0; k < toks.length; k++) {
      var t = toks[k], tk = squash(t);
      if (it.text.indexOf(t) === -1 && !(tk && it.codeKey.indexOf(tk) !== -1)) return false;
    }
    return true;
  }
  function filter(skip) {
    var toks = tokens();
    return items.filter(function (it) {
      if (state.photo && !it.img) return false;
      if (skip !== 'type' && state.type.length && state.type.indexOf(it.type) === -1) return false;
      if (skip !== 'brand' && state.brand.length && state.brand.indexOf(it.brand) === -1) return false;
      return !toks.length || matchQ(it, toks);
    });
  }
  function sorted(list) {
    var l = list.slice();
    if (state.sort === 'name') l.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru') || a.i - b.i; });
    else if (state.sort === 'code') l.sort(function (a, b) { return a.code.localeCompare(b.code, 'ru', { numeric: true }); });
    else if (state.sort === 'brand') l.sort(function (a, b) { return a.brand.localeCompare(b.brand, 'ru') || a.i - b.i; });
    return l;
  }

  /* ---------- Разметка ---------- */
  var ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
  };
  // Заглушки по типу изделия, когда у позиции нет фото
  var PH = {
    seals: '<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="13"/>',
    kits: '<circle cx="22" cy="24" r="12"/><circle cx="22" cy="24" r="6"/><circle cx="44" cy="40" r="14"/><circle cx="44" cy="40" r="8"/><circle cx="20" cy="47" r="6"/>',
    hydraulics: '<rect x="6" y="24" width="32" height="16" rx="3"/><path d="M38 32h18M14 24v-5M30 24v-5"/><circle cx="58" cy="32" r="3"/>',
    lines: '<path d="M6 44h14a10 10 0 0 0 10-10v-4a10 10 0 0 1 10-10h18"/><path d="M6 38v12M58 14v12"/>',
    mech: '<circle cx="32" cy="32" r="9"/><path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M15 49l6-6M43 21l6-6"/>',
    plates: '<rect x="8" y="14" width="48" height="36" rx="4"/><circle cx="18" cy="24" r="3"/><circle cx="46" cy="24" r="3"/><circle cx="18" cy="40" r="3"/><circle cx="46" cy="40" r="3"/>',
    other: '<path d="M32 6 54 18v28L32 58 10 46V18z"/><path d="M10 18l22 12 22-12M32 30v28"/>'
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hl(s, toks) {
    var out = esc(s);
    toks.forEach(function (t) {
      if (t.length < 2) return;
      var re = new RegExp('(' + esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/е/g, '[её]') + ')', 'gi');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }
  function card(it, n, toks) {
    var media = it.img
      ? '<img src="img/catalog/' + it.img + '.jpg" alt="' + esc(it.name + ' ' + it.brand) + '" width="480" height="480" loading="lazy" decoding="async">'
      : '<div class="pc__ph"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PH[it.type] + '</svg><span>Фото по запросу</span></div>';
    return '<article class="pc" style="--i:' + n + '">' +
      '<div class="pc__img">' + media + '</div>' +
      '<div class="pc__body">' +
        '<span class="pc__brand">' + esc(it.brand) + (it.model ? ' <i>· ' + esc(it.model) + '</i>' : '') + '</span>' +
        '<h3 class="pc__name">' + hl(it.name, toks) + '</h3>' +
        '<button class="pc__code" type="button" data-copy="' + esc(it.code) + '" title="Скопировать код">Код <b>' + hl(it.code, toks) + '</b>' + ICON.copy + '</button>' +
      '</div>' +
      '<a class="pc__cta" href="#contacts" data-ask="' + it.i + '"><span>Запросить цену</span>' + ICON.arrow + '</a>' +
    '</article>';
  }
  function plural(n, a, b, c) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; }

  /* ---------- Фильтры: построение ---------- */
  var $ = function (s) { return root.querySelector(s); };
  var form = $('.filters');
  function opt(name, value, label, count) {
    return '<label class="opt" data-opt="' + name + ':' + esc(value) + '"><input type="checkbox" name="' + name + '" value="' + esc(value) + '">' +
      '<span class="opt__box">' + ICON.check + '</span><span class="opt__name">' + esc(label) + '</span><span class="opt__count">' + count + '</span></label>';
  }
  $('[data-types]').innerHTML = TYPES.map(function (t) { return opt('type', t[0], t[1], 0); }).join('');
  $('[data-brands]').innerHTML = BRAND_GROUPS.map(function (g) {
    return '<p class="fgroup__sub">' + g[0] + '</p>' + g[1].map(function (b) { return opt('brand', b, b, 0); }).join('');
  }).join('') + '<div class="more-list" id="more-brands" hidden><p class="fgroup__sub">Другие</p>' +
    otherBrands.map(function (b) { return opt('brand', b, b, 0); }).join('') + '</div>' +
    '<button class="more-toggle" type="button" aria-expanded="false" aria-controls="more-brands"><span>Ещё ' + otherBrands.length + ' ' + plural(otherBrands.length, 'марка', 'марки', 'марок') + '</span>' + ICON.chevron + '</button>';

  var moreBtn = $('.more-toggle'), moreList = $('#more-brands');
  moreBtn.addEventListener('click', function () {
    var open = moreList.hidden; moreList.hidden = !open; moreBtn.setAttribute('aria-expanded', open);
    moreBtn.firstChild.textContent = open ? 'Свернуть' : 'Ещё ' + otherBrands.length + ' ' + plural(otherBrands.length, 'марка', 'марки', 'марок');
  });

  /* ---------- Отрисовка ---------- */
  var grid = $('.grid'), more = $('.more'), empty = $('.empty'), chips = $('.chips');
  var countEl = $('.toolbar__count'), searchInput = root.querySelector('[data-search]') || document.querySelector('[data-search]');
  var clearBtn = document.querySelector('[data-search-clear]');
  var list = [];

  function syncControls() {
    form.querySelectorAll('input[name=type]').forEach(function (i) { i.checked = state.type.indexOf(i.value) !== -1; });
    form.querySelectorAll('input[name=brand]').forEach(function (i) { i.checked = state.brand.indexOf(i.value) !== -1; });
    form.querySelector('input[name=photo]').checked = state.photo;
    $('[data-sort]').value = state.sort;
    root.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.view === state.view); });
    grid.classList.toggle('is-list', state.view === 'list');
    if (searchInput && searchInput.value !== state.q) searchInput.value = state.q;
    if (clearBtn) clearBtn.hidden = !state.q;
    if (otherBrands.some(function (b) { return state.brand.indexOf(b) !== -1; }) && moreList.hidden) moreBtn.click();
  }
  function counts() {
    function tally(arr, key) { var c = {}; arr.forEach(function (it) { c[it[key]] = (c[it[key]] || 0) + 1; }); return c; }
    var tc = tally(filter('type'), 'type'), bc = tally(filter('brand'), 'brand');
    form.querySelectorAll('.opt').forEach(function (o) {
      var p = o.dataset.opt.split(':'), n = (p[0] === 'type' ? tc : bc)[p.slice(1).join(':')] || 0;
      o.querySelector('.opt__count').textContent = n;
      o.classList.toggle('is-zero', !n);
    });
  }
  function renderChips() {
    var h = [];
    if (state.q.trim()) h.push('<button class="chip" type="button" data-rm="q">«' + esc(state.q.trim()) + '»' + ICON.x + '</button>');
    state.type.forEach(function (t) { h.push('<button class="chip" type="button" data-rm="type:' + t + '">' + TYPE_NAME[t] + ICON.x + '</button>'); });
    state.brand.forEach(function (b) { h.push('<button class="chip" type="button" data-rm="brand:' + esc(b) + '">' + esc(b) + ICON.x + '</button>'); });
    if (state.photo) h.push('<button class="chip" type="button" data-rm="photo">С фото' + ICON.x + '</button>');
    if (h.length > 1) h.push('<button class="chip chip--reset" type="button" data-rm="all">Сбросить всё</button>');
    chips.innerHTML = h.join('');
    var n = state.type.length + state.brand.length + (state.photo ? 1 : 0);
    document.querySelectorAll('[data-filters-count]').forEach(function (b) { b.textContent = n || ''; });
  }
  function renderCards(from) {
    var toks = tokens(), slice = list.slice(from, state.shown);
    var html = slice.map(function (it, k) { return card(it, k, toks); }).join('');
    if (from) grid.insertAdjacentHTML('beforeend', html); else grid.innerHTML = html;
    var shown = Math.min(state.shown, list.length);
    more.hidden = shown >= list.length;
    more.querySelector('.more__text').textContent = 'Показано ' + shown + ' из ' + list.length;
    more.querySelector('.more__bar i').style.width = (list.length ? shown / list.length * 100 : 0) + '%';
  }
  function render(keepUrl) {
    list = sorted(filter());
    state.shown = PAGE;
    countEl.innerHTML = list.length + ' <span>' + plural(list.length, 'позиция', 'позиции', 'позиций') + '</span>';
    empty.hidden = !!list.length;
    grid.hidden = !list.length;
    renderCards(0);
    counts(); renderChips(); syncControls();
    var applyN = document.querySelector('[data-apply-count]');
    if (applyN) applyN.textContent = 'Показать ' + list.length;
    if (!keepUrl) writeUrl();
  }
  function scrollToResults() {
    var top = root.getBoundingClientRect().top + scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--h-mainbar')) || 88) - 16;
    if (scrollY > top + 40) scrollTo({ top: top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  /* ---------- События ---------- */
  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'photo') state.photo = t.checked;
    else if (t.name === 'type' || t.name === 'brand') {
      state[t.name] = Array.prototype.filter.call(form.querySelectorAll('input[name=' + t.name + ']:checked'), function () { return 1; }).map(function (i) { return i.value; });
    }
    render();
  });
  root.querySelectorAll('[data-reset]').forEach(function (b) {
    b.addEventListener('click', function () { state.type = []; state.brand = []; state.photo = false; state.q = ''; render(); });
  });
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rm]'); if (!b) return;
    var r = b.dataset.rm, k = r.split(':')[0], v = r.slice(k.length + 1);
    if (r === 'all') { state.type = []; state.brand = []; state.photo = false; state.q = ''; }
    else if (k === 'q') state.q = '';
    else if (k === 'photo') state.photo = false;
    else state[k] = state[k].filter(function (x) { return x !== v; });
    render();
  });
  $('[data-sort]').addEventListener('change', function (e) { state.sort = e.target.value; render(); });
  root.querySelectorAll('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () { state.view = b.dataset.view; syncControls(); writeUrl(); renderCards(0); });
  });
  more.querySelector('button').addEventListener('click', function () { var f = state.shown; state.shown += PAGE; renderCards(f); });

  // Поиск — живой, с небольшой задержкой
  var tmr;
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(tmr);
      if (clearBtn) clearBtn.hidden = !searchInput.value;
      tmr = setTimeout(function () { state.q = searchInput.value; render(); }, 180);
    });
    searchInput.form && searchInput.form.addEventListener('submit', function (e) {
      e.preventDefault(); clearTimeout(tmr); state.q = searchInput.value; render(); scrollToResults(); searchInput.blur();
    });
  }
  if (clearBtn) clearBtn.addEventListener('click', function () { state.q = ''; render(); searchInput.focus(); });
  document.querySelectorAll('[data-quick]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.dataset.quick;
      if (brandCount[v]) { state.brand = [v]; state.q = ''; } else { state.q = v; }
      render(); scrollToResults();
    });
  });

  // Копирование кода
  var toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast);
  var toastT;
  function say(msg) { toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('is-on'); }, 1800); }
  grid.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]');
    if (c) {
      var code = c.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(function () {
        c.classList.add('is-copied'); setTimeout(function () { c.classList.remove('is-copied'); }, 1500);
        say('Код ' + code + ' скопирован');
      }, function () { say('Код: ' + code); });
      return;
    }
    var a = e.target.closest('[data-ask]');
    if (a) {
      var it = items[+a.dataset.ask], ta = document.getElementById('f-task');
      if (ta) {
        ta.value = 'Запрос по каталогу: ' + it.name + ', ' + it.brand + (it.model ? ' ' + it.model : '') + ', код ' + it.code + '.\nКоличество: ';
        var f = ta.closest('.field'); if (f) { f.classList.remove('is-filled'); void f.offsetWidth; f.classList.add('is-filled'); }
        setTimeout(function () { ta.focus({ preventScroll: true }); ta.setSelectionRange(ta.value.length, ta.value.length); }, 700);
      }
    }
  });

  // Мобильная шторка фильтров
  var scrim = document.createElement('div'); scrim.className = 'scrim'; document.body.appendChild(scrim);
  var opener;
  function sheet(open) {
    form.classList.toggle('is-open', open); scrim.classList.toggle('is-on', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) { opener = document.activeElement; setTimeout(function () { form.querySelector('.filters__close').focus(); }, 50); }
    else if (opener) opener.focus();
  }
  root.querySelectorAll('[data-filters-open]').forEach(function (b) { b.addEventListener('click', function () { sheet(true); }); });
  root.querySelectorAll('[data-filters-close]').forEach(function (b) { b.addEventListener('click', function () { sheet(false); scrollToResults(); }); });
  scrim.addEventListener('click', function () { sheet(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && form.classList.contains('is-open')) sheet(false); });

  addEventListener('hashchange', function () { if (PRESETS[location.hash.slice(1)]) { readUrl(); render(); } });

  readUrl();
  render(true);
})();
