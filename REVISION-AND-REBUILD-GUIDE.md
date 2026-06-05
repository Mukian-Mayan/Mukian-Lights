# Mukian Lampz — Revision & Rebuild Guide

A learning-oriented walkthrough of how this site is built, what changed across each
revision, how every effect works, and how to rebuild or extend any part of it.
No frameworks, no build step — just HTML, CSS, and one vanilla JS file.

---

## 1. File map

```
mukian/
├── index.html      landing / onboarding (its own interactive "stage")
├── home.html       3 scroll-snap panels + footer
├── shop.html       catalog (3D square bg) + cart + footer
├── about.html      story + stats + the futuristic "Glow Studio" + footer
├── contact.html    form + footer
├── styles.css      ALL styling (tokens, components, per-page, responsive, revisions)
├── app.js          ALL behaviour (one IIFE; each feature self-guards on its DOM)
├── assets/
│   ├── chandeliers/ lamps/ lampshades/   product photos
│   └── hero/lamp_head.png, lamp_stem.png  the split landing lamp
├── README.md
└── REVISION-AND-REBUILD-GUIDE.md   ← this file
```

**Mental model:** every page links the same `styles.css` + `app.js`. `app.js` runs a list
of `init*()` functions on load; each one looks for its elements and quietly does nothing
if they're absent. So the same script powers every page without per-page bundles.

---

## 2. Architecture decisions (and why)

- **Multipage, not a SPA.** Each page owns one heavy animation (lamp / carousels / square
  field). Keeping them on separate pages means a page never loads weight it doesn't use —
  the top priority was performance. Shared look/behaviour come from the single CSS + JS.
- **Nav/footer are inlined per page** (not fetched) so the site runs from a local
  double-click (`file://`) with no server and no CORS issues.
- **Scroll-snap panels.** A scroll container (`.snap`) with `scroll-snap-type:y` and
  full-height `.panel` children gives the "one screen flips entirely to the next" feel.
  Long pages use `.snap.soft` (`proximity` snap) so tall content stays scrollable.
- **Theme** is a single `data-theme` attribute on `<html>` flipping CSS variables
  (`--bg`, `--ink`, …). Pages keep their signature accent; only the chrome/text invert.
- **State** (cart, favourites, recents, theme, rating, mute) lives in `localStorage`
  with an in-memory fallback (`store` helper) so it degrades gracefully when storage is
  sandboxed (e.g. some inline previews).

---

## 3. Revision history

**Pass 1 — build.** Wireframes → full multipage site: landing lamp with cursor spotlight
& head tracking, home (warm hero, 5 carousels, curated cards), shop (3D squares + cart),
contact, product modal, toasts, theme toggle, cart/favourites/recents.

**Pass 2 — features & polish.** Added the **About page** with the 3D field running
consistently behind it and a futuristic **Glow Studio**; enlarged & brightened the landing
lamp/spotlight; made text animations **recursive** (replay on re-enter and on tab return);
**carousel sounds** + mute + bigger carousels; **star rating** in the cart (removed "order
categories"); more "life" (entrance + micro-interactions); mobile padding.

**Pass 3 — fixes & landing rebuild (this one).**
- **Fixed the lamp seam glitch.** The old head/stem split used a straight diagonal cut that
  sliced through the cone, so rotating the head revealed a seam. Re-cropped using a
  morphological *open* so the whole shade stays in the head layer (see §5).
- **Fonts:** nav links switched from ultra-bold Anton to Poppins 600 (thinner, same size);
  oversized display headings reduced to ~¾.
- **Rebuilt the landing** as a cinematic "stage" (see §6).

> Because CSS is cascade-ordered, later passes were appended at the **end** of `styles.css`
> as clearly-labelled override blocks. When two rules have equal specificity, the later one
> wins — that's why the revision blocks override earlier base rules.

---

## 4. How the core effects work

### Recursive text motion (`splitText`, `initMotion`)
`splitText()` wraps each word in `.word` (so words never break mid-letter) and each letter
in `.char`. Characters are hidden until their parent gets `.is-in`; CSS then runs the
`charIn` keyframe with a per-letter delay. `initMotion()` uses one `IntersectionObserver`
on every `.split` and `.reveal`: on enter it calls `playMotion()` (remove `is-in`, force a
reflow with `void el.offsetWidth`, re-add `is-in`) so the animation **restarts every time**;
on leave it removes `is-in`. It also replays on `visibilitychange`/`pageshow`/`focus`, which
is what makes the effect recursive when you leave the page and come back.

### Carousels (`Carousel`, `OFFS`, `sound`)
Each `.carousel` reads `data-dir` (up/down/left/right/diag), `data-int`, `data-ids`.
Slides cross-fade while the incoming one slides in from the configured direction (`OFFS`).
Dots animate via the `dotPulse` keyframe keyed to `--int`. Hover pauses & lifts and plays
a soft blip; click opens the product modal. Sound is Web-Audio only (no files); browsers
require a user gesture first, so the audio context resumes on the first `pointerdown`.

### 3D square depth field (`SquareField`)
A `<canvas>` of squares flying toward the viewer (`z` decreasing). Projection is
`k = focal/z`; screen position spreads from a centre (`biasRight` pushes the vanishing
point right for shop/contact). Options you can tune: `density`, `max`, `speed`, `depth`,
`focal`, `alpha` (peak opacity), `minAlpha` (visibility floor — raise it for a *fuller*
field like About), `colors`, `biasRight`. It caps DPR, respects reduced-motion, and pauses
when the tab is hidden.

> **Gotcha:** a `<canvas>` is a *replaced element* — `position:fixed; inset:0` does **not**
> stretch it (it stays 300×150). Always give canvases an explicit `width/height`
> (see the `#fx`, `#checker`, `#about-fx` rules).

### Theme, cart, modals, toasts
- `initTheme` flips `data-theme` and saves it.
- Cart/favourites/recents are plain objects/sets saved through `store`; the nav badge and
  cart page re-render on change; every action fires a toast.
- One reusable `.modal-back` backdrop hosts the product details, purchase confirmation, and
  contact-success dialogs (`openModal(html)` / `closeModal()`), closable by ✕, backdrop, or Esc.

### Star rating (`initStars`)
Any `.stars[data-key]` becomes a 5-star control; hover previews, click sets & saves the
value, and fires a toast. Used in the cart's "Review and comment".

### Glow Studio (`initAmbiance`)
The About page's futuristic feature. Two range sliders (warmth/brightness) live-update a
scene image's CSS `filter`, tint an overlay beam, compute a fake Kelvin readout, and drive
a `--amb-glow` colour. Preset chips set slider values. All self-contained, no APIs.

---

## 5. The lamp head-tracking crop (important learning)

**Goal:** rotate only the lamp's *head* around its pivot so it appears to "look" at the
cursor, with no visible seam.

**What failed (pass 1):** a straight diagonal cut `2(x-px)+(y-py)=0` to separate head from
stem. The cone extends downward *and* the rod extends downward, so a straight line sliced
through the cone — rotating the head revealed the cut.

**What works (pass 3):** separate by **shape**, not by a line. The rod is thin; the shade
is a big blob. A morphological **open** (erode then dilate) deletes the thin rod and keeps
the whole shade:

```python
from PIL import Image; import numpy as np; from scipy import ndimage
im = Image.open(SRC).convert('RGBA'); arr = np.array(im); A = arr[:,:,3] > 30
er = ndimage.binary_erosion(A, iterations=40)      # thin rod vanishes
op = ndimage.binary_dilation(er, iterations=50)    # restore shade size
head_mask = op & A                                  # shade + cap (complete)
stem_base = A & ~head_mask                           # the rod
stem_mask = ndimage.binary_dilation(stem_base, 20) & A   # rod + overlap band
# write two PNGs (head, stem); rotate head about the brass knuckle pivot
```

Then in CSS the head layer gets `transform-origin: 70.13% 18.73%` (the brass knuckle as a
percentage of the image) and JS sets `transform: rotate(<clamped deg>)`. Verify by
compositing the head over the stem at several angles (−16…+16) before shipping.

**Recipe to do this for any other product image:**
1. Find the pivot (the joint the head turns on) in pixel coords → convert to %.
2. `open` the alpha to drop the thin part; tune `iterations` to the part's thickness.
3. Export `head` and `stem` PNGs; add a small overlap band so no gap shows.
4. Set `transform-origin` to the pivot %; clamp rotation to a natural range.

---

## 6. The landing "stage" (rebuilt)

`index.html` is a fixed full-screen `.stage` with layered effects (back → front):
`rays` (slow conic sweep) → `grain` → `ghost` giant outline type → `spot` (cursor
spotlight, `mix-blend:screen`) + `pool` (warm caustic) → lamp (`beam`, `stem`, `head`,
`glow`) → hero copy → top nav. `initLanding()` eases everything toward the cursor each
frame: spotlight/pool position, head rotation, beam angle, plus **parallax** (ghost, hero,
and lamp shift by different factors for depth). To retune feel, edit the easing factors
(`*0.1`, `*0.16`) and the rotation clamp `(-22…15)` in `initLanding`.

---

## 7. Common edits (recipes)

- **Add / reprice products:** `app.js` → `PRODUCTS` builder. Edit `POOL` (image lists),
  `NAMES`, `PRICE_BANDS`, `SPEC`, `DESC`, or hard-set a `price` on any item.
- **Add a nav page:** copy a page, add the link to every `.nav__links` *and* `.drawer`,
  set the `is-active` class on the current page, and give `<body>` a `data-page`.
- **Per-page footer colour:** `body[data-page="x"] .foot__panel{--foot-a:…;--foot-b:…}`.
- **Theme colours:** the `:root` / `[data-theme="dark"]` token blocks at the top of CSS.
- **Tune the square field:** the `initSquares()` option objects (`density`, `minAlpha`, …).
- **Resize a heading:** find it in the "FONT REVISION" block near the end of CSS.
- **Carousel speed/contents:** `data-int` and `data-ids` on each `.carousel` in `home.html`.

---

## 8. Gotchas & lessons

- **Canvas sizing:** replaced elements don't stretch with `inset:0` — set width/height.
- **aspect-ratio in auto grid/flex tracks collapses to 0.** The carousels needed explicit
  heights (or a definite parent) instead of relying on `aspect-ratio`.
- **Audio needs a user gesture.** The carousel sounds only start after the first tap/click.
- **`file://` can't fetch includes** — that's why nav/footer are inlined per page.
- **`localStorage` may be blocked** in sandboxed previews — hence the in-memory fallback.
- **Append, don't rewrite.** Revisions live in labelled blocks at the end of `styles.css`
  and override earlier rules by cascade order; this keeps history readable.

---

## 9. Rebuild-from-scratch order

1. `styles.css` tokens + base + nav + buttons.
2. One page's skeleton (landing or home) to lock the layout system.
3. `app.js` scaffold: `store`, `$`, `toast`, theme, nav, then the bootstrap list.
4. Products + shop grid + cart + modal + toasts.
5. The signature effects: square field, carousels (+ sound), landing stage, lamp crop.
6. About + Glow Studio.
7. Responsive pass + reduced-motion + the recursive motion observer.
8. Verify every page at desktop / dark / mobile by screenshot; fix; package.

— End of guide.
