(() => {
  const wantsMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Spring physics ────────────────────────────────────────────────
  // Damped-harmonic-oscillator spring, parametrized the way Apple
  // ships it: damping (1.0 = no overshoot, <1.0 = bouncier) and
  // response (settle speed in seconds) instead of raw
  // mass/stiffness/damping. Every UI motion below reads from the
  // *current* live value, so re-triggering mid-animation redirects
  // smoothly instead of snapping.
  function spring({ from, to, damping = 1, response = 0.3, epsilon = 0.01, onUpdate, onComplete }) {
    const angularFreq = (2 * Math.PI) / response;
    const stiffness = angularFreq * angularFreq;
    const dampingCoef = 2 * damping * angularFreq;
    let velocity = 0;
    let value = from;
    let lastTime = null;
    function step(now) {
      if (lastTime === null) lastTime = now;
      const dt = Math.min((now - lastTime) / 1000, 0.064);
      lastTime = now;
      const displacement = value - to;
      const accel = -stiffness * displacement - dampingCoef * velocity;
      velocity += accel * dt;
      value += velocity * dt;
      if (Math.abs(value - to) < epsilon && Math.abs(velocity) < epsilon) {
        onUpdate(to);
        if (onComplete) onComplete();
        return;
      }
      onUpdate(value);
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ── Mobile menu — spring-driven open/close ──────────────────────
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('mobile-nav');
  if (toggle && nav) {
    let navGen = 0;
    let isOpen = false;

    function setNavOpen(open) {
      isOpen = open;
      toggle.setAttribute('aria-expanded', String(open));
      const gen = ++navGen;

      if (!wantsMotion) {
        nav.style.maxHeight = open ? nav.scrollHeight + 'px' : '0px';
        nav.style.opacity = open ? '1' : '0';
        return;
      }

      const startHeight = nav.getBoundingClientRect().height;
      const startOpacity = parseFloat(getComputedStyle(nav).opacity) || (open ? 0 : 1);
      const targetHeight = open ? nav.scrollHeight : 0;

      // Sheet-like: a touch of bounce on the way open, crisp on the way shut.
      spring({
        from: startHeight, to: targetHeight, damping: open ? 0.82 : 1, response: 0.32, epsilon: 0.5,
        onUpdate: (v) => { if (gen === navGen) nav.style.maxHeight = v + 'px'; },
      });
      spring({
        from: startOpacity, to: open ? 1 : 0, damping: 1, response: 0.26, epsilon: 0.004,
        onUpdate: (v) => { if (gen === navGen) nav.style.opacity = v; },
      });
    }

    nav.style.maxHeight = '0px';
    nav.style.opacity = '0';

    toggle.addEventListener('click', () => setNavOpen(!isOpen));
    nav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => setNavOpen(false));
    });
    // A resize past the mobile breakpoint shouldn't leave the panel
    // spring-locked at a stale pixel height when it returns to mobile.
    window.addEventListener('resize', () => {
      if (!isOpen) nav.style.maxHeight = '0px';
    });
  }

  // ── Hero entrance ────────────────────────────────────────────────
  // Occasional, first-impression motion only — this runs once per page
  // load, never on repeat interaction, per the "how often will users
  // see this" rule. No CSS ever hides these elements by default: if
  // this script doesn't run, the hero stays exactly as authored.
  if (wantsMotion) {
    const heroItems = [
      ['.hero-eyebrow', 0],
      ['.hero h1', 70],
      ['.hero-sub', 130],
      ['.hero-ctas', 190],
      ['.browser-frame', 120],
    ];
    heroItems.forEach(([selector, delay]) => {
      const el = document.querySelector(selector);
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      setTimeout(() => {
        spring({
          from: 0, to: 1, damping: 1, response: 0.55, epsilon: 0.003,
          onUpdate: (v) => {
            el.style.opacity = String(v);
            el.style.transform = `translateY(${(16 * (1 - v)).toFixed(2)}px)`;
          },
          onComplete: () => { el.style.transform = ''; },
        });
      }, delay);
    });
  }

  // Scroll-reveal: only ever hides content once we've confirmed both
  // IntersectionObserver support and no reduced-motion preference —
  // otherwise .js-reveal grids stay exactly as authored (fully visible).
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
