# MUKIAN LAMPZ — website

A modern, multi-page lighting store built from your wireframes. Pure **HTML + CSS + JS**, no framework, no build step. Just open `index.html` or drop the folder on any host.

## Pages
- **index.html** — landing. Cursor spotlight + the desk lamp turns its head to "look" at the cursor (works on touch/tilt too).
- **home.html** — three full-screen scroll-snap panels: warm hero (Find Your Perfect Glow), navy panel with **five carousels** moving in five directions, amber "Curated for Comfort & Style", then the footer.
- **shop.html** — catalog over the **3D moving-square depth field**, search, category filters, product cards (+ / − / favorite / details), then the **cart** panel with live UGX total and Purchase.
- **contact.html** — intro, contact details, and a validated message form.

## Shared files
- **styles.css** — all styling + the light/dark theme (the toggle flips the background and inverts text).
- **app.js** — everything interactive: product catalog, cart, favorites, recently-viewed history, carousels, the lamp tracking, the 3D square field, pop-ups, and toasts.
- **assets/** — your images: `chandeliers/`, `lamps/`, `lampshades/`, and the split lamp (`hero/lamp_head.png` + `hero/lamp_stem.png`).

## Why multipage (not one page)
Each page carries one heavy animation — the lamp, the carousels, the 3D field. Splitting them means a page never loads weight it doesn't use, so everything stays fast. Shared look and behavior come from the single `styles.css` + `app.js`.

## Editing the products / prices
Open **app.js** and find the `PRODUCTS` builder near the top.
- Prices are auto-generated per item in UGX. To set your own, change `PRICE_BANDS`, or assign a fixed `price` to any product.
- Names live in `NAMES`; specs/descriptions in `SPEC` / `DESC`.
- Add or remove images by editing the `POOL` lists (filenames in `assets/<category>/`).

## Notes
- Cart, favorites, theme, and history are saved in your browser (`localStorage`). They persist on a hosted copy; in some sandboxed previews storage is blocked, so it falls back to in-memory for that session.
- Login / Sign up currently route to Home — wire them to real auth whenever you're ready.
- Respects `prefers-reduced-motion` and is fully responsive (hamburger menu under 860px).

© 2026 Mukian Lampz.

---

## Latest update

- **New About page** (`about.html`) with the 3D square field running consistently behind the whole page, a story + stats + values section, and a **futuristic "Glow Studio"** — drag the warmth/brightness sliders (or tap a preset) to retune a room's light live, plus a teaser for an AR light-planner.
- **Landing lamp** enlarged and repositioned to match the reference, with a **brighter cursor spotlight**; the head still tracks the cursor.
- **Text animations are now recursive** — they replay when a section re-enters the viewport and when you return to the tab.
- **Carousels** are bigger and play subtle **sound effects** (hover/advance/click). Toggle sound with the speaker button on the Home carousels panel (saved per browser).
- **Shop cart**: "Review and comment" now has an interactive **star rating** + comment box; "Order categories" removed.
- More **mobile padding**, smoother transitions, and extra life throughout.
