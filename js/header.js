/* Шапка: тень при скролле, выпадающее меню, бургер */
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const params = new URLSearchParams(location.search);
  // ?variant=b и ?menu=open (статичный кадр) применяются ещё в <head>, см. инлайн-скрипт на странице

  // Тень у закреплённой шапки
  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 4);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Выпадающие пункты
  const items = header.querySelectorAll('.nav__item--drop');
  const desktop = window.matchMedia('(min-width: 1024px) and (hover: hover)');

  items.forEach((item) => {
    const toggle = item.querySelector('.nav__toggle');
    const panel = item.querySelector('.dropdown');
    let closeTimer;

    const open = () => {
      clearTimeout(closeTimer);
      items.forEach((other) => other !== item && close(other));
      item.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    };
    const closeSelf = () => close(item);

    toggle.addEventListener('click', () => (item.classList.contains('is-open') ? closeSelf() : open()));

    item.addEventListener('mouseenter', () => desktop.matches && open());
    item.addEventListener('mouseleave', () => {
      if (desktop.matches) closeTimer = setTimeout(closeSelf, 160);
    });

    // Клавиатура: стрелка вниз открывает и ставит фокус на первый пункт, Esc закрывает
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        open();
        panel.querySelector('a')?.focus();
      }
    });
    panel.addEventListener('keydown', (e) => {
      const links = [...panel.querySelectorAll('.dropdown__link')];
      const i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); links[(i + 1) % links.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
    });
    item.addEventListener('focusout', (e) => {
      if (!item.contains(e.relatedTarget)) closeSelf();
    });

    if (params.get('menu') === 'open') open();
  });

  function close(item) {
    item.classList.remove('is-open');
    item.querySelector('.nav__toggle').setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    items.forEach((item) => {
      if (item.classList.contains('is-open')) {
        close(item);
        item.querySelector('.nav__toggle').focus();
      }
    });
  });
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) items.forEach(close);
  });

  // Бургер
  const burger = header.querySelector('.burger');
  burger?.addEventListener('click', () => {
    const isOpen = header.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
})();
