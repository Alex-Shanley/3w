(() => {
  const root = document.getElementById('estimator');
  if (!root) return;

  const pagesInput = document.getElementById('est-pages');
  const pagesOut = document.getElementById('est-pages-out');
  const seoInput = document.getElementById('est-seo');
  const careInput = document.getElementById('est-care');
  const tierEl = document.getElementById('est-tier');
  const priceEl = document.getElementById('est-price');
  const monthlyEl = document.getElementById('est-monthly');
  const includesEl = document.getElementById('est-includes');
  const ctaEl = document.getElementById('est-cta');
  if (!pagesInput || !tierEl || !ctaEl) return;

  // Every figure here is one already published in the pricing table
  // directly above this widget. The estimator's job is to point at the
  // right tier, never to invent a number — so there is deliberately no
  // per-page rate or add-on price arithmetic anywhere in this file.
  const LAUNCH_MAX = 6;
  const GROW_MAX = 15;
  const CARE_MONTHLY = 'plus €190 / month';

  const TIERS = {
    launch: {
      name: 'Launch',
      price: '€5,400',
      budget: 'Under €6,000',
      includes: [
        'Design and build',
        'Up to 6 pages',
        'Hosting, first year',
        'SSL and daily backups',
      ],
    },
    grow: {
      name: 'Grow',
      price: '€10,800',
      budget: '€6,000 to €12,000',
      includes: [
        'Design and build',
        'Up to 15 pages',
        'Hosting, first year',
        'SSL and daily backups',
        'SEO research and page build',
        'Rank tracking, 90 days',
      ],
    },
    custom: {
      name: 'Bigger than these tiers',
      price: "Let's scope it",
      budget: 'Not sure yet',
      includes: [
        'Everything in Grow',
        'Scoped and quoted individually',
      ],
    },
  };

  function pickTier(pages, wantsSeo) {
    if (pages > GROW_MAX) return 'custom';
    if (pages > LAUNCH_MAX || wantsSeo) return 'grow';
    return 'launch';
  }

  function update() {
    const pages = Number(pagesInput.value);
    const wantsSeo = seoInput.checked;
    const wantsCare = careInput.checked;
    const tier = TIERS[pickTier(pages, wantsSeo)];

    pagesOut.textContent = pages === 1 ? '1 page'
      : pages > GROW_MAX ? `${pages}+ pages`
      : `${pages} pages`;

    tierEl.textContent = tier.name;
    priceEl.textContent = tier.price;

    monthlyEl.hidden = !wantsCare;
    monthlyEl.textContent = CARE_MONTHLY;

    includesEl.replaceChildren(...tier.includes.map((text) => {
      const li = document.createElement('li');
      const tick = document.createElement('span');
      tick.className = 'tick';
      li.append(tick, ' ' + text);
      return li;
    }));

    // Hand the selections to the contact form rather than making
    // someone re-type them. Values are passed as query params and read
    // back by contact-form.js.
    const brief = [
      `Roughly ${pages} page${pages === 1 ? '' : 's'}.`,
      wantsSeo ? 'Includes SEO research and page build.' : null,
      wantsCare ? 'Care plan after launch.' : null,
      `Looks like a fit for: ${tier.name}.`,
    ].filter(Boolean).join(' ');

    const params = new URLSearchParams({ budget: tier.budget, brief });
    ctaEl.href = `contact.html?${params.toString()}`;
  }

  pagesInput.addEventListener('input', update);
  seoInput.addEventListener('change', update);
  careInput.addEventListener('change', update);
  update();
})();
