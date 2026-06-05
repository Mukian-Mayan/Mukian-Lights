/* ============================================================
   MUKIAN LAMPZ — app.js  (vanilla, no deps)
   One script for every page; each feature self-guards on its DOM.
   ============================================================ */
(() => {
'use strict';
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

/* ---------- storage (graceful fallback when sandboxed) ---------- */
const mem = {};
const store = {
  get(k, d){ try { const v = localStorage.getItem(k); return v==null ? d : JSON.parse(v); }
             catch { return k in mem ? mem[k] : d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch { mem[k] = v; } }
};

/* ---------- product catalog (built from the real image assets) ---------- */
const POOL = {
  chandeliers: ['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10','C11','C12','C13','C14'],
  lamps:       ['L1','L2','L3','L4','L5','L6','L7','L8'],
  lampshades:  ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S12','S13','S14','S15','S16','S17']
};
const NAMES = {
  chandeliers:['Aurora Spiral','Celeste Ring','Halo Cascade','Nimbus Crown','Lumen Tier','Orbit Drift',
    'Cygnus Fall','Vega Crystal','Sable Helix','Gilded Comet','Solace Bloom','Mirage Crown','Aether Spiral','Noir Cascade'],
  lamps:['Pivot Reader','Dune Desk','Onyx Task','Brass Arc','Ember Stem','Slate Reader','Halcyon Desk','Mono Task'],
  lampshades:['Linen Drum','Ivory Cone','Dusk Shade','Pleat Bell','Cotton Cloud','Amber Drum','Smoke Bell','Pearl Cone',
    'Sage Drum','Clay Shade','Frost Bell','Walnut Drum','Mist Cone','Rust Shade','Bone Drum','Taupe Bell','Snow Cone']
};
const CAT_LABEL = { chandeliers:'Chandeliers', lamps:'Lamps', lampshades:'Lampshades' };
// deterministic pseudo-random so prices/specs are stable across loads
const seed = (n) => { let x = Math.sin(n*9301+49297)*233280; return x - Math.floor(x); };
const PRICE_BANDS = { chandeliers:[650000,2400000], lamps:[120000,460000], lampshades:[45000,185000] };
const SPEC = {
  chandeliers:{style:'Modern Luxury',material:'Crystal & Metal',source:'LED',watt:'48W',temp:'Warm White (3000K)',
    diam:'60 cm',height:'Up to 120 cm',dimmable:'Yes',install:'Ceiling Mounted',room:'Living Room, Dining Room, Bedroom'},
  lamps:{style:'Minimalist',material:'Iron & Brass',source:'E27 Bulb',watt:'12W',temp:'Warm White (2700K)',
    diam:'16 cm',height:'42 cm',dimmable:'Optional',install:'Table / Desk',room:'Study, Bedside, Office'},
  lampshades:{style:'Contemporary',material:'Linen & Cotton',source:'Shade only',watt:'—',temp:'—',
    diam:'30–45 cm',height:'22 cm',dimmable:'—',install:'Fits E27 holders',room:'Any room'}
};
const DESC = {
  chandeliers:'Enhance your space with this elegant chandelier featuring a premium metal frame and energy-efficient LED lighting. Its adjustable height and dimmable functionality make it ideal for creating the perfect ambiance in modern homes and commercial interiors.',
  lamps:'A minimalist task lamp with a solid iron body and brass detailing. The pivoting head directs warm light exactly where you need it — built for desks, bedsides, and reading corners.',
  lampshades:'A handcrafted shade in soft, natural fabric that diffuses light into a warm, even glow. Slips onto standard holders to refresh any fixture in seconds.'
};
let _id = 0;
const PRODUCTS = [];
for (const cat of Object.keys(POOL)){
  POOL[cat].forEach((code, i) => {
    const r = seed(_id+1);
    const [lo,hi] = PRICE_BANDS[cat];
    const price = Math.round((lo + r*(hi-lo)) / 1000) * 1000;
    PRODUCTS.push({
      id:_id, code, cat, catLabel:CAT_LABEL[cat],
      name: NAMES[cat][i % NAMES[cat].length],
      price, img:`assets/${cat}/${code}.jpg`,
      specs: SPEC[cat], desc: DESC[cat]
    });
    _id++;
  });
}
const byId = (id) => PRODUCTS.find(p => p.id === +id);
const fmt = (n) => n.toLocaleString('en-US') + ' UGx';

/* ---------- shared state ---------- */
let cart      = store.get('ml_cart', {});      // {id: qty}
let favorites = new Set(store.get('ml_fav', [])); // ids
let recents   = store.get('ml_recents', []);   // ids, most-recent first
const saveCart = () => { store.set('ml_cart', cart); syncCartCount(); };
const saveFav  = () => store.set('ml_fav', [...favorites]);
const saveRec  = () => store.set('ml_recents', recents);
const cartCount = () => Object.values(cart).reduce((a,b)=>a+b, 0);
const cartTotal = () => Object.entries(cart).reduce((s,[id,q])=> s + byId(id).price*q, 0);

function syncCartCount(){
  const n = cartCount();
  $$('[data-cart-count]').forEach(el => { el.textContent = n; el.style.display = n ? 'grid':'none'; });
}
function pushRecent(id){
  recents = [id, ...recents.filter(x => x !== id)].slice(0, 12);
  saveRec();
}

/* ---------- toasts ---------- */
const toastBox = (() => {
  let box = $('.toasts');
  if (!box){ box = document.createElement('div'); box.className='toasts'; document.body.appendChild(box); }
  return box;
})();
const ICONS = {
  ok:'<svg viewBox="0 0 24 24" width="16" fill="none" stroke="#fff" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>',
  rem:'<svg viewBox="0 0 24 24" width="16" fill="none" stroke="#fff" stroke-width="3"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  fav:'<svg viewBox="0 0 24 24" width="15" fill="#fff"><path d="M12 21s-7-4.5-9.5-9C.5 8 2.5 4 6 4c2 0 3.2 1.2 4 2 .8-.8 2-2 4-2 3.5 0 5.5 4 3.5 8C19 16.5 12 21 12 21z"/></svg>',
  info:'<svg viewBox="0 0 24 24" width="16" fill="#fff"><circle cx="12" cy="8" r="1.4"/><rect x="11" y="11" width="2" height="7" rx="1"/></svg>'
};
function toast(msg, kind='ok'){
  const t = document.createElement('div');
  t.className = `toast toast--${kind}`;
  t.innerHTML = `<span class="ic">${ICONS[kind]||ICONS.ok}</span><span>${msg}</span>`;
  toastBox.appendChild(t);
  setTimeout(() => { t.classList.add('out'); t.addEventListener('animationend', () => t.remove()); }, 2400);
}

/* ---------- theme ---------- */
function initTheme(){
  const saved = store.get('ml_theme', 'light');
  document.documentElement.setAttribute('data-theme', saved);
  $$('.theme-toggle').forEach(btn => btn.addEventListener('click', () => {
    const now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', now);
    store.set('ml_theme', now);
    toast(now === 'dark' ? 'Dark mode on' : 'Light mode on', 'info');
  }));
}

/* ---------- nav (hamburger / drawer / active) ---------- */
function initNav(){
  const burger = $('.hamburger'), drawer = $('.drawer');
  if (burger && drawer){
    const toggle = (open) => {
      burger.classList.toggle('is-open', open);
      drawer.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => toggle(!drawer.classList.contains('is-open')));
    $$('.drawer a').forEach(a => a.addEventListener('click', () => toggle(false)));
    window.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  }
  syncCartCount();
}

/* ---------- modal ---------- */
const backdrop = (() => {
  let b = $('.modal-back');
  if (!b){
    b = document.createElement('div'); b.className='modal-back';
    b.innerHTML = `<div class="modal" role="dialog" aria-modal="true"></div>`;
    document.body.appendChild(b);
    b.addEventListener('click', e => { if (e.target === b) closeModal(); });
    window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }
  return b;
})();
const modalEl = $('.modal', backdrop);
function openModal(html){
  modalEl.innerHTML = `<button class="modal__close" aria-label="Close">✕</button>` + html;
  $('.modal__close', modalEl).addEventListener('click', closeModal);
  backdrop.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}
function closeModal(){ backdrop.classList.remove('is-open'); document.body.style.overflow=''; }

function productModal(id){
  const p = byId(id); if (!p) return;
  pushRecent(p.id);
  const s = p.specs;
  const qty = cart[p.id] || 0;
  openModal(`
    <h2 class="modal__title">Product details</h2>
    <div class="pd">
      <div>
        <ul class="pd__specs">
          <li class="lead">Product Name: ${p.name} ${p.catLabel.slice(0,-1)}</li>
          <li>• Style: ${s.style}</li>
          <li>• Material: ${s.material}</li>
          <li>• Light Source: ${s.source}</li>
          <li>• Wattage: ${s.watt}</li>
          <li>• Color Temperature: ${s.temp}</li>
          <li>• Diameter: ${s.diam}</li>
          <li>• Adjustable Height: ${s.height}</li>
          <li>• Dimmable: ${s.dimmable}</li>
          <li>• Installation Type: ${s.install}</li>
          <li>• Room Type: ${s.room}</li>
        </ul>
        <div class="pd__price">${fmt(p.price)}</div>
        <div class="pd__qrow">
          <div class="pd__pill">
            <button class="rem" data-rem aria-label="Remove one">−</button>
            <button class="add" data-add aria-label="Add one">＋</button>
          </div>
          <span class="pd__count" data-count>${qty}</span>
        </div>
      </div>
      <div class="pd__img"><img src="${p.img}" alt="${p.name}"></div>
      <div class="pd__desc">
        <div class="lead">Description:</div>
        <p>${p.desc}</p>
      </div>
    </div>
    <div class="modal__actions">
      <button class="btn btn--gold" data-addcart>Add to cart</button>
    </div>`);
  const countEl = $('[data-count]', modalEl);
  $('[data-add]', modalEl).addEventListener('click', () => { addToCart(p.id, 1, true); countEl.textContent = cart[p.id]||0; });
  $('[data-rem]', modalEl).addEventListener('click', () => { removeFromCart(p.id); countEl.textContent = cart[p.id]||0; });
  $('[data-addcart]', modalEl).addEventListener('click', () => { addToCart(p.id, 1, true); countEl.textContent = cart[p.id]||0; });
}

function purchaseModal(){
  if (!cartCount()){ toast('Your cart is empty', 'info'); return; }
  openModal(`
    <div class="confirm">
      <div class="confirm__check">
        <svg viewBox="0 0 24 24" width="40" fill="none" stroke="#10300f" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
      </div>
      <h3>Order placed</h3>
      <p>${cartCount()} item(s) · <b>${fmt(cartTotal())}</b></p>
      <p>Thank you — we'll be in touch to arrange delivery and payment.</p>
      <div class="modal__actions" style="justify-content:center">
        <button class="btn btn--green" data-done>Done</button>
      </div>
    </div>`);
  $('[data-done]', modalEl).addEventListener('click', () => {
    cart = {}; saveCart(); renderCart(); closeModal(); toast('Order confirmed', 'ok');
  });
}

/* ---------- cart operations ---------- */
function addToCart(id, n=1, quiet=false){
  cart[id] = (cart[id]||0) + n; saveCart(); renderCart(); refreshCardBadges();
  if (!quiet) {} toast(`Added ${byId(id).name}`, 'ok');
}
function removeFromCart(id){
  if (!cart[id]) return;
  cart[id]--; if (cart[id] <= 0) delete cart[id];
  saveCart(); renderCart(); refreshCardBadges();
  toast('Removed one item', 'rem');
}
function toggleFav(id){
  if (favorites.has(id)){ favorites.delete(id); toast('Removed from favorites', 'rem'); }
  else { favorites.add(id); toast('Added to favorites', 'fav'); }
  saveFav();
}

/* ============================================================
   SHOP PAGE
   ============================================================ */
function initShop(){
  const grid = $('#grid'); if (!grid) return;
  const search = $('#search'); let activeCat = 'all', term = '';

  function list(){
    let items;
    if (activeCat === 'favorites') items = PRODUCTS.filter(p => favorites.has(p.id));
    else if (activeCat === 'recents') items = recents.map(byId).filter(Boolean);
    else if (activeCat === 'all') items = PRODUCTS.slice();
    else items = PRODUCTS.filter(p => p.cat === activeCat);
    if (term) items = items.filter(p => (p.name+' '+p.catLabel).toLowerCase().includes(term));
    return items;
  }
  function render(){
    const items = list();
    if (!items.length){ grid.innerHTML = `<div class="grid__empty">Nothing here yet — try another category.</div>`; return; }
    grid.innerHTML = items.map(p => `
      <article class="card" data-id="${p.id}">
        <div class="card__media">
          <img src="${p.img}" alt="${p.name}" loading="lazy">
          <button class="card__fav ${favorites.has(p.id)?'is-on':''}" data-fav aria-label="Favorite">
            <svg viewBox="0 0 24 24" width="18" fill="currentColor"><path d="M12 21s-7-4.5-9.5-9C.5 8 2.5 4 6 4c2 0 3.2 1.2 4 2 .8-.8 2-2 4-2 3.5 0 5.5 4 3.5 8C19 16.5 12 21 12 21z"/></svg>
          </button>
          <div class="card__actions">
            <button class="qbtn qbtn--add" data-add aria-label="Add">＋</button>
            <button class="qbtn qbtn--rem" data-rem aria-label="Remove">−</button>
            <span class="qbadge ${cart[p.id]?'show':''}" data-badge>${cart[p.id]||0}</span>
            <button class="details-btn" data-details>details</button>
          </div>
        </div>
        <div class="card__info">
          <div class="card__name">${p.name} ${p.catLabel.slice(0,-1)}</div>
          <div class="card__price">${fmt(p.price)}</div>
        </div>
      </article>`).join('');
  }
  grid.addEventListener('click', e => {
    const card = e.target.closest('.card'); if (!card) return;
    const id = +card.dataset.id;
    if (e.target.closest('[data-add]'))      { addToCart(id); updateBadge(card, id); }
    else if (e.target.closest('[data-rem]')) { removeFromCart(id); updateBadge(card, id); }
    else if (e.target.closest('[data-fav]')) { toggleFav(id); e.target.closest('[data-fav]').classList.toggle('is-on', favorites.has(id)); }
    else if (e.target.closest('[data-details]')) productModal(id);
  });
  function updateBadge(card, id){
    const b = $('[data-badge]', card); if (!b) return;
    b.textContent = cart[id]||0; b.classList.toggle('show', !!cart[id]);
  }
  window.refreshCardBadges = () => $$('.card', grid).forEach(c => updateBadge(c, +c.dataset.id));

  $$('.cat').forEach(c => c.addEventListener('click', () => {
    $$('.cat').forEach(x => x.classList.remove('is-on')); c.classList.add('is-on');
    activeCat = c.dataset.cat; render();
  }));
  if (search) search.addEventListener('input', () => { term = search.value.trim().toLowerCase(); render(); });

  // history controls (clear recents)
  const clr = $('#clear-history');
  if (clr) clr.addEventListener('click', () => {
    recents = []; saveRec(); toast('History cleared', 'info');
    if (activeCat === 'recents') render();
  });

  render();
}
window.refreshCardBadges = window.refreshCardBadges || (()=>{});

/* ============================================================
   CART PAGE (shop 2)
   ============================================================ */
function renderCart(){
  const row = $('#cart-row'); if (!row) return;
  const entries = Object.entries(cart);
  $$('[data-cart-pill-count]').forEach(el => el.textContent = cartCount());
  const totalEl = $('#cart-total'); if (totalEl) totalEl.textContent = fmt(cartTotal());
  const ordersEl = $('#orders-n'); if (ordersEl) ordersEl.textContent = cartCount();

  if (!entries.length){
    row.innerHTML = `<div class="cart-empty">Your cart is empty. Head to the shop and add a little glow.</div>`;
    return;
  }
  row.innerHTML = entries.map(([id,q]) => {
    const p = byId(id);
    return `<article class="cart-item" data-id="${id}">
      <span class="cart-item__qty">×${q}</span>
      <img src="${p.img}" alt="${p.name}">
      <button class="details-btn" data-details>details</button>
    </article>`;
  }).join('');
  row.onclick = e => {
    const it = e.target.closest('.cart-item'); if (!it) return;
    if (e.target.closest('[data-details]')) productModal(+it.dataset.id);
  };
}

/* ============================================================
   HOME 2 — five carousels
   ============================================================ */
/* ---------- tiny sound module (Web Audio, no files) ---------- */
const sound = (() => {
  let ctx, ready = false, muted = store.get('ml_muted', false);
  const ensure = () => { if (!ctx){ try { ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch {} } if (ctx && ctx.state === 'suspended') ctx.resume(); };
  window.addEventListener('pointerdown', () => { ensure(); ready = true; }, { once:true });
  function blip(freq=520, dur=0.09, type='sine', vol=0.05){
    if (muted || !ctx) return;
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.02);
    } catch {}
  }
  return {
    hover(){ blip(660, 0.07, 'sine', 0.035); },
    click(){ blip(780, 0.10, 'triangle', 0.05); setTimeout(()=>blip(1040,0.08,'sine',0.04), 60); },
    tick(){ if (ready) blip(440, 0.05, 'sine', 0.02); },
    get muted(){ return muted; },
    toggle(){ muted = !muted; store.set('ml_muted', muted); if (!muted){ ensure(); blip(720,0.08,'sine',0.04);} return muted; }
  };
})();

const OFFS = { up:[0,30], down:[0,-30], left:[30,0], right:[-30,0], diag:[26,26] };
class Carousel{
  constructor(el){
    this.el = el;
    this.dir = el.dataset.dir || 'right';
    this.int = +el.dataset.int || 3400;
    this.ids = (el.dataset.ids||'').split(',').map(Number).filter(n=>!isNaN(n));
    if (!this.ids.length) this.ids = PRODUCTS.filter(p=>p.cat==='chandeliers').slice(0,4).map(p=>p.id);
    this.vp = $('.carousel__viewport', el);
    if (!this.vp){ this.vp = document.createElement('div'); this.vp.className = 'carousel__viewport'; el.appendChild(this.vp); }
    this.i = 0; this.paused = false;
    this._build();
    this._show(0, true);
    this.el.style.setProperty('--int', this.int+'ms');
    this.timer = setInterval(() => { if (!this.paused) this.next(); }, this.int);
    el.addEventListener('mouseenter', () => { this.paused = true; sound.hover(); });
    el.addEventListener('mouseleave', () => this.paused = false);
    el.addEventListener('click', () => { sound.click(); productModal(this.ids[this.i]); });
  }
  _build(){
    const track = document.createElement('div'); track.className = 'carousel__track';
    this.slides = this.ids.map((id,k) => {
      const img = document.createElement('img');
      img.className = 'carousel__slide carousel__img';
      img.src = byId(id).img; img.alt = byId(id).name; img.loading = 'lazy';
      track.appendChild(img); return img;
    });
    this.vp.appendChild(track);
    const dots = document.createElement('div'); dots.className = 'dots';
    this.dots = this.ids.map((_,k) => { const d=document.createElement('span'); d.className='dot'; dots.appendChild(d); return d; });
    this.el.appendChild(dots);
  }
  _show(n, instant){
    const [ox,oy] = OFFS[this.dir] || OFFS.right;
    this.slides.forEach((s,k) => {
      if (k === n){
        if (!instant){ s.style.transition='none'; s.style.transform=`translate(${ox}%,${oy}%)`; s.offsetHeight;
          s.style.transition=''; }
        s.style.transform = 'translate(0,0)'; s.classList.add('is-on');
      } else { s.classList.remove('is-on'); }
    });
    this.dots.forEach((d,k) => d.classList.toggle('is-on', k===n));
    this.i = n;
  }
  next(){ this._show((this.i + 1) % this.ids.length); sound.tick(); }
}
function initCarousels(){
  const els = $$('.carousel'); if (!els.length) return;
  els.forEach(el => { try { new Carousel(el); } catch(err){ console.warn('carousel', err); } });
}

/* ============================================================
   3D SQUARES depth field  (shop bg + contact checker)
   ============================================================ */
class SquareField{
  constructor(canvas, opts={}){
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.opt = Object.assign({
      density: 0.00010, max: 240, focal: 360, depth: 1000, speed: 2.4,
      colors: ['#f3a72b','#e89b1c','#fbe3a6','#fff4d6','#f8d977'],
      spin: 0.5, dprCap: 2, biasRight: true, alpha: 0.55, minAlpha: 0
    }, opts);
    this.sq = [];
    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize, { passive:true });
    document.addEventListener('visibilitychange', () => document.hidden ? this.stop() : this.start());
    this._resize();
    this.reduce ? this._draw() : this.start();
  }
  _make(z){
    const o = this.opt;
    return { x: (Math.random()*2-1), y: (Math.random()*2-1),
      z: z!=null ? z : 1 + Math.random()*o.depth,
      rot: Math.random()*Math.PI, vr: (Math.random()*2-1)*o.spin*0.01,
      c: o.colors[(Math.random()*o.colors.length)|0] };
  }
  _build(){
    const n = Math.min(this.opt.max, Math.round(this.W*this.H*this.opt.density));
    this.sq = Array.from({length:n}, () => this._make());
  }
  _resize(){
    this.dpr = Math.min(window.devicePixelRatio||1, this.opt.dprCap);
    this.W = this.c.clientWidth; this.H = this.c.clientHeight;
    this.cx = this.opt.biasRight ? this.W*0.72 : this.W*0.5; this.cy = this.H*0.5;
    this.c.width = this.W*this.dpr; this.c.height = this.H*this.dpr;
    this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    this._build();
  }
  _draw(){
    const o = this.opt, ctx = this.ctx;
    ctx.clearRect(0,0,this.W,this.H);
    for (const s of this.sq){
      const k = o.focal / s.z;
      const sx = this.cx + s.x * o.focal * k;
      const sy = this.cy + s.y * o.focal * k;
      const size = Math.max(2, 26 * k);
      const depthT = 1 - s.z / o.depth;
      const alpha = Math.min(1, o.minAlpha + depthT*1.4) * Math.min(1, s.z/70) * o.alpha;
      ctx.save();
      ctx.translate(sx, sy); ctx.rotate(s.rot);
      ctx.globalAlpha = alpha; ctx.fillStyle = s.c;
      ctx.fillRect(-size/2, -size/2, size, size);
      ctx.restore();
    }
  }
  _step(){
    const o = this.opt;
    for (const s of this.sq){ s.z -= o.speed; s.rot += s.vr; if (s.z < 1) Object.assign(s, this._make(o.depth)); }
    this._draw();
    this.raf = requestAnimationFrame(() => this._step());
  }
  start(){ if (!this.raf && !this.reduce) this._step(); }
  stop(){ cancelAnimationFrame(this.raf); this.raf = 0; }
}
function initSquares(){
  const fx = $('#fx');
  if (fx) new SquareField(fx, { biasRight:true, density:0.00013, max:300, speed:2.8 });
  const ch = $('#checker');
  if (ch) new SquareField(ch, { biasRight:true, density:0.00009, max:200, speed:1.8 });
  const ab = $('#about-fx');
  if (ab) new SquareField(ab, { biasRight:false, density:0.00017, max:380, speed:1.7, depth:780, focal:430,
    alpha:0.85, minAlpha:0.32, colors:['#f0a31f','#e89b1c','#f6c258','#fbe3a6','#caa13f'] });
}

/* ============================================================
   LANDING — lamp head tracking + spotlight + beam
   ============================================================ */
function initLanding(){
  const stage = $('#stage'); if (!stage) return;
  const head=$('#lampHead'), beam=$('#beam'), lamp=$('.lamp'), spot=$('#spot'), pool=$('#pool'),
        ghost=$('#ghost'), hero=$('#hero'), lampStage=$('#lampStage');
  let tx=-4, cur=-4, bx=0, cbx=0, mx=.72, my=.42, cmx=.72, cmy=.42, raf;
  function onMove(e){
    const px=(e.touches?e.touches[0].clientX:e.clientX), py=(e.touches?e.touches[0].clientY:e.clientY);
    if(px==null) return;
    mx=px/innerWidth; my=py/innerHeight;
    // head turn — pivot ~70%/19%; clamp to a natural range (clean split, no seam)
    tx=Math.max(-22, Math.min(15, (mx-0.66)*42 + (my-0.40)*-14));
    if(lamp && beam){
      const r=lamp.getBoundingClientRect();
      const ox=r.left + r.width*0.30, oy=r.top + r.height*0.22;
      bx=Math.atan2(py-oy, px-ox)*180/Math.PI;
    }
  }
  function tick(){
    cur+=(tx-cur)*0.1; cbx+=(bx-cbx)*0.1; cmx+=(mx-cmx)*0.16; cmy+=(my-cmy)*0.16;
    if(spot){ spot.style.setProperty('--mx',(cmx*100).toFixed(2)+'%'); spot.style.setProperty('--my',(cmy*100).toFixed(2)+'%'); }
    if(pool){ pool.style.left=(cmx*100).toFixed(2)+'%'; pool.style.top=(cmy*100).toFixed(2)+'%'; }
    if(head) head.style.transform=`rotate(${cur.toFixed(2)}deg)`;
    if(beam) beam.style.transform=`rotate(${cbx.toFixed(2)}deg)`;
    const dx=cmx-0.5, dy=cmy-0.5;        // parallax for depth
    if(ghost) ghost.style.transform=`translate(calc(-50% + ${(dx*-40).toFixed(1)}px), calc(-50% + ${(dy*-26).toFixed(1)}px))`;
    if(hero) hero.style.transform=`translateY(-50%) translate(${(dx*-16).toFixed(1)}px, ${(dy*-10).toFixed(1)}px)`;
    if(lampStage) lampStage.style.transform=`translate(${(dx*22).toFixed(1)}px, ${(dy*14).toFixed(1)}px)`;
    raf=requestAnimationFrame(tick);
  }
  window.addEventListener('pointermove', onMove, {passive:true});
  window.addEventListener('touchmove', onMove, {passive:true});
  tick();
}

/* ============================================================
   text split + reveal + back-to-top
   ============================================================ */
function splitText(){
  $$('.split').forEach(el => {
    if (el.dataset.split) return; el.dataset.split = '1';
    const nodes = [...el.childNodes];
    el.textContent = ''; let idx = 0;
    nodes.forEach(node => {
      if (node.nodeType === 3){
        node.textContent.split(/(\s+)/).forEach(chunk => {
          if (chunk === '') return;
          if (/^\s+$/.test(chunk)){ el.appendChild(document.createTextNode(' ')); return; }
          const word = document.createElement('span'); word.className = 'word';
          [...chunk].forEach(ch => {
            const s = document.createElement('span'); s.className = 'char';
            s.textContent = ch; s.style.animationDelay = (idx++ * 0.03) + 's';
            word.appendChild(s);
          });
          el.appendChild(word);
        });
      } else {
        el.appendChild(node.cloneNode(true));   // preserve <br> etc.
      }
    });
  });
}
function playMotion(el){ el.classList.remove('is-in'); void el.offsetWidth; el.classList.add('is-in'); }
function initMotion(){
  const els = $$('.split, .reveal'); if (!els.length) return;
  const io = new IntersectionObserver((ents) => {
    ents.forEach(en => { if (en.isIntersecting) playMotion(en.target); else en.target.classList.remove('is-in'); });
  }, { threshold:0.2 });
  els.forEach(el => io.observe(el));
  // replay everything currently on-screen when the tab/page is returned to
  const replayVisible = () => els.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight*0.85 && r.bottom > innerHeight*0.05) playMotion(el);
    else el.classList.remove('is-in');
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) replayVisible(); });
  window.addEventListener('pageshow', replayVisible);
  window.addEventListener('focus', replayVisible);
}
function initToTop(){
  $$('.to-top, [data-totop]').forEach(b => b.addEventListener('click', () => {
    const snap = $('.snap'); (snap||window).scrollTo({ top:0, behavior:'smooth' });
  }));
}

/* ============================================================
   CONTACT form
   ============================================================ */
function initContact(){
  const form = $('#contact-form'); if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#cf-name'), email = $('#cf-email'), msg = $('#cf-msg');
    let ok = true;
    const setErr = (input, m) => { input.parentElement.querySelector('.err').textContent = m || ''; if (m) ok=false; };
    setErr(name, name.value.trim() ? '' : 'Please enter your name');
    setErr(email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value) ? '' : 'Enter a valid email');
    setErr(msg, msg.value.trim().length >= 5 ? '' : 'Tell us a little more');
    if (!ok){ toast('Please check the form', 'rem'); return; }
    openModal(`
      <div class="confirm">
        <div class="confirm__check"><svg viewBox="0 0 24 24" width="40" fill="none" stroke="#10300f" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg></div>
        <h3>Message sent</h3>
        <p>Thanks ${name.value.trim().split(' ')[0]} — we'll reply to <b>${email.value.trim()}</b> shortly.</p>
        <div class="modal__actions" style="justify-content:center"><button class="btn btn--green" data-done>Close</button></div>
      </div>`);
    $('[data-done]', modalEl).addEventListener('click', closeModal);
    form.reset();
    toast('Message sent', 'ok');
  });
}

/* ---------- star rating ---------- */
function initStars(){
  $$('.stars').forEach(box => {
    const key = box.dataset.key || 'ml_rating';
    let val = store.get(key, 0);
    const build = () => {
      box.innerHTML = '';
      for (let i=1;i<=5;i++){
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'star' + (i<=val?' on':''); b.dataset.v = i;
        b.setAttribute('aria-label', i+' star'+(i>1?'s':''));
        b.innerHTML = '<svg viewBox="0 0 24 24" width="26"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 21.4l1.4-6.8L2.2 9.9l6.9-.8z"/></svg>';
        b.addEventListener('mouseenter', () => paint(i));
        b.addEventListener('click', () => { val = i; store.set(key, val); paint(val); sound.click(); toast(`Rated ${i}/5 — thank you`, 'ok'); });
        box.appendChild(b);
      }
      paint(val);
    };
    const paint = (n) => $$('.star', box).forEach(s => s.classList.toggle('on', +s.dataset.v <= n));
    box.addEventListener('mouseleave', () => paint(val));
    build();
  });
}

/* ---------- sound mute toggle ---------- */
function initMute(){
  $$('.mute-toggle').forEach(btn => {
    const sync = () => btn.classList.toggle('is-muted', sound.muted);
    sync();
    btn.addEventListener('click', () => { sound.toggle(); sync(); });
  });
}

/* ---------- ABOUT — futuristic Ambiance Studio ---------- */
function initAmbiance(){
  const studio = $('#ambiance'); if (!studio) return;
  const warm = $('#amb-warm', studio), bright = $('#amb-bright', studio), beam = $('#amb-beam', studio);
  const scene = $('.amb__scene', studio), tempOut = $('#amb-temp', studio);
  function apply(){
    const w = +warm.value;     // 0 cool .. 100 warm
    const b = +bright.value;    // 0 dim .. 100 bright
    const kelvin = Math.round(6500 - (w/100)*(6500-2200));
    const hue = 32 + (1 - w/100)*180;        // warm amber -> cool blue
    const light = 0.35 + b/100*0.65;
    if (scene){
      scene.style.filter = `brightness(${0.55 + b/100*0.9}) saturate(${0.8 + w/100*0.5}) sepia(${w/180})`;
    }
    if (beam){
      beam.style.background = `radial-gradient(60% 70% at 50% 0%, hsla(${hue},90%,70%,${light}) 0%, hsla(${hue},90%,60%,${light*0.4}) 40%, transparent 72%)`;
    }
    if (tempOut) tempOut.textContent = kelvin + 'K · ' + b + '%';
    studio.style.setProperty('--amb-glow', `hsla(${hue},90%,62%,${0.25+light*0.4})`);
  }
  [warm, bright].forEach(s => s && s.addEventListener('input', () => { apply(); }));
  // preset chips
  $$('.amb__preset', studio).forEach(p => p.addEventListener('click', () => {
    warm.value = p.dataset.w; bright.value = p.dataset.b; apply(); sound.click();
    $$('.amb__preset', studio).forEach(x => x.classList.remove('on')); p.classList.add('on');
    toast('Scene: ' + p.textContent.trim(), 'info');
  }));
  apply();
}

/* ---------- bootstrap ---------- */
function initCartNav(){
  const purchaseBtn = $('#purchase');
  if (purchaseBtn) purchaseBtn.addEventListener('click', purchaseModal);
  // smooth-scroll cart links that point to an on-page #cart
  $$('a.cart-link').forEach(a => {
    if ((a.getAttribute('href')||'').endsWith('#cart')){
      const t = $('#cart');
      if (t) a.addEventListener('click', e => { e.preventDefault(); t.scrollIntoView({ behavior:'smooth' }); });
    }
  });
  if (location.hash){ const t = $(location.hash); if (t) setTimeout(() => t.scrollIntoView({ behavior:'smooth' }), 350); }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme(); initNav(); splitText(); initMotion(); initToTop();
  initLanding(); initCarousels(); initSquares(); initShop(); renderCart();
  initContact(); initCartNav(); initStars(); initMute(); initAmbiance();
});
})();
