(() => {
  const wantsMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canObserve = 'IntersectionObserver' in window;
  if (!wantsMotion || !canObserve) return;

  // ── Grid/list stagger reveal ─────────────────────────────────────
  const revealTargets = document.querySelectorAll('.js-reveal');
  if (revealTargets.length) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach((el) => {
      el.classList.add('js-anim');
      revealObserver.observe(el);
    });
  }

  // ── Count-up ──────────────────────────────────────────────────────
  // The target value is already the element's real textContent (e.g.
  // "42") — that's what renders if this never runs. On first scroll
  // into view, briefly replace it with a 0-to-target animation, then
  // land on the exact original string so a trailing "%" or similar
  // survives untouched.
  const countTargets = document.querySelectorAll('[data-count]');
  if (countTargets.length) {
    const countObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        const el = entry.target;
        const finalText = el.textContent;
        const target = parseFloat(el.dataset.count);
        if (Number.isNaN(target)) return;
        const suffix = finalText.replace(/^[-+]?[\d.]+/, '');
        const prefix = finalText.match(/^[-+]?/)[0];
        const start = performance.now();
        const duration = 900;
        function step(now) {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = prefix + Math.round(target * eased) + suffix;
          if (t < 1) requestAnimationFrame(step);
          else el.textContent = finalText;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });

    countTargets.forEach((el) => countObserver.observe(el));
  }
})();
