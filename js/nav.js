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

  // ── Theme toggle ─────────────────────────────────────────────────
  // The FOUC-preventing inline snippet in <head> already set data-theme
  // from sessionStorage/system preference before first paint. This just
  // wires up any .theme-toggle control to flip and persist the choice.
  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const root = document.documentElement;
      const current = root.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { sessionStorage.setItem('3w-theme', next); } catch {}
      btn.setAttribute('aria-pressed', String(next === 'dark'));
    });
  });
})();
