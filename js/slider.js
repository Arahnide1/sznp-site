/* Hero-слайдер: автопрокрутка, пауза, стрелки, точки-прогресс, счётчик 01 / 03, клавиатура, свайп */
(function () {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const slides = [...hero.querySelectorAll('.hero__slide')];
  const dots = [...hero.querySelectorAll('.hero__progress button')];
  const current = hero.querySelector('[data-hero-current]');
  const pauseBtn = hero.querySelector('[data-hero-pause]');
  const params = new URLSearchParams(location.search);
  const DURATION = 7000;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let timer = null;
  // статичный кадр (?static) — слайды не крутятся, но кнопка показывает обычную «паузу»
  const isStatic = document.documentElement.classList.contains('is-static');
  let paused = reduced || isStatic;

  hero.style.setProperty('--slide-ms', DURATION + 'ms');

  function go(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((s, i) => {
      const active = i === index;
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', String(!active));
      s.querySelectorAll('a, button').forEach((el) => (el.tabIndex = active ? 0 : -1));
    });
    dots.forEach((d, i) => {
      d.classList.remove('is-active', 'is-done');
      // перезапуск CSS-анимации полосы прогресса
      void d.offsetWidth;
      if (i < index) d.classList.add('is-done');
      if (i === index) d.classList.add('is-active');
      d.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
    if (current) current.textContent = String(index + 1).padStart(2, '0');
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    if (!paused) timer = setTimeout(() => go(index + 1), DURATION);
  }

  function setPaused(value) {
    paused = value;
    hero.classList.toggle('is-paused', paused && !isStatic);
    pauseBtn?.setAttribute('aria-pressed', String(paused));
    pauseBtn?.setAttribute('aria-label', paused ? 'Запустить слайдер' : 'Пауза');
    schedule();
  }

  hero.querySelector('[data-hero-prev]')?.addEventListener('click', () => go(index - 1));
  hero.querySelector('[data-hero-next]')?.addEventListener('click', () => go(index + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
  pauseBtn?.addEventListener('click', () => setPaused(!paused));

  hero.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(index - 1);
    if (e.key === 'ArrowRight') go(index + 1);
  });

  // свайп на тач-экранах
  let x0 = null;
  hero.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
  hero.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  // не крутим, когда вкладка скрыта
  document.addEventListener('visibilitychange', () => (document.hidden ? clearTimeout(timer) : schedule()));

  const start = parseInt(params.get('slide'), 10);
  setPaused(paused);
  go(Number.isFinite(start) ? start - 1 : 0);
})();
