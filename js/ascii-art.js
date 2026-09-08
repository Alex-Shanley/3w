(() => {
  // One renderer, several surfaces. A parametric surface is sampled
  // against a grid of character cells, depth-sorted, shaded by its own
  // normal, and drawn as glyphs — a row at a time, so a panel costs
  // ~40 fillText calls a frame rather than a couple of thousand.
  //
  // A page opts in with <canvas data-surface="bloom">. Everything else
  // (size, density, centring) follows from the box it is given.

  const PROJ = 1.9; // perspective strength, shared by the fit and the draw
  const RAMP = ' .\'`^",:;!~+=*#%@';
  const ACCENT_FROM = 0.82; // default: the hottest cells get a second pass
  const INK = '#08080A';
  const GLYPH = '#EDEBE7';
  const ACCENT = '#7C8FFF';

  const v3 = () => [0, 0, 0];
  const norm = (o) => {
    const l = Math.hypot(o[0], o[1], o[2]) || 1;
    o[0] /= l; o[1] /= l; o[2] /= l;
    return o;
  };
  const cross = (a, b, o) => {
    o[0] = a[1] * b[2] - a[2] * b[1];
    o[1] = a[2] * b[0] - a[0] * b[2];
    o[2] = a[0] * b[1] - a[1] * b[0];
    return o;
  };

  // ── Surfaces ────────────────────────────────────────────────────────

  const PETALS = 8;

  const bloom = {
    dist: 3.1,
    yaw: (t) => t * 0.00030,
    pitch: (t) => 0.60 + Math.sin(t * 0.00020) * 0.09,
    // The range the pitch above actually covers. fit() unions the bounds
    // across it so the scale is right at every point of the animation.
    pitchMin: 0.51, pitchMax: 0.69,
    // u is radius, v is the angle around. |cos(Pv/2)| is what makes the
    // lobes round; a plain cos(Pv) sawtooths them into separate spikes.
    pos(u, v, out) {
      const lobe = Math.abs(Math.cos(PETALS * v * 0.5));
      const petal = Math.pow(lobe, 0.35);
      const r = u * (0.55 + 0.45 * petal);
      out[0] = r * Math.cos(v);
      out[1] = r * Math.sin(v);
      out[2] = 0.58 * Math.pow(u, 2.2) * (0.3 + 0.7 * petal)
             - 0.66 * (1 - u) * (1 - u);
      return out;
    },
    // The hot core: light spilling out of the throat.
    glow: (u) => 0.42 * (1 - u) * (1 - u),
  };

  // A trefoil knot, drawn as a tube. Deliberately unlike the bloom —
  // woven and structural rather than radial and organic — and it passes
  // through itself, which is what the depth buffer is for.
  const KNOT_R = 0.30;   // scale of the core curve
  const KNOT_TUBE = 0.30; // radius of the tube around it
  const UP = [0, 0, 1];
  const ALT_UP = [0, 1, 0];

  const _T = v3(), _N = v3(), _B = v3(), _C = v3();

  function knotFrame(t) {
    // Core curve and its derivative.
    _C[0] = (Math.sin(t) + 2 * Math.sin(2 * t)) * KNOT_R;
    _C[1] = (Math.cos(t) - 2 * Math.cos(2 * t)) * KNOT_R;
    _C[2] = -Math.sin(3 * t) * KNOT_R;

    _T[0] = Math.cos(t) + 4 * Math.cos(2 * t);
    _T[1] = -Math.sin(t) + 4 * Math.sin(2 * t);
    _T[2] = -3 * Math.cos(3 * t);
    norm(_T);

    // Frame from a fixed up-vector rather than a true Frenet frame: the
    // curvature normal flips at inflections and would twist the tube
    // inside out. Falls back if the tangent happens to be parallel to it.
    cross(_T, UP, _N);
    if (Math.hypot(_N[0], _N[1], _N[2]) < 1e-4) cross(_T, ALT_UP, _N);
    norm(_N);
    cross(_N, _T, _B);
  }

  const knot = {
    dist: 3.4,
    yaw: (t) => t * 0.00024,
    pitch: (t) => 0.45 + Math.sin(t * 0.00017) * 0.20,
    pitchMin: 0.25, pitchMax: 0.65,
    // u runs around the tube, v runs along the curve.
    pos(u, v, out) {
      const s = u * Math.PI * 2;
      knotFrame(v);
      const cs = Math.cos(s), sn = Math.sin(s);
      out[0] = _C[0] + KNOT_TUBE * (cs * _N[0] + sn * _B[0]);
      out[1] = _C[1] + KNOT_TUBE * (cs * _N[1] + sn * _B[1]);
      out[2] = _C[2] + KNOT_TUBE * (cs * _N[2] + sn * _B[2]);
      return out;
    },
    // Exact, so this surface skips the finite-difference normals
    // entirely: on a tube the outward normal is the frame combination
    // itself. Three fewer pos() calls per sample.
    normal(u, v, out) {
      const s = u * Math.PI * 2;
      knotFrame(v);
      const cs = Math.cos(s), sn = Math.sin(s);
      out[0] = cs * _N[0] + sn * _B[0];
      out[1] = cs * _N[1] + sn * _B[1];
      out[2] = cs * _N[2] + sn * _B[2];
      return out;
    },
    glow: () => 0,
    // A tube turns far more of its surface straight into the light than
    // a bloom does, so the default cut let 11% of the panel go blue
    // against the bloom's 2%. Same look, higher bar.
    accentFrom: 0.92,
  };

  // A square sheet with a damped concentric ripple. Neither radial like
  // the bloom nor woven like the knot: it reads as a surface being
  // measured, which is the job of the page it sits on.
  const TWO_PI = Math.PI * 2;
  const sheet = {
    dist: 3.0,
    yaw: (t) => t * 0.00018,
    pitch: (t) => 1.02 + Math.sin(t * 0.00015) * 0.10,
    pitchMin: 0.92, pitchMax: 1.12,
    // Both parameters are read as a square domain: the renderer sweeps v
    // over a full turn, so it is mapped back to -1..1 rather than used as
    // an angle.
    pos(u, v, out) {
      const a = u * 2 - 1;
      const b = (v / TWO_PI) * 2 - 1;
      const r = Math.hypot(a, b);
      out[0] = a;
      out[1] = b;
      out[2] = 0.40 * Math.cos(r * 6.2) * Math.exp(-r * 1.15);
      return out;
    },
    glow: () => 0,
    // Flatter lighting than a bloom or a tube, so the cut has to come
    // down to pick out the crests at all: 0.90 left it under 1% blue.
    accentFrom: 0.78,
    fitAxis: 'y',
    pad: 0.94,
  };

  const SURFACES = { bloom, knot, sheet };

  // ── Renderer ────────────────────────────────────────────────────────

  function mount(canvas) {
    const surface = SURFACES[canvas.dataset.surface];
    if (!surface || !canvas.getContext) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cols = 0, rows = 0, charW = 0, lineH = 0;
    let raf = null, running = false, t = 0;
    // A surface's projected centre is not its origin — the bloom's throat
    // dips and its petals curl, and it sat 92px high in a 606px panel,
    // clipped off the top edge. Rather than guess a constant that only
    // holds at one tilt, each frame nudges this toward whatever would
    // centre the ink it just drew.
    // Fit and centring are solved once, in measure(), by projecting a
    // coarse sample of the surface across the whole range of rotations it
    // will pass through and taking the union of the bounds. The previous
    // approach eased an offset toward centring the ink it had just drawn,
    // which cannot work: ink outside the grid is culled before it is
    // measured, so a shape already clipped at the edge reports itself
    // perfectly centred and never moves.
    let scale = 1, hOffset = 0, vOffset = 0;

    const pA = v3(), pB = v3(), pC = v3(), nrm = v3();

    function measure() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const fontPx = Math.max(6, Math.min(10,
        Math.round(Math.min(rect.width, rect.height) / 72)));
      ctx.font = `${fontPx}px "Geist Mono", "JetBrains Mono", monospace`;
      ctx.textBaseline = 'top';
      charW = ctx.measureText('M').width || fontPx * 0.6;
      lineH = Math.round(fontPx * 1.08);
      cols = Math.max(8, Math.floor(rect.width / charW));
      rows = Math.max(6, Math.floor(rect.height / lineH));
      fit();
      return true;
    }

    // Projected position in "scale = 1" units, so the fitting pass and the
    // draw pass cannot disagree about where a point lands.
    function project(u, v, cy, sy, cp, sp, cellAspect, out) {
      surface.pos(u, v, pA);
      const rx = pA[0] * cy - pA[1] * sy;
      const ry0 = pA[0] * sy + pA[1] * cy;
      const ry = ry0 * cp - pA[2] * sp;
      const rz = ry0 * sp + pA[2] * cp;
      const zc = rz + surface.dist;
      if (zc <= 0.1) return false;
      const inv = 1 / zc;
      out[0] = rx * cellAspect * inv * PROJ;
      out[1] = ry * inv * PROJ;
      out[2] = inv;
      return true;
    }

    function fit() {
      const cellAspect = lineH / charW;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      const p = [0, 0, 0];
      // Union over the rotations the animation actually visits, so the
      // scale is fixed: refitting per frame would make the shape breathe
      // in and out as it turned.
      for (let a = 0; a < 12; a++) {
        const yaw = (a / 12) * Math.PI * 2;
        const cy = Math.cos(yaw), sy = Math.sin(yaw);
        for (let b = 0; b < 5; b++) {
          const pitch = surface.pitchMin + (b / 4) * (surface.pitchMax - surface.pitchMin);
          const cp = Math.cos(pitch), sp = Math.sin(pitch);
          for (let i = 0; i <= 16; i++) {
            const u = i / 16;
            for (let j = 0; j < 64; j++) {
              const v = (j / 64) * Math.PI * 2;
              if (!project(u, v, cy, sy, cp, sp, cellAspect, p)) continue;
              if (p[0] < x0) x0 = p[0];
              if (p[0] > x1) x1 = p[0];
              if (p[1] < y0) y0 = p[1];
              if (p[1] > y1) y1 = p[1];
            }
          }
        }
      }
      if (!isFinite(x0)) { scale = 1; hOffset = cols / 2; vOffset = rows / 2; return; }
      // The bound is the union across every rotation, so at most angles
      // the shape sits inside it. 0.80 keeps a comfortable margin of black
      // at the widest orientation. A square sheet needs more: its union
      // includes the 45-degree diagonal, which is 1.4x its own width, so
      // the same figure would leave it stranded in the middle of the
      // panel — it takes the frame right to the edge instead.
      const pad = surface.pad || 0.80;
      // A closed shape has to fit both ways or it gets cut off. A plane
      // does not: fitting the sheet's 45-degree diagonal shrank it to 6%
      // ink with 125px of dead black above and below. Fitting height only
      // lets it run off the sides, which is how a surface extending past
      // the frame is supposed to read.
      scale = surface.fitAxis === 'y'
        ? (rows * pad) / (y1 - y0)
        : Math.min((cols * pad) / (x1 - x0), (rows * pad) / (y1 - y0));
      hOffset = cols / 2 - ((x0 + x1) / 2) * scale;
      vOffset = rows / 2 - ((y0 + y1) / 2) * scale;
    }

    function draw(time) {
      if (!canvas.width || !canvas.height) return;
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bright = new Float32Array(cols * rows);
      // Zero-filled, not Infinity: `inv` is always positive and the test
      // below keeps the LARGER value (the nearer sample), so seeding it
      // with Infinity rejects every point and draws an empty panel.
      const depth = new Float32Array(cols * rows);

      const yaw = surface.yaw(time);
      const pitch = surface.pitch(time);
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);

      const lx = -0.42, ly = -0.66, lz = -0.62; // light, upper left

      // Sampled against the glyph grid rather than a fixed count, so the
      // surface stays solid instead of filling with holes at large sizes.
      const UI = Math.max(48, Math.min(150, Math.round(rows * 1.7)));
      const VI = Math.max(120, Math.min(340, Math.round(cols * 2.6)));
      const e = 0.006;

      // A character cell is about twice as tall as it is wide, so equal
      // counts of columns and rows are nothing like equal distances.
      const cellAspect = lineH / charW;
      const NEAR = 1 / surface.dist;

      for (let i = 0; i < UI; i++) {
        const u = i / (UI - 1);
        for (let j = 0; j < VI; j++) {
          const v = (j / VI) * Math.PI * 2;

          surface.pos(u, v, pA);

          if (surface.normal) {
            surface.normal(u, v, nrm);
          } else {
            // Step backwards at the far edge instead of clamping. Clamping
            // made du zero on the last row, so the cross product vanished
            // and a whole edge of the surface came out unlit — invisible
            // on a bloom, a dark stripe along the rim of a flat sheet.
            const du = u + e <= 1 ? e : -e;
            surface.pos(u + du, v, pB);
            surface.pos(u, v + e, pC);
            const k = 1 / du;
            const ax = (pB[0] - pA[0]) * k, ay = (pB[1] - pA[1]) * k, az = (pB[2] - pA[2]) * k;
            const bx = pC[0] - pA[0], by = pC[1] - pA[1], bz = pC[2] - pA[2];
            nrm[0] = ay * bz - az * by;
            nrm[1] = az * bx - ax * bz;
            nrm[2] = ax * by - ay * bx;
            norm(nrm);
          }

          // Rotate the point and its normal together: yaw about Z, pitch
          // about X.
          const rx = pA[0] * cy - pA[1] * sy;
          const ry0 = pA[0] * sy + pA[1] * cy;
          const ry = ry0 * cp - pA[2] * sp;
          const rz = ry0 * sp + pA[2] * cp;

          const mx = nrm[0] * cy - nrm[1] * sy;
          const my0 = nrm[0] * sy + nrm[1] * cy;
          const my = my0 * cp - nrm[2] * sp;
          const mz = my0 * sp + nrm[2] * cp;

          let lam = mx * lx + my * ly + mz * lz;
          if (lam < 0) lam = -lam * 0.55; // two-sided

          const zc = rz + surface.dist;
          if (zc <= 0.1) continue;
          const inv = 1 / zc;

          const sx = Math.round(hOffset + rx * cellAspect * inv * PROJ * scale);
          const sy2 = Math.round(vOffset + ry * inv * PROJ * scale);
          if (sx < 0 || sx >= cols || sy2 < 0 || sy2 >= rows) continue;

          const idx = sy2 * cols + sx;
          if (inv < depth[idx]) continue; // keep the nearer sample
          depth[idx] = inv;

          let b = 0.14 + lam * 0.95 + (inv - NEAR + 0.04) * 1.7 + surface.glow(u, v);
          // Gamma: linear shading spends most of its range on the sparse
          // end of the ramp and reads as scattered dots, not tone.
          bright[idx] = b > 0 ? Math.pow(Math.min(1, b), 0.72) : 0;
        }
      }

      const accentFrom = surface.accentFrom || ACCENT_FROM;
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass === 0 ? GLYPH : ACCENT;
        for (let y = 0; y < rows; y++) {
          let line = '';
          let any = false;
          for (let x = 0; x < cols; x++) {
            const b = bright[y * cols + x];
            if (b <= 0.02 || (pass === 1 && b < accentFrom)) { line += ' '; continue; }
            line += RAMP[Math.min(RAMP.length - 1,
              Math.max(1, Math.round(b * (RAMP.length - 1))))];
            any = true;
          }
          if (any) ctx.fillText(line, 0, y * lineH);
        }
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
      // One frame, held: measure() has already solved fit and centring, so
      // a single pass is correct. Used for reduced motion and as the first
      // paint, so the panel is never an empty black box.
      if (measure()) draw(2600);
    }

    still();

    // Only animate while on screen and the tab is in front.
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
      if (document.visibilityState !== 'visible') { stop(); return; }
      const r = canvas.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) start();
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
  }

  document.querySelectorAll('canvas[data-surface]').forEach(mount);
})();
