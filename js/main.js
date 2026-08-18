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

  // ── Page transitions ─────────────────────────────────────────────
  // A static multi-page site can still feel like one continuous
  // experience: cover the viewport on the way out, let the next
  // page's own load-time reveal uncover it — the two halves of one
  // wipe, stitched across a real navigation.
  if (wantsMotion) {
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('is-hidden'));
    });

    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest('a');
      if (!link || !link.href || link.target === '_blank' || link.hasAttribute('download')) return;
      let url;
      try { url = new URL(link.href, location.href); } catch { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return; // same-page anchor
      e.preventDefault();
      overlay.classList.remove('is-hidden');
      setTimeout(() => { location.href = link.href; }, 420);
    });
  }

  // ── Magnetic cursor ──────────────────────────────────────────────
  // Fine-pointer devices only — touch fires synthetic hover/click
  // events that would leave a phantom cursor on screen.
  if (wantsMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.append(ring, dot);
    document.body.classList.add('has-custom-cursor');

    let ringX = window.innerWidth / 2;
    let ringY = window.innerHeight / 2;
    let targetX = ringX;
    let targetY = ringY;
    let shown = false;

    document.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      dot.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;
      if (!shown) { shown = true; ring.classList.add('is-visible'); dot.classList.add('is-visible'); }
    });
    document.addEventListener('mouseleave', () => {
      shown = false;
      ring.classList.remove('is-visible');
      dot.classList.remove('is-visible');
    });

    // The ring trails the dot with a spring for weight; re-reads its
    // own live position each frame so it never snaps when the pointer
    // changes direction mid-flight.
    function trackRing() {
      const dx = targetX - ringX;
      const dy = targetY - ringY;
      ringX += dx * 0.18;
      ringY += dy * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(trackRing);
    }
    requestAnimationFrame(trackRing);

    const magneticTargets = document.querySelectorAll('.btn, .card-hover, .link-arrow, .menu-toggle');
    magneticTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
      el.addEventListener('mouseleave', () => {
        ring.classList.remove('is-active');
        el.style.transform = '';
      });
    });

    // Magnetic pull on buttons and the arrow-links specifically — pulling
    // an entire service card toward the cursor would fight its own
    // hover-lift transform, so scope the pull to the smaller, discrete
    // targets it reads well on. Pull and the CSS :active press-scale
    // both want to own `transform`, and inline style always wins over
    // the stylesheet — so press state is folded into this same inline
    // transform rather than left to CSS, or a click would lose its
    // press feedback the moment the pointer had moved at all.
    const pullTargets = document.querySelectorAll('.btn, .link-arrow');
    pullTargets.forEach((el) => {
      let relX = 0;
      let relY = 0;
      let pressed = false;
      const apply = () => {
        const scale = pressed ? 0.97 : 1;
        el.style.transform = `translate(${relX}px, ${relY}px) scale(${scale})`;
      };
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        relX = (e.clientX - (rect.left + rect.width / 2)) * 0.25;
        relY = (e.clientY - (rect.top + rect.height / 2)) * 0.3;
        apply();
      });
      el.addEventListener('mousedown', () => { pressed = true; apply(); });
      el.addEventListener('mouseup', () => { pressed = false; apply(); });
      el.addEventListener('mouseleave', () => { relX = 0; relY = 0; pressed = false; el.style.transform = ''; });
    });
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
      ['.hero-bg img', 0],
      ['.hero-eyebrow', 120],
      ['.hero-headline', 180],
      ['.hero-sub', 240],
      ['.hero-ctas', 300],
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

  // ── Headline text reveal ─────────────────────────────────────────
  // Section headings mask-reveal (slide up out of a clipped box) on
  // first scroll into view. Wraps the heading's existing markup in an
  // inline span at runtime — no HTML authoring changes needed per
  // page — and only touches the DOM once IntersectionObserver support
  // and motion preference are confirmed, same safety pattern as above.
  if (wantsMotion && 'IntersectionObserver' in window) {
    const headings = document.querySelectorAll('.section h2, .section-tight h2');
    headings.forEach((h) => {
      if (!h.textContent.trim()) return;
      const inner = document.createElement('span');
      inner.className = 'text-reveal-inner';
      inner.innerHTML = h.innerHTML;
      h.innerHTML = '';
      h.appendChild(inner);
      h.classList.add('text-reveal');
    });
    if (headings.length) {
      const headingObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      headings.forEach((h) => headingObserver.observe(h));
    }
  }
})();
