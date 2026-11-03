/* Появление при скролле: [data-reveal] (opacity + translateY), [data-reveal-photo] (scale фото).
   Внутри [data-reveal-group] элементы идут с задержкой 80 мс друг за другом. */
(function () {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduced || root.classList.contains('is-static') || params.has('static')) return;

  root.classList.add('js');

  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    group.querySelectorAll('[data-reveal], [data-reveal-photo]').forEach((el, i) => {
      el.style.setProperty('--reveal-delay', i * 80 + 'ms');
    });
  });
  document.querySelectorAll('.geo__map .pin').forEach((pin, i) => {
    pin.style.setProperty('--delay', 200 + i * 220 + 'ms');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

  document.querySelectorAll('[data-reveal], [data-reveal-photo], .geo__map').forEach((el) => io.observe(el));
})();
