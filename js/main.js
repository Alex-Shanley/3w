(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('mobile-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll-reveal: only ever hides content once we've confirmed both
  // IntersectionObserver support and no reduced-motion preference —
  // otherwise .js-reveal grids stay exactly as authored (fully visible).
  const wantsMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (wantsMotion && 'IntersectionObserver' in window) {
    const grids = document.querySelectorAll('.js-reveal');
    if (grids.length) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      grids.forEach((grid) => {
        grid.classList.add('reveal');
        observer.observe(grid);
      });
    }
  }
})();
