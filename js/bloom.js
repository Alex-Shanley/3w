(() => {
  const canvas = document.getElementById('bloom');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const figure = canvas.closest('.bloom');

  // Density ramp. The glyph carries the brightness, so a whole row can be
  // painted with one fillText instead of one per cell — the difference
  // between ~40 draw calls a frame and ~2,000.
  const RAMP = ' .\'`^",:;!~+=*#%@';
  const ACCENT_FROM = 0.82; // top of the ramp gets the second pass, in blue

  const PETALS = 8;
  const INK = '#08080A';
  const GLYPH = '#EDEBE7';
  const ACCENT = '#7C8FFF';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let cols = 0, rows = 0, charW = 0, lineH = 0, fontPx = 0;
  let raf = null, running = false, t = 0;
  // The throat dips and the petals curl, so the shape's projected centre
  // is not its origin — it sat 92px high in a 606px panel and clipped off
  // the top edge. Rather than guess a constant that only holds at one
  // tilt, each frame nudges this toward whatever would centre the ink it
  // just drew. It settles in two or three frames and tracks the tilt.
  let vOffset = 0, vOffsetReady = false;

  // A bloom: rounded petals around the rim, each curling up away from a
  // throat that dips through the middle. |cos(Pv/2)| is what makes the
  // lobes round rather than the sawtooth a plain cos(Pv) gives — the
  // first attempt used that and read as scattered noise.
  function pos(u, v, out) {
    const lobe = Math.abs(Math.cos(PETALS * v * 0.5));
    // 0.35 rounds the tops; the deep 0.32+0.68 modulation of the first
    // pass cut the petals apart into separate spikes and read as a
    // firework rather than a bloom. They overlap into a ruffled disc now.
    const petal = Math.pow(lobe, 0.35);
    const r = u * (0.55 + 0.45 * petal);
    const curl = 0.58 * Math.pow(u, 2.2) * (0.3 + 0.7 * petal);
    const throat = -0.66 * (1 - u) * (1 - u);
    out[0] = r * Math.cos(v);
    out[1] = r * Math.sin(v);
    out[2] = curl + throat;
    return out;
  }

  const pA = [0, 0, 0], pB = [0, 0, 0], pC = [0, 0, 0];

  function measure() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Cell size scales with the panel so the bloom keeps roughly the same
    // glyph count whether it is 380px wide or 900px.
    // Finer than the first pass (/46 gave 11px glyphs and only 50 rows in
    // a 606px panel, which is why it looked coarse next to the reference).
    fontPx = Math.max(6, Math.min(10, Math.round(Math.min(rect.width, rect.height) / 72)));
    ctx.font = `${fontPx}px "Geist Mono", "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';
    charW = ctx.measureText('M').width || fontPx * 0.6;
    lineH = Math.round(fontPx * 1.08);
    cols = Math.max(8, Math.floor(rect.width / charW));
    rows = Math.max(6, Math.floor(rect.height / lineH));
    return true;
  }

  function draw(time) {
    const w = canvas.width, h = canvas.height;
    if (!w || !h) return;

    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bright = new Float32Array(cols * rows);
    // Zero-filled, not Infinity: `inv` is always positive and the test
    // below keeps the LARGER value (the nearer sample), so seeding this
    // with Infinity rejected every point and drew an empty panel.
    const depth = new Float32Array(cols * rows);

    // Nearer face-on than the first pass, which tilted it 58 degrees and
    // showed the bloom edge-on as a ridge.
    const yaw = time * 0.00030;
    const pitch = 0.60 + Math.sin(time * 0.00020) * 0.09;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);

    // Light from the upper left, slightly behind the viewer.
    const lx = -0.42, ly = -0.66, lz = -0.62;

    // Sampled against the glyph grid, not a fixed count. At 46x132 the
    // samples were far sparser than the cells they had to fill, so the
    // surface came out full of holes and read as scatter rather than a
    // solid shaded form.
    const UI = Math.max(48, Math.min(150, Math.round(rows * 1.7)));
    const VI = Math.max(120, Math.min(340, Math.round(cols * 2.6)));
    const e = 0.006;

    // A character cell is about twice as tall as it is wide, so equal
    // counts of columns and rows are nothing like equal distances. Every
    // horizontal offset is stretched by that ratio, otherwise a circular
    // bloom draws as a tall thin ellipse.
    const cellAspect = lineH / charW;
    const NEAR = 0.34;   // 1 / (camera distance) at the shape's midpoint
    const PROJ = 1.9;
    const fitY = rows * 0.40;
    const fitX = (cols * 0.46) / cellAspect;
    const scale = Math.min(fitX, fitY) / (NEAR * PROJ);
    const halfC = cols / 2, halfR = rows / 2;

    for (let i = 0; i < UI; i++) {
      const u = 0.04 + (i / (UI - 1)) * 0.96;
      for (let j = 0; j < VI; j++) {
        const v = (j / VI) * Math.PI * 2;

        pos(u, v, pA);
        pos(Math.min(1, u + e), v, pB);
        pos(u, v + e, pC);

        // Surface normal from the two tangents.
        const ax = pB[0] - pA[0], ay = pB[1] - pA[1], az = pB[2] - pA[2];
        const bx = pC[0] - pA[0], by = pC[1] - pA[1], bz = pC[2] - pA[2];
        let nx = ay * bz - az * by;
        let ny = az * bx - ax * bz;
        let nz = ax * by - ay * bx;
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;

        // Rotate point and normal together: yaw about Z, then pitch about X.
        const rx = pA[0] * cy - pA[1] * sy;
        const ry0 = pA[0] * sy + pA[1] * cy;
        const ry = ry0 * cp - pA[2] * sp;
        const rz = ry0 * sp + pA[2] * cp;

        const mx = nx * cy - ny * sy;
        const my0 = nx * sy + ny * cy;
        const my = my0 * cp - nz * sp;
        const mz = my0 * sp + nz * cp;

        // Two-sided: the underside of a petal is lit too.
        let lam = mx * lx + my * ly + mz * lz;
        if (lam < 0) lam = -lam * 0.55;

        const zc = rz + 3.1;
        if (zc <= 0.1) continue;
        const inv = 1 / zc;

        const sx = Math.round(halfC + rx * scale * cellAspect * inv * PROJ);
        const sy2 = Math.round(halfR + ry * scale * inv * PROJ + vOffset);
        if (sx < 0 || sx >= cols || sy2 < 0 || sy2 >= rows) continue;

        const idx = sy2 * cols + sx;
        if (inv < depth[idx]) continue; // keep the nearer sample
        depth[idx] = inv;

        // Three terms: how the surface faces the light, how near it is to
        // the camera, and a glow out of the throat — the last is what
        // gives the bloom a hot core instead of even grey petals.
        const glow = 0.42 * (1 - u) * (1 - u);
        let b = 0.14 + lam * 0.95 + (inv - 0.30) * 1.7 + glow;
        // Gamma. Linear shading spent most of its range on the sparse end
        // of the ramp, so the surface read as scattered dots rather than
        // continuous tone.
        b = b > 0 ? Math.pow(Math.min(1, b), 0.72) : 0;
        bright[idx] = b;
      }
    }

    // Pass one: every lit cell, in bone. Pass two: only the hottest, in blue.
    let inkTop = -1, inkBottom = -1;
    for (let pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass === 0 ? GLYPH : ACCENT;
      for (let y = 0; y < rows; y++) {
        let line = '';
        let any = false;
        for (let x = 0; x < cols; x++) {
          const b = bright[y * cols + x];
          if (b <= 0.02 || (pass === 1 && b < ACCENT_FROM)) { line += ' '; continue; }
          const gi = Math.min(RAMP.length - 1, Math.max(1, Math.round(b * (RAMP.length - 1))));
          line += RAMP[gi];
          any = true;
        }
        if (any) {
          ctx.fillText(line, 0, y * lineH);
          if (pass === 0) {
            if (inkTop < 0) inkTop = y;
            inkBottom = y;
          }
        }
      }
    }

    if (inkTop >= 0) {
      const want = vOffset + (halfR - (inkTop + inkBottom) / 2);
      // Snapped on the first frame so a still (reduced motion, or the
      // paint before rAF starts) is centred too, eased after that.
      vOffset = vOffsetReady ? vOffset + (want - vOffset) * 0.18 : want;
      vOffsetReady = true;
    }
  }

  function frame(now) {
    if (!running) return;
    t = now;
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMotion.matches) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function still() {
    // One frame, held. Used for reduced motion and as the first paint, so
    // the panel is never an empty black box waiting on rAF. Drawn twice:
    // the first pass measures where the ink landed, the second uses that
    // to centre it.
    if (!measure()) return;
    draw(2600);
    draw(2600);
  }

  still();

  // Only animate while it is actually on screen and the tab is in front —
  // a canvas repainting behind another tab is heat for nobody.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && document.visibilityState === 'visible') start();
        else stop();
      });
    }, { threshold: 0 }).observe(canvas);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (figure && figure.getBoundingClientRect().bottom > 0) start();
    } else {
      stop();
    }
  });

  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) { stop(); still(); } else { start(); }
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (measure() && !running) draw(t || 2600);
    }, 150);
  });
})();
