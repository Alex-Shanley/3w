# 3w.studio — pre-redesign audit

Audited directly from source (`/Users/alexshanley/Desktop/my web/3w-site`), which matches the live
deployment at `https://alex-shanley.github.io/3w/` as of this audit. Read in full: `index.html`,
`work.html`, `about.html`, `work-oak-lane-dental.html`, `contact.html`, `privacy.html`,
`case-study.html`, `css/styles.css` (1047 lines), `js/main.js` (306 lines), `sitemap.xml`,
`robots.txt`, and the six files in `assets/img/`.

---

## 1. Current section order and real copy, per page

### index.html
1. **Nav** — logo `3w`, links Services / Work / About / Pricing, primary CTA "Get a quote", mobile hamburger.
2. **Hero** — full-bleed `hero-art.jpg` background with dark scrim. Eyebrow "A Dublin web studio." H1 "**Websites that earn their keep.**" Sub "We design, build, host, secure and rank websites. One team, one invoice, no handoffs." Two CTAs: "Get a quote" (solid), "See our work" (outline, links to the one case study).
3. **Trust strip** — 4 items: Dublin Ireland · GDPR compliant (links privacy) · SLA-backed hosting · "Trusted by Oak Lane Dental" (links case study). An HTML comment notes 5 more client names were originally planned (Meridian, Halvorsen & Co, Fieldnote, Porterhouse, Arno Legal) but were cut because those case studies don't exist — **correct call, don't reintroduce them without real case studies.**
4. **Services** — bento grid, 6 cards: Website Design (large/featured), UX/UI Design, SEO, Web Hosting, Website Security, Care Plans. Each has a 2-digit index, icon, name, one-line description. Real, specific copy throughout (e.g. "First results in 60–90 days, for most sites").
5. **Stat band** (dark) — 0.9s avg load / 99.9% uptime / 3× avg traffic in 6 months.
6. **Process** — 4 steps, Scope → Design → Build → Run, each with a mono step label, heading, one-line description. Already matches the brief's §7 process content almost verbatim.
7. **Featured work** — 1 card, Oak Lane Dental, "Online bookings up 42% in the first quarter," tags Design/SEO/Hosting. Link to `work.html`.
8. **Team** — "No account managers, no outsourcing" — **two fully placeholder cards**: `[TODO: founder name]`, `[TODO: one-line bio]`, empty grey circle avatars. Link to `about.html`.
9. **Pricing** — 3 cards: Launch €5,400 (≤6 pages), Grow €10,800 (≤15 pages, featured/"Most popular"), Care €190/mo. Each has a description line, tabular price, mono qualifier, feature list (desktop only — `display:none` under 768px, see Problem list below).
10. **FAQ** — 5 real questions on native `<details>`, no placeholders, good content: timeline, hosting inclusion, fit, quote turnaround, GDPR/data.
11. **CTA band** (dark) — "Tell us what your site needs to do." / "A quote within two working days. No discovery calls unless you want one." → Get a quote.
12. **Footer** — tagline, address line with `[TODO: full registered address]`, 4 link columns (Services, Work, Company, Privacy), bottom bar with `[TODO: CRO number]` and `[TODO: registered office address]`.

### about.html
Hero-style centred intro ("**One team. No handoffs.**"), then a sticky-statement editorial section (pull-quote "We'd rather do five things well than ten things adequately" pinned left, 4 principles scrolling right: Plain pricing / One point of contact / Built to be found / We stick around — all real copy, no placeholders here). Then **Team section — same two placeholder cards as the homepage**, duplicated verbatim. Dark CTA band, footer.

### work.html
Intro ("Recent launches"), a grid holding **the single Oak Lane Dental card** with an HTML comment `<!-- TODO: add more case studies here as they launch -->`, the same stat band reused from the homepage (0.9s / 99.9% / 3×), CTA band, footer.

### work-oak-lane-dental.html
Dark hero band with case meta (Client / Sector / Delivered / Year), H1 "**A dental practice that books itself**," full-width screenshot slot. Three-part narrative: Challenge / Approach / Result, all real, specific, well-written copy — this is the best content on the site. **Note: the case study is set in Sheffield, England** ("Oak Lane is a three-dentist practice in Sheffield," "'Dentist Sheffield' moved from page four to position three") — inconsistent with the rest of the site's Dublin/Ireland positioning and `en-IE` locale; flag for a content decision (relocate the fictional client to Ireland, or explicitly frame 3w as serving UK+IE). Testimonial block is **entirely placeholder**: quote, name, role, avatar all `[TODO: ...]`. Stat band repeats the case's own numbers (0.8s / 42% / #3 for "dentist Sheffield"). Device grid with 2 more screenshot slots.

### contact.html
Form: Name, Email, Company, Budget (select), Project description, honeypot field, submit "Send the brief." **`action="https://formspree.io/f/[TODO: Formspree form ID]"` — the form does not currently submit anywhere.** This is a functional break, not cosmetic: right now, submitting the "get a quote" form silently fails or 404s. Aside column: email, response-time promise, 3-step "what happens next." Real copy throughout except the Formspree ID.

### privacy.html
8 sections, GDPR-appropriate content, mostly real. One placeholder: `[TODO: retention period — e.g. 12 months from last contact]`.

### case-study.html
Not a content page — a deliberate `noindex` + meta-refresh redirect stub to `work-oak-lane-dental.html`, kept for old links. Correct as-is, leave alone.

---

## 2. Current type stack, colour, spacing, breakpoints

**Type:** Google Fonts, render-blocking `<link>` (not preloaded, not self-hosted):
`Instrument+Sans:400;500;600`, `Instrument+Serif:ital@0;1`, `Inter:400;500`, `JetBrains+Mono:400`.
- Display/headings → Instrument Sans 600, headline uses `clamp(48px, 6vw+24px, 112px)`.
- Body → Inter 400, base 16px / 1.65 line-height on `body`, `.body-lg` bumps to 18px ≥768px.
- Editorial accent → Instrument Serif (About pull-quote, case-study H1, testimonial quote).
- Micro/mono → JetBrains Mono, used for eyebrows, index numbers, mono-labels, tags — this is already close to the brief's intended pattern.
- No fluid type *scale* as a system — each element (`h1`, `h2`, `.display`, `.display-serif`) hand-tunes its own `clamp()`, no shared `--step-N` tokens.

**Colour:** flat hex values inline in `:root`, no scale/shade system:
`--ink #111315`, `--bone #F6F5F2`, `--white #FFFFFF`, `--cobalt #2F4BFF` / `--cobalt-dark #2439D9`,
`--slate #65686E`, `--mist #E4E3DE`, `--fog #ECEBE7`, `--success #147A5C` (defined, unused),
`--success-on-ink #4ADE9E` (defined, unused), `--slate-on-ink #9B9EA3` (a prior WCAG fix — see below).
Only one accent (cobalt) — already matches the brief's "one signal colour" rule. No dark-mode tokens exist at all; the whole site is light-only.

**Spacing:** ad hoc pixel values, not a scale — `.section` padding 96px→160px, `.section-tight` 96px→128px, card padding 24px→32px, gaps of 16/24/40/48/64px used inconsistently across components. No `--sp-N` tokens; every component redeclares its own numbers. A lot of layout is done via inline `style=""` attributes directly in the HTML (e.g. `style="margin-bottom:16px"` appears dozens of times) rather than through classes — this will all need to move into `sections.css`.

**Radius:** inconsistent — buttons are full pill (`999px`), cards are `20px`, contact form `24px`, phone device frame `36px`, price badge pill `999px`. The brief's "near-square, ≤4px" rule is a hard reversal of the current soft/Apple-esque language everywhere.

**Breakpoints:** exactly one, `768px`, used ~60 times throughout `styles.css`. No tablet-specific (e.g. 1024px) tier at all — mobile and "everything ≥768px" are the only two states. The brief's 6/12-col responsive tiers (mobile/tablet/desktop/wide) do not exist yet.

**Container:** `--container: 1200px` max-width, `--pad` 20px mobile / 48px desktop. No 12-column grid system — layout is done with `.grid-2`/`.grid-3` (simple `repeat()` CSS grid) and one bespoke asymmetric `grid-template-areas` bento grid for services. No baseline rhythm system.

---

## 3. CSS/JS architecture

- **One stylesheet**, `css/styles.css`, 1047 lines, plain CSS custom properties — no preprocessor, no build step. Cache-busted via `?v=14` query string, manually incremented and kept in sync across all HTML files.
- **One script**, `js/main.js`, 306 lines, vanilla ES, no modules, no bundler, wrapped in a single IIFE. Contains: a hand-rolled damped-spring physics function; a page-transition overlay (cross-page click intercept + wipe); a magnetic-cursor system (custom ring/dot cursor, fine-pointer-gated, with button/link magnetic pull); spring-driven mobile-menu open/close; a hero-entrance stagger; `IntersectionObserver`-based scroll-reveal for `.js-reveal` grids; and `IntersectionObserver`-based headline text-reveal (DOM-wraps `.section h2` / `.section-tight h2` at runtime).
- Both the transition-overlay and hero-entrance blocks were recently patched with `visibilitychange` + timeout fallbacks after testing showed they could get stuck mid-animation in a backgrounded tab (rAF/setTimeout suspension) — worth knowing before this logic gets touched again, since a naive "simplify the motion code" pass could reintroduce that bug.
- All 7 HTML pages hand-maintain identical header/footer markup — no templating. Any nav/footer change requires editing all 7 files (this session's earlier work did this via a one-off Python regex script; there's no permanent tooling for it).
- No JS bundling/minification; total `js/main.js` is unminified and currently the only JS payload (~7.5KB raw).

---

## 4. Every placeholder or weak proof point (verified, exhaustive)

| Where | What | Severity |
|---|---|---|
| `index.html`, `about.html` — Team section (×2, duplicated) | `[TODO: founder name]`, `[TODO: role]`/`[TODO: one-line bio]`, empty grey-circle avatars | **Fatal** — shipped placeholder content, appears on 2 pages |
| `work-oak-lane-dental.html` — testimonial block | Quote, name, role, avatar all `[TODO: ...]` | **Fatal** — shipped placeholder, the site's only testimonial |
| `contact.html` — form action | `formspree.io/f/[TODO: Formspree form ID]` | **Fatal, functional** — the contact form cannot currently submit anywhere |
| Footer, all 7 pages | `[TODO: full registered address]`, `[TODO: CRO number]`, `[TODO: registered office address]` | High — legal/compliance-facing, repeated on every page |
| `index.html` JSON-LD | `streetAddress: "[TODO: street address]"`, `postalCode: "[TODO: Eircode]"` | Medium — structured data with placeholder values can actively hurt local SEO |
| `privacy.html` | `[TODO: retention period]` | Medium — a GDPR policy with an unfilled clause is a real legal gap |
| All `assets/img/*.jpg` (6 files) | Abstract mesh-gradient placeholder art, not real product screenshots — alt text on most is literally `"Placeholder art — ... slot"` | High — screenshots are load-bearing proof in a case study; currently there is none |
| Work-card / featured-work sections | Single client (Oak Lane Dental) carries 100% of the site's proof | High — content depth per brief §2 |
| `work-oak-lane-dental.html` narrative | Client located in **Sheffield, England**, not Ireland | Medium — geographic inconsistency with the rest of the site's positioning |
| Trust strip HTML comment | 5 client names (Meridian, Halvorsen & Co, Fieldnote, Porterhouse, Arno Legal) referenced as *cut* content, not live | Not a bug — confirms prior work already avoided inventing fake logos; **do not resurrect these without real case studies**, per brief §16 |

---

## 5. Contrast check on the brief's proposed token palette (§5.1)

Computed with the WCAG relative-luminance formula, not estimated:

| Pair | Computed | Brief claims | Status |
|---|---|---|---|
| `--ink-900` on `--paper` | 18.07:1 | 18.1:1 | ✅ matches |
| `--ink-700` on `--paper` | 13.13:1 | 13.1:1 | ✅ matches |
| `--ink-500` on `--paper` | 5.31:1 | 5.3:1 | ✅ matches |
| `--ink-500` on `--paper-2` | 4.90:1 | 4.9:1 | ✅ matches |
| `--signal` on `--paper` | 6.90:1 | 6.9:1 | ✅ matches |
| `--paper` on `--signal` | 6.90:1 | 6.9:1 | ✅ matches |
| `--signal` on `--paper-2` | 6.37:1 | 6.4:1 | ✅ matches |
| `--positive` on `--paper` | 4.93:1 | 4.9:1 | ✅ matches |
| `--ink-300` on `--paper` | 1.86:1 | 1.9:1 | ✅ matches, correctly restricted to hairlines/borders only |
| Dark: `#EDEBE7` on `#08080A` | 16.81:1 | 16.8:1 | ✅ matches |
| Dark: `--signal` lifted to `#5C72FF` on `#08080A` | 5.06:1 | 5.1:1 | ✅ matches |

**The brief's palette is verified correct as specified — it can be implemented in `tokens.css` as-is with no adjustment.** (Full contrast script kept for reuse: re-run for any new colour before it enters `tokens.css`, per the brief's own rule.)

---

## 6. Assets inventory

All 6 placeholder images are abstract mesh-gradient JPEGs, no real screenshots:

| File | Dimensions | Size |
|---|---|---|
| `hero-art.jpg` | 2400×1400 | 42.3 KB |
| `oaklane-full.jpg` | 1400×700 | 9.4 KB |
| `oaklane-hero.jpg` | 900×700 | 5.9 KB — **currently unreferenced by any HTML file**, orphaned |
| `oaklane-home.jpg` | 800×600 | 8.4 KB |
| `oaklane-mobile.jpg` | 500×900 | 8.7 KB |
| `oaklane-treatment.jpg` | 1200×700 | 11.2 KB |

`hero-art.jpg` at 2400×1400 loaded full-bleed behind the hero is almost certainly the LCP element on `index.html` — brief §2 problem #3 is confirmed. Per §7, the redesign replaces it with type-as-hero plus the proof-rail, which removes this LCP risk entirely rather than trying to further optimise the image.

---

## 7. SEO/meta state (mostly solid, keep)

`sitemap.xml` covers 6 real pages correctly (excludes `thanks.html`/`case-study.html`, matches `robots.txt`'s `Disallow` list). `robots.txt` is correctly scoped. `index.html` carries `ProfessionalService` JSON-LD (address fields are placeholder, see §4). Per-page `<title>`/`<meta description>` are present and specific on every page — no fixes needed here beyond filling the JSON-LD address and adding `LocalBusiness`/`Service`/`FAQPage` structured data per brief §13.

---

## 8. Net assessment

The copy voice is already exactly what the brief asks for — plain, concrete, numbers-backed, zero agency mush (§11's "keep the voice" instruction is easy to honour; almost nothing needs rewriting, just placeholder-filling and restructuring). The technical foundation is also good: static HTML, no framework, already accessible-minded (focus-visible states, reduced-motion handling, semantic `<details>` FAQ). The gap is entirely in **visual system rigour** (no grid, no spacing scale, no fluid type scale, soft/rounded "Apple" language instead of Swiss/editorial discipline) and in **the four fatal content placeholders** listed in §4, which must be resolved with real content or restructured layouts — not just styled over.
