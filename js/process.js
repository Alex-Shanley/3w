(() => {
  const pin = document.querySelector('.process-pin');
  if (!pin) return;

  const wantsMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fill = pin.querySelector('.process-progress-fill');
  const steps = Array.from(pin.querySelectorAll('.process-step'));

  let pinned = false;
  let ticking = false;

  const shouldPin = () => wantsMotion && window.innerWidth >= 900;

  function update() {
    ticking = false;
    if (!pinned) return;
    const rect = pin.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const progress = scrollable > 0
      ? Math.min(1, Math.max(0, -rect.top / scrollable))
      : 0;
    fill.style.width = (progress * 100).toFixed(2) + '%';
    const active = Math.min(steps.length - 1, Math.floor(progress * steps.length));
    steps.forEach((step, i) => step.classList.toggle('is-active', i === active));
  }

  function requestUpdate() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }

  function setPinned(on) {
    if (on === pinned) return;
    pinned = on;
    pin.classList.toggle('is-pinned', on);
    if (on) {
      steps.forEach((step, i) => step.classList.toggle('is-active', i === 0));
      requestUpdate();
    } else {
      steps.forEach((step) => step.classList.remove('is-active'));
      fill.style.width = '0%';
    }
  }

  setPinned(shouldPin());
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', () => setPinned(shouldPin()));
})();
