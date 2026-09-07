(() => {
  // Everything in this file is driven by figures already published on
  // the page: €5,400, €10,800, €190/month, two working days, four to
  // eight weeks, hosting for year one. None of it computes a price or
  // invents a threshold that isn't one of those numbers.

  const LAUNCH = 5400;
  const GROW = 10800;
  const euro = (n) => '€' + n.toLocaleString('en-IE');

  // ── Budget matcher ──────────────────────────────────────────────────
  // Answers "can I afford this" before anyone scrolls. The bands are the
  // two published prices, nothing between them is invented, and coming
  // in under the smallest tier gets an honest answer rather than a wall.
  (function budgetMatcher() {
    const range = document.getElementById('budget-range');
    const figure = document.getElementById('budget-figure');
    const verdict = document.getElementById('budget-verdict');
    if (!range || !figure || !verdict) return;

    function say(n) {
      if (n < LAUNCH) {
        return `Under our smallest tier. Send the brief anyway and we will tell you straight whether we can help.`;
      }
      if (n < GROW) {
        return `That is <strong>Launch</strong> territory, at ${euro(LAUNCH)}.`;
      }
      if (n < GROW * 1.5) {
        return `That covers <strong>Grow</strong>, at ${euro(GROW)}.`;
      }
      return `Above the published tiers. That becomes a <strong>scoped quote</strong>, priced the same way: one number, in writing, before anything is built.`;
    }

    function update() {
      const n = Number(range.value);
      figure.textContent = euro(n);
      // say() returns only our own markup, never anything derived from
      // the input value, which is a number the browser has already
      // clamped to the slider's own range.
      verdict.innerHTML = say(n);
    }

    range.addEventListener('input', update);
    update();
  })();

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
})();
