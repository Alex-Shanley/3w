(() => {
  const wantsMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Spring physics ────────────────────────────────────────────────
  // Damped-harmonic-oscillator spring, parametrized the way Apple
  // ships it: damping (1.0 = no overshoot, <1.0 = bouncier) and
  // response (settle speed in seconds) instead of raw
  // mass/stiffness/damping.
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
  // wipe, stitched across a real navigation. The overlay itself is
  // static markup (first thing in <body> on every page, opaque by
  // default in CSS with no JS dependency) rather than JS-created, so
  // there's no race where the page paints once, unmasked, before this
  // script gets a chance to cover it.
  const overlay = document.querySelector('.page-transition-overlay');
  if (overlay && wantsMotion) {
    // rAF is suspended for hidden/backgrounded tabs, and this overlay
    // starts opaque over the whole page — so the reveal also needs a
    // path that doesn't depend on rAF ever firing, or a page opened in
    // a background tab would stay covered indefinitely.
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      overlay.classList.add('is-hidden');
    };
    requestAnimationFrame(() => requestAnimationFrame(reveal));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reveal();
    });
    setTimeout(reveal, 1000);

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
  } else if (overlay) {
    // Motion off: skip the wipe, but the overlay still starts opaque
    // per its base CSS, so it must be hidden immediately or it would
    // permanently cover the page.
    overlay.classList.add('is-hidden');
  }

  // ── Magnetic buttons ──────────────────────────────────────────────
  // Fine-pointer devices only — touch has no continuous mousemove to
  // pull the pointer position from.
  if (wantsMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    // Magnetic pull on buttons and arrow-links specifically — pulling
    // an entire card toward the cursor would fight its own hover-lift
    // transform, so scope the pull to smaller, discrete targets it
    // reads well on. Pull and the CSS :active press-scale both want to
    // own `transform`, and inline style always wins over the
    // stylesheet — so press state is folded into this same inline
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

  // ── Headline text reveal ─────────────────────────────────────────
  // Section headings mask-reveal (slide up out of a clipped box) on
  // first scroll into view. Wraps the heading's existing markup in an
  // inline span at runtime — no HTML authoring changes needed per
  // page — same slide-out-of-a-clipped-box technique the hero
  // headline already uses, just driven by scroll instead of load.
  if (wantsMotion && 'IntersectionObserver' in window) {
    const headings = document.querySelectorAll('.section h2, .section-tight h2, .page-intro h1');
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

  // ── Statement moment ─────────────────────────────────────────────
  // The lines are authored already-split in the markup (unlike the
  // headings above, which get wrapped at runtime), so this only has to
  // opt the block into its hidden start state and then release it.
  if (wantsMotion && 'IntersectionObserver' in window) {
    const statements = document.querySelectorAll('.statement');
    statements.forEach((el) => el.classList.add('js-anim'));
    if (statements.length) {
      const obs = new IntersectionObserver((entries, o) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            o.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      statements.forEach((el) => obs.observe(el));
    }
  }

  // ── Card tilt ────────────────────────────────────────────────────
  // Pointer-reactive perspective tilt on the bento tiles and work
  // cards — a richer version of the hover-lift those already have.
  // Fine-pointer only: touch has no hover to tilt from.
  //
  // The existing CSS :hover rules set transform: translateY(-4px), and
  // an inline transform always beats the stylesheet, so the lift has
  // to be folded into the value written here — otherwise hovering
  // would cancel the very lift it's supposed to build on. Clearing the
  // inline style on leave hands control back to CSS, which by then no
  // longer matches anyway since the pointer has gone.
  if (wantsMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const MAX_TILT = 6; // degrees — subtle; beyond this it reads as a gimmick
    document.querySelectorAll('.process-step, .work-card-lg, .work-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;  // -0.5 … 0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        const rotY = (px * MAX_TILT * 2).toFixed(2);
        const rotX = (-py * MAX_TILT * 2).toFixed(2);
        card.style.transform =
          `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }
})();
