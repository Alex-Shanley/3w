(() => {
  // ── Grid debug overlay ───────────────────────────────────────────
  // ?grid on any URL renders the live 12/6/4-col grid + an 8px baseline
  // rule so every section's alignment can be checked against the real
  // thing, not a screenshot held up next to a spec.
  if (new URLSearchParams(location.search).has('grid')) {
    const cols = document.createElement('div');
    cols.className = 'debug-grid-overlay';
    cols.innerHTML = '<div class="container"><div class="grid-12"></div></div>';
    const grid = cols.querySelector('.grid-12');
    for (let i = 0; i < 12; i++) {
      const col = document.createElement('div');
      col.className = 'col';
      grid.appendChild(col);
    }
    const baseline = document.createElement('div');
    baseline.className = 'debug-grid-baseline';
    document.body.append(cols, baseline);
  }

  // ── Header scroll hairline ───────────────────────────────────────
  const header = document.querySelector('.site-header');
  if (header) {
    let ticking = false;
    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  // ── Mobile menu — native <details> already handles open/close and
  // every link with zero JS. This only layers on the focus trap,
  // Escape-to-close, closing on link click, and locking background
  // scroll while open. ─────────────────────────────────────────────
  document.querySelectorAll('.mobile-menu').forEach((details) => {
    const panel = details.querySelector('.mobile-menu-panel');
    const summary = details.querySelector('summary');
    if (!panel || !summary) return;

    details.addEventListener('toggle', () => {
      if (details.open) {
        document.body.style.overflow = 'hidden';
        panel.querySelector('a')?.focus();
      } else {
        document.body.style.overflow = '';
      }
    });

    panel.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => { details.open = false; });
    });

    details.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        details.open = false;
        summary.focus();
        return;
      }
      if (e.key !== 'Tab' || !details.open) return;
      const focusable = Array.from(panel.querySelectorAll('a, button'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  });

  // ── Hero entrance ─────────────────────────────────────────────────
  // Default CSS state (no js-anim class) is already the final, fully
  // visible layout — js-anim opts the hero INTO a hidden starting
  // point, then is-revealed animates it back to that same default.
  // If this never runs, the hero is simply static, never invisible.
  const wantsMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (wantsMotion) {
    const hero = document.querySelector('.hero');
    const headline = document.querySelector('.hero-headline');
    [hero, headline].forEach((el) => el?.classList.add('js-anim'));
    if (hero || headline) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          [hero, headline].forEach((el) => el?.classList.add('is-revealed'));
        });
      });
    }
  }

  // ── Theme toggle ─────────────────────────────────────────────────
  // The FOUC-preventing inline snippet in <head> already set data-theme
  // from sessionStorage/system preference before first paint. This
  // wires up any .theme-toggle control to flip and persist the choice,
  // and syncs aria-pressed to the effective theme up front — otherwise
  // a screen reader hitting the button before any click sees no
  // pressed state at all, regardless of which theme actually loaded.
  const isDarkNow = () => document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.getAttribute('data-theme') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(isDarkNow()));
    btn.addEventListener('click', () => {
      const root = document.documentElement;
      const next = isDarkNow() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { sessionStorage.setItem('3w-theme', next); } catch {}
      document.querySelectorAll('.theme-toggle').forEach((b) => b.setAttribute('aria-pressed', String(next === 'dark')));
    });
  });

  // ── Live Dublin clock ─────────────────────────────────────────────
  // Always the studio's own local time, regardless of the visitor's
  // timezone — a small, honest, low-cost detail; updates once a minute.
  // The footer prints the full label; the hero sits inside a longer
  // sentence and only wants the city and time, so each target says
  // which form it needs rather than the clock guessing from position.
  const clocks = document.querySelectorAll('.footer-clock, .js-clock');
  if (clocks.length) {
    const formatter = new Intl.DateTimeFormat('en-IE', {
      timeZone: 'Europe/Dublin', hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const update = () => {
      const time = formatter.format(new Date());
      clocks.forEach((el) => {
        el.textContent = el.classList.contains('footer-clock')
          ? `${time} IST/GMT · Dublin`
          : `Dublin ${time}`;
      });
    };
    update();
    setInterval(update, 30000);
  }

  // ── Work carousel ─────────────────────────────────────────────────
  // The arrow only appears once there's actually somewhere to scroll
  // to — with a single card (today) it stays hidden rather than
  // implying more content exists.
  const carousel = document.getElementById('work-carousel');
  const carouselNext = document.getElementById('work-carousel-next');
  if (carousel && carouselNext) {
    const updateArrow = () => {
      const scrollable = carousel.scrollWidth - carousel.clientWidth > 8;
      const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 8;
      carouselNext.classList.toggle('is-visible', scrollable && !atEnd);
    };
    carouselNext.addEventListener('click', () => {
      const card = carousel.querySelector('.work-card-lg');
      const step = card ? card.getBoundingClientRect().width + 24 : carousel.clientWidth * 0.8;
      carousel.scrollBy({ left: step, behavior: wantsMotion ? 'smooth' : 'auto' });
    });
    carousel.addEventListener('scroll', updateArrow, { passive: true });
    window.addEventListener('resize', updateArrow);
    window.addEventListener('load', updateArrow);
    updateArrow();
    // A same-tick check can land before web fonts finish swapping in
    // and shift card widths, so re-check once more after layout has
    // had a chance to settle rather than trusting only the synchronous
    // call above.
    requestAnimationFrame(() => requestAnimationFrame(updateArrow));
  }
})();
