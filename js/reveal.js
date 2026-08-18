(() => {
  const wantsMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!wantsMotion || !('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll('.js-reveal');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  targets.forEach((el) => {
    el.classList.add('js-anim');
    observer.observe(el);
  });
})();
