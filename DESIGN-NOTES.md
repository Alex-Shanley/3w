# Design notes

One paragraph per significant decision: what I did, what I rejected, and why. Entries added as each section is built, in build order.

---

## Cross-cutting: "default visible, JS opts into hidden" as the one motion invariant

Every animated element in this rebuild follows the same rule: its default CSS state (no JS classes present) is its final, fully-visible layout. JS adds a class (`js-anim`) that opts the element INTO a hidden starting point, then a second class (`is-revealed`) animates it back to that same default state. I rejected the more common pattern — CSS hides by default, JS reveals — because it inverts the failure mode: if JS never runs, is delayed, or (as happened earlier in this project's history on the old site) gets stuck mid-animation in a backgrounded tab where `requestAnimationFrame` is suspended, content hidden-by-default stays invisible forever, while content visible-by-default just doesn't animate. The former is a usability failure; the latter is a graceful degradation. This is why brief §14 acceptance criterion #9 ("renders and is fully readable with JS disabled") is true by construction here rather than something to test for after the fact.

## Nav: backdrop-filter moved to `::before`, not the header itself

`backdrop-filter` (and `filter`) on an element creates a new containing block for any `position:fixed` descendant — a CSS spec behaviour, not a bug, but one that silently traps a full-screen fixed-position child inside the filtered ancestor's own box instead of the viewport. The mobile menu's full-screen panel lives inside `<details class="mobile-menu">`, which lives inside `<header class="site-header">`. Putting the blur directly on `.site-header` broke the panel — found and fixed during hero verification, not caught in review. Moving the blur to `.site-header::before` (a pseudo-element, not a real DOM ancestor of the panel) keeps the identical visual result on the header while leaving the panel free to size against the true viewport.

## Mobile menu: native `<details>`, not a JS-toggled div

The brief asks for a full-screen overlay menu with a focus trap and Escape-to-close — both of which sound like they need JS from the ground up. Built on native `<details>`/`<summary>` instead: open/close, keyboard operability, and every link are fully functional with zero JS via the browser's own disclosure widget. `nav.js` only layers on the parts a native `<details>` doesn't provide for free — the focus trap, Escape-to-close, closing on link click, and locking background scroll while open — and the staggered link reveal is a plain CSS `@keyframes` animation keyed off the `[open]` attribute, so even that runs without JS involvement once the panel is open. This is the same "native mechanism first, JS layers on top" instinct the brief itself uses for the FAQ accordion, applied one level deeper.

## Hero: type as the only hero, proof rail replaces the photo

Killed `hero-art.jpg` entirely, per brief problem #3 — it was both the site's least distinctive visual asset and almost certainly its LCP element. The right column (proof rail) does the job a hero photo usually does — filling the space, creating asymmetry against the headline — using the site's own real numbers instead: load time, uptime, traffic growth, the one case study's booking lift, and the launch timeframe. This is the brief's own thesis (`the craft of the site must be the proof of the claim`) applied literally: the hero's "image" is evidence, not decoration.

**Deviation from the brief's exact spec:** §9.1 describes "a thin signal bar whose width encodes the value." I didn't build that — the five metrics (seconds, a percentage, a multiplier, a percentage lift, a range of weeks) don't share a real numeric axis, and a variable-width bar strongly implies one to anyone reading it as a chart. Shipping that would be a small, specific case of the thing the brief spends its entire audit section warning against: a claim that isn't quite honest. Built a fixed-length accent rule instead — same visual craft (thin signal-coloured mark, animates in per row), zero implied precision that isn't there.

## Dark mode: re-tuned per surface, not inverted

Verified independently in `AUDIT.md` §5 that the brief's proposed dark tokens are genuinely re-tuned, not a straight invert: `--ink-500` on the dark canvas is a different hex than a literal inversion of the light `--ink-500` would produce, chosen specifically to still clear 4.5:1 on `#08080A`. Implemented exactly as specified — system-preference-driven via `prefers-color-scheme`, with a manual `data-theme` toggle that wins in both directions, persisted in `sessionStorage` rather than `localStorage` per the brief's "for the session" framing.
