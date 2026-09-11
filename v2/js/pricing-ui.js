(() => {
  // Everything in this file is driven by copy already published on the
  // page: two working days, four to eight weeks, hosting for year one.
  // None of it computes a price.

  // ── Project timeline ────────────────────────────────────────────────
  const STAGES = [
    {
      when: 'Day zero',
      title: 'You send the brief',
      body: 'Tell us what the site needs to do. No discovery call required first, though you are welcome to one.',
    },
    {
      when: 'Within two working days',
      title: 'You get one number',
      body: 'A fixed price for a fixed scope, in writing. If the scope changes later, we quote the change before we build it.',
    },
    {
      when: 'Typically four to eight weeks',
      title: 'Design and build',
      body: 'Wireframes, visual design, then the built site. The same people do both, so nothing gets handed between a designer and a developer.',
    },
    {
      when: 'Launch day',
      title: 'It goes live on our hosting',
      body: 'Hosting, SSL and daily backups are running from the moment it launches. No separate setup, no third party to chase.',
    },
    {
      when: 'Twelve months later',
      title: 'Your call, either way',
      body: 'Hosting is included for the first year on every build. After that a site either moves onto a Care plan, or we hand everything over cleanly. There is no lock-in in either direction.',
    },
  ];

  (function timeline() {
    const root = document.getElementById('timeline');
    if (!root) return;
    const when = document.getElementById('tl-when');
    const title = document.getElementById('tl-title');
    const body = document.getElementById('tl-body');
    if (!when || !title || !body) return;

    function update() {
      const hit = root.querySelector('input[name="tl"]:checked');
      const stage = STAGES[Number(hit ? hit.value : 0)];
      if (!stage) return;
      when.textContent = stage.when;
      title.textContent = stage.title;
      body.textContent = stage.body;
      // Everything up to the current step reads as done, so the track
      // shows progress rather than just a selection.
      const steps = root.querySelectorAll('.tl-step');
      const idx = Number(hit ? hit.value : 0);
      steps.forEach((el, i) => el.classList.toggle('is-passed', i < idx));
    }

    root.addEventListener('change', update);
    update();
  })();

  // ── Care plan: the actual choice at year one ────────────────────────
  // Both of these are real options the site already commits to, so this
  // is a comparison rather than a scare: staying on Care, or a clean
  // handover with no lock-in.
  const CARE_OPTIONS = {
    care: {
      blurb: 'Ongoing hosting, security and updates for a site we run. Cancel any time.',
      items: ['Hosting and monitoring', 'Security patches and scans', 'Two hours of changes a month'],
    },
    handover: {
      blurb: 'We hand the site over cleanly and you run it wherever you like. No lock-in, no exit fee.',
      items: ['Files, content and DNS handed over', 'Host it anywhere you choose', 'Come back to a Care plan whenever'],
    },
  };

  (function careSwitch() {
    const root = document.getElementById('care-switch');
    const blurb = document.getElementById('care-blurb');
    const list = document.getElementById('care-list');
    if (!root || !blurb || !list) return;

    function update() {
      const hit = root.querySelector('input[name="care-opt"]:checked');
      const opt = CARE_OPTIONS[hit ? hit.value : 'care'];
      if (!opt) return;
      blurb.textContent = opt.blurb;
      list.replaceChildren(...opt.items.map((text) => {
        const li = document.createElement('li');
        const tick = document.createElement('span');
        tick.className = 'tick';
        li.append(tick, ' ' + text);
        return li;
      }));
    }

    root.addEventListener('change', update);
    update();
  })();

  // ── Comparison table: explanations and a difference filter ─────────
  (function priceTable() {
    const table = document.getElementById('price-table');
    if (!table) return;

    // Each feature name opens its own explanation. "What does that
    // actually mean" is the objection that lands on a comparison table,
    // and it was previously answered nowhere.
    table.addEventListener('click', (e) => {
      const btn = e.target.closest('.feature-why');
      if (!btn || !table.contains(btn)) return;
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });

    // "What do I actually get for the extra €5,400" is the question a
    // two-column table exists to answer, and reading six rows to find
    // the three that differ is work. This does it in one tick.
    const diffOnly = document.getElementById('diff-only');
    if (diffOnly) {
      diffOnly.addEventListener('change', () => {
        table.classList.toggle('is-diff-only', diffOnly.checked);
      });
    }
  })();

})();
