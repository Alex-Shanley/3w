(() => {
  const root = document.getElementById('configurator');
  if (!root) return;

  const pages = document.getElementById('cfg-pages');
  const pagesOut = document.getElementById('cfg-pages-out');
  const tierEl = document.getElementById('cfg-tier');
  const priceEl = document.getElementById('cfg-price');
  const monthlyEl = document.getElementById('cfg-monthly');
  const includesEl = document.getElementById('cfg-includes');
  const scopeEl = document.getElementById('cfg-scope');
  const scopeList = document.getElementById('cfg-scope-list');
  const briefEl = document.getElementById('cfg-brief');
  const ctaEl = document.getElementById('cfg-cta');
  if (!pages || !tierEl || !ctaEl) return;

  // Every figure below is one already published in the table above this
  // widget. The configurator's job is to point at the right tier and
  // write a brief — never to invent a price. That is why the add-ons
  // people can pick have no cost attached to them anywhere in this file:
  // the ones the tiers cover are listed as included, and the ones they
  // don't are named in "quoted separately" without a number.
  const LAUNCH_MAX = 6;
  const GROW_MAX = 15;
  const CARE_MONTHLY = 'plus €190 / month';

  const TIERS = {
    launch: {
      name: 'Launch',
      price: '€5,400',
      budget: 'Under €6,000',
      includes: ['Design and build', 'Up to 6 pages', 'Hosting, first year', 'SSL and daily backups'],
    },
    grow: {
      name: 'Grow',
      price: '€10,800',
      budget: '€6,000 to €12,000',
      includes: ['Design and build', 'Up to 15 pages', 'Hosting, first year', 'SSL and daily backups',
                 'SEO research and page build', 'Rank tracking, 90 days'],
    },
    custom: {
      name: 'Bigger than these tiers',
      price: "Let's scope it",
      budget: 'Not sure yet',
      includes: ['Everything in Grow', 'Scoped and quoted individually'],
    },
  };

  const el = (id) => document.getElementById(id);
  const checked = (id) => !!(el(id) && el(id).checked);
  const radio = (name) => {
    const hit = root.querySelector(`input[name="${name}"]:checked`);
    return hit ? hit.value : '';
  };

  function pickTier(n, wantsSeo) {
    if (n > GROW_MAX) return 'custom';
    if (n > LAUNCH_MAX || wantsSeo) return 'grow';
    return 'launch';
  }

  // Things the published tiers do not cover. Named, never priced — a
  // shop or a domain has a real cost and it is not one this site has
  // committed to in public, so the honest output is "we'll quote it".
  function scopeItems(state) {
    const out = [];
    if (state.shop) out.push('An online shop');
    if (state.domain) out.push('Domain registration');
    if (state.platform === 'a custom build') out.push('Custom build rather than a platform');
    if (state.pages > GROW_MAX) out.push(`${state.pages}+ pages, past the Grow tier`);
    return out;
  }

  // The brief composes itself as choices are made. This is the part
  // people watch, so it reads as a sentence someone wrote rather than a
  // list of field values.
  function buildBrief(state, tier) {
    const bits = [];
    let opening = state.kind.charAt(0).toUpperCase() + state.kind.slice(1);
    if (state.platform) opening += ` on ${state.platform}`;
    bits.push(opening + '.');
    bits.push(`Roughly ${state.pages} page${state.pages === 1 ? '' : 's'}.`);
    if (state.migrate) bits.push('Moving content from an existing site.');
    if (state.shop) bits.push('Needs an online shop.');
    if (state.seo) bits.push('Includes SEO research and page build.');
    if (state.domain) bits.push('Needs a domain registered.');
    if (state.care) bits.push('Care plan after launch.');
    bits.push(`Looks like a fit for: ${tier.name}.`);
    return bits.join(' ');
  }

  function tickList(target, items) {
    target.replaceChildren(...items.map((text) => {
      const li = document.createElement('li');
      const tick = document.createElement('span');
      tick.className = 'tick';
      li.append(tick, ' ' + text);
      return li;
    }));
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const panel = document.querySelector('.config-result');
  let shownTier = null;
  let swapTimer = null;

  function paint(state, tier) {
    tierEl.textContent = tier.name;
    priceEl.textContent = tier.price;

    monthlyEl.hidden = !state.care;
    monthlyEl.textContent = CARE_MONTHLY;

    // The page count the tier states, swapped for the count actually
    // chosen — "up to 6 pages" is noise once someone has said four.
    tickList(includesEl, tier.includes.map((line) =>
      /^Up to \d+ pages$/.test(line) ? `${state.pages} page${state.pages === 1 ? '' : 's'}` : line));

    const scope = scopeItems(state);
    scopeEl.hidden = scope.length === 0;
    tickList(scopeList, scope);

    briefEl.textContent = buildBrief(state, tier);
  }

  function update() {
    const state = {
      kind: radio('cfg-kind') || 'a new site',
      platform: radio('cfg-platform'),
      pages: Number(pages.value),
      seo: checked('cfg-seo'),
      shop: checked('cfg-shop'),
      care: checked('cfg-care'),
      domain: checked('cfg-domain'),
      migrate: checked('cfg-migrate'),
    };

    pagesOut.textContent = state.pages === 1 ? '1 page'
      : state.pages > GROW_MAX ? `${state.pages}+ pages`
      : `${state.pages} pages`;

    const key = pickTier(state.pages, state.seo);
    const tier = TIERS[key];

    // Only the tier change is worth a crossfade. Blurring the panel on
    // every pixel of slider travel would strobe it.
    const tierChanged = shownTier !== null && key !== shownTier;
    shownTier = key;

    // Cancelled on every update, not just on a tier change. A timer left
    // pending from an earlier swap fires ~140ms later holding the state
    // it closed over, and repaints on top of whatever has been chosen
    // since — tick a box during that window and the panel silently
    // reverts it.
    clearTimeout(swapTimer);

    if (tierChanged && panel && !reduceMotion) {
      panel.classList.add('is-swapping');
      swapTimer = setTimeout(() => {
        paint(state, tier);
        panel.classList.remove('is-swapping');
      }, 140);
    } else {
      paint(state, tier);
    }

    // The link is data rather than something being looked at, so it
    // updates immediately regardless of the crossfade. Budget has to
    // match one of the contact form's own <option> strings exactly or
    // contact-form.js drops it on the floor.
    const params = new URLSearchParams({ budget: tier.budget, brief: buildBrief(state, tier) });
    ctaEl.href = `contact.html?${params.toString()}`;
  }

  root.addEventListener('input', update);
  root.addEventListener('change', update);
  update();
})();
