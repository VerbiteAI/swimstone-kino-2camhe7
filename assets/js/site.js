/* Swimstone · cały serwis · wspólne zachowania: mega menu, wyszukiwarka, lista zapytania, wideo, liczniki, filtry, formularze. */
(() => {
  const d = document;
  const root = d.documentElement.dataset.root || './';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPhone = () => innerWidth < 768;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nav = d.querySelector('[data-nav]');

  /* ---------------------------------------------------------------- nawigacja: przewijanie, telefon, język */
  const onScrollNav = () => nav.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();
  const burger = d.querySelector('.nav__burger');
  const menu = d.getElementById('menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
    menu.hidden = !open;
    nav.classList.toggle('is-open', open);
    d.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  const maccs = [...menu.querySelectorAll('.macc')];
  maccs.forEach((m) => m.addEventListener('toggle', () => { if (m.open) maccs.forEach((o) => { if (o !== m) o.open = false; }); }));
  const langBtn = d.querySelector('.lang__btn');
  const langMenu = d.getElementById('lang-menu');
  const setLang = (open) => { langBtn.setAttribute('aria-expanded', String(open)); langMenu.hidden = !open; };
  langBtn.addEventListener('click', (e) => { e.stopPropagation(); setLang(langMenu.hidden); });
  langMenu.addEventListener('click', (e) => { if (e.target.closest('a')) { e.preventDefault(); setLang(false); } });

  /* ---------------------------------------------------------------- mega menu */
  const veil = d.createElement('div');
  veil.className = 'mega-veil';
  d.body.append(veil);
  const megaBtns = [...d.querySelectorAll('[data-mega-btn]')];
  const megas = new Map([...d.querySelectorAll('[data-mega]')].map((m) => [m.dataset.mega, m]));
  let openKey = null;
  let closeT = 0;
  const closeMega = () => {
    if (!openKey) return;
    const m = megas.get(openKey);
    m.classList.remove('is-open');
    const k = openKey;
    setTimeout(() => { if (openKey !== k) m.hidden = true; }, reduce ? 0 : 220);
    megaBtns.forEach((b) => b.setAttribute('aria-expanded', 'false'));
    veil.classList.remove('is-on');
    openKey = null;
  };
  const openMega = (key) => {
    clearTimeout(closeT);
    if (openKey === key) return;
    if (openKey) { const prev = megas.get(openKey); prev.classList.remove('is-open'); prev.hidden = true; }
    const m = megas.get(key);
    m.hidden = false;
    requestAnimationFrame(() => m.classList.add('is-open'));
    megaBtns.forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.megaBtn === key)));
    veil.classList.add('is-on');
    openKey = key;
  };
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  megaBtns.forEach((b) => {
    b.addEventListener('click', () => (openKey === b.dataset.megaBtn ? closeMega() : openMega(b.dataset.megaBtn)));
    if (fine) {
      b.addEventListener('pointerenter', () => { clearTimeout(closeT); closeT = setTimeout(() => openMega(b.dataset.megaBtn), openKey ? 0 : 90); });
      b.addEventListener('pointerleave', () => { clearTimeout(closeT); closeT = setTimeout(closeMega, 260); });
    }
  });
  megas.forEach((m) => {
    m.addEventListener('pointerenter', () => clearTimeout(closeT));
    if (fine) m.addEventListener('pointerleave', () => { closeT = setTimeout(closeMega, 260); });
  });
  veil.addEventListener('click', closeMega);

  d.addEventListener('click', (e) => {
    if (!e.target.closest('[data-lang]')) setLang(false);
    if (openKey && !e.target.closest('[data-mega]') && !e.target.closest('[data-mega-btn]')) closeMega();
  });

  /* ---------------------------------------------------------------- wyszukiwarka */
  const search = d.querySelector('[data-search]');
  const sInput = search.querySelector('[data-search-input]');
  const sList = search.querySelector('[data-search-results]');
  const idx = (window.SS_INDEX || []);
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
  idx.forEach((i) => { i._n = norm(` ${i.t} ${i.d}`); i._t = norm(i.t); });
  let sel = -1;
  const mark = (text, q) => {
    if (!q) return esc(text);
    const n = norm(text);
    const at = n.indexOf(q);
    if (at < 0) return esc(text);
    return `${esc(text.slice(0, at))}<mark>${esc(text.slice(at, at + q.length))}</mark>${esc(text.slice(at + q.length))}`;
  };
  const renderSearch = () => {
    const q = norm(sInput.value.trim());
    sel = -1;
    if (!q) { sList.innerHTML = ''; return; }
    const words = q.split(/\s+/).map((w) => (w.length >= 4 ? w.slice(0, -1) : w));
    const score = (i) => words.reduce((a, w) => {
      const t = ` ${i._t}`;
      return a + (t.includes(` ${w}`) ? 4 : i._t.includes(w) ? 2 : i._n.includes(` ${w}`) ? 1 : 0);
    }, 0);
    const hits = idx.filter((i) => words.every((w) => i._n.includes(w)))
      .map((i, o) => [i, score(i), o]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map((x) => x[0]).slice(0, 12);
    sList.innerHTML = hits.length
      ? hits.map((h) => `<li><a href="${root}${h.u}"><b>${mark(h.t, words[0])}</b><small>${esc(h.d || '')}</small><em>${esc(h.k)}</em></a></li>`).join('')
      : '<li class="is-empty">Nic nie znaleźliśmy. Napisz do nas, a przygotujemy ofertę.</li>';
  };
  const openSearch = () => { closeMega(); search.hidden = false; d.body.style.overflow = 'hidden'; sInput.focus(); renderSearch(); };
  const closeSearch = () => { search.hidden = true; d.body.style.overflow = ''; };
  d.querySelectorAll('[data-search-open]').forEach((b) => b.addEventListener('click', openSearch));
  search.querySelector('[data-search-close]').addEventListener('click', closeSearch);
  search.addEventListener('click', (e) => { if (e.target === search) closeSearch(); });
  search.querySelectorAll('[data-search-q]').forEach((b) => b.addEventListener('click', () => { sInput.value = b.dataset.searchQ; renderSearch(); sInput.focus(); }));
  sInput.addEventListener('input', renderSearch);
  sInput.addEventListener('keydown', (e) => {
    const links = [...sList.querySelectorAll('a')];
    if (!links.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links.forEach((l, i) => l.classList.toggle('is-sel', i === sel));
      links[sel].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') { e.preventDefault(); (links[sel] || links[0]).click(); }
  });

  /* ---------------------------------------------------------------- lista zapytania */
  const KEY = 'swimstone-quote';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  let quote = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(quote)); } catch { /* prywatny tryb */ } };
  const drawer = d.querySelector('[data-quote]');
  const qList = drawer.querySelector('[data-quote-list]');
  const qEmpty = drawer.querySelector('[data-quote-empty]');
  const counts = [...d.querySelectorAll('[data-quote-count]')];
  const X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const fixImg = (src) => (src.startsWith('http') ? src : root + src);
  const syncQuote = (pop) => {
    counts.forEach((c) => {
      c.textContent = quote.length;
      c.hidden = !quote.length;
      if (pop) { c.classList.remove('is-pop'); void c.offsetWidth; c.classList.add('is-pop'); }
    });
    const item = (q, i) => `<li>${q.img ? `<img src="${fixImg(q.img)}" alt="" loading="lazy">` : '<i class="q-noimg" aria-hidden="true"></i>'}<span>${esc(q.name)}</span><button type="button" data-quote-del="${i}" aria-label="Usuń z zapytania: ${esc(q.name)}">${X}</button></li>`;
    qList.innerHTML = quote.map(item).join('');
    qEmpty.hidden = quote.length > 0;
    d.querySelectorAll('[data-quote-add]').forEach((b) => {
      const on = quote.some((q) => q.name === b.dataset.name);
      b.classList.toggle('is-added', on);
      const label = b.querySelector('span');
      if (label) label.textContent = on ? 'Dodano do zapytania' : 'Dodaj do zapytania';
      b.setAttribute('aria-pressed', String(on));
    });
    d.querySelectorAll('[data-mbar-label]').forEach((l) => { l.textContent = quote.length ? `Wyślij zapytanie (${quote.length})` : 'Zapytaj o ofertę'; });
    d.querySelectorAll('[data-form-quote]').forEach((box) => {
      box.hidden = !quote.length;
      box.querySelector('[data-form-quote-list]').innerHTML = quote.map(item).join('');
      const n = box.querySelector('[data-form-quote-n]');
      if (n) n.textContent = quote.length;
      const inp = box.querySelector('[data-form-quote-input]');
      if (inp) inp.value = quote.map((q) => q.name).join('; ');
    });
  };
  d.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.closest('[data-quote-list], [data-form-quote-list]')) {
      const ph = d.createElement('i'); ph.className = 'q-noimg'; ph.setAttribute('aria-hidden', 'true'); img.replaceWith(ph);
    }
  }, true);
  d.addEventListener('click', (e) => {
    const add = e.target.closest('[data-quote-add]');
    if (add) {
      const i = quote.findIndex((q) => q.name === add.dataset.name);
      if (i >= 0) quote.splice(i, 1); else quote.push({ name: add.dataset.name, img: add.dataset.img || '' });
      save(); syncQuote(i < 0);
    }
    const del = e.target.closest('[data-quote-del]');
    if (del) {
      const list = del.closest('ul');
      const at = +del.dataset.quoteDel;
      quote.splice(at, 1); save(); syncQuote();
      const rest = list ? list.querySelectorAll('[data-quote-del]') : [];
      const next = rest[Math.min(at, rest.length - 1)];
      if (next) next.focus();
      else { const box = list && list.closest('[data-form-quote], [data-quote]'); const f = box && box.querySelector('[data-quote-close], textarea, input:not([type=hidden])'); if (f) f.focus(); else { const form = list && list.closest('form'); if (form) (form.querySelector('textarea') || form).focus(); } }
    }
  });
  const openDrawer = () => { closeMega(); drawer.hidden = false; d.body.style.overflow = 'hidden'; drawer.querySelector('[data-quote-close]').focus(); };
  const closeDrawer = () => { drawer.hidden = true; d.body.style.overflow = ''; };
  d.querySelectorAll('[data-quote-open]').forEach((b) => b.addEventListener('click', openDrawer));
  drawer.querySelector('[data-quote-close]').addEventListener('click', closeDrawer);
  drawer.addEventListener('click', (e) => { if (e.target === drawer || e.target.closest('.drawer__foot a')) closeDrawer(); });
  drawer.querySelector('[data-quote-clear]').addEventListener('click', () => { quote = []; save(); syncQuote(); });
  addEventListener('storage', (e) => { if (e.key === KEY) { quote = load(); syncQuote(); } });
  syncQuote();

  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!search.hidden) closeSearch();
      else if (!drawer.hidden) closeDrawer();
      else if (openKey) { const b = megaBtns.find((x) => x.dataset.megaBtn === openKey); closeMega(); if (b) b.focus(); }
      else if (!langMenu.hidden) { setLang(false); langBtn.focus(); }
      else if (!menu.hidden) { setMenu(false); burger.focus(); }
    }
    if (e.key === '/' && !/input|textarea/i.test(e.target.tagName)) { e.preventDefault(); openSearch(); }
  });

  /* ---------------------------------------------------------------- wideo */
  let paused = reduce;
  const vids = [...d.querySelectorAll('video[data-src]')];
  const loadV = (v) => {
    if (v.dataset.loaded) return;
    const mobileOk = !v.dataset.mOnly || v.dataset.mOnly === d.documentElement.dataset.variant;
    v.src = (isPhone() && mobileOk && v.dataset.srcM) || v.dataset.src;
    v.dataset.loaded = '1';
  };
  const tryPlay = (v) => { if (paused || !v._vis) return; loadV(v); const p = v.play(); if (p) p.catch(() => {}); };
  vids.forEach((v) => { if (isPhone() && v.dataset.posterM) v.poster = v.dataset.posterM; });
  const vio = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target; v._vis = e.isIntersecting;
    if (v._vis) { loadV(v); tryPlay(v); } else v.pause();
  }), { rootMargin: '160px 0px', threshold: 0.01 });
  vids.forEach((v) => vio.observe(v));
  const pauseBtns = [...d.querySelectorAll('[data-pause]')];
  const syncPause = () => pauseBtns.forEach((b) => { b.setAttribute('aria-pressed', String(paused)); b.setAttribute('aria-label', paused ? 'Odtwórz wideo na stronie' : 'Zatrzymaj wideo na stronie'); });
  pauseBtns.forEach((b) => b.addEventListener('click', () => { paused = !paused; syncPause(); vids.forEach((v) => (paused ? v.pause() : tryPlay(v))); }));
  syncPause();
  const vfloat = d.querySelector('.vfloat');
  const hero = d.querySelector('[data-hero]');
  if (vfloat && hero) new IntersectionObserver(([e]) => vfloat.classList.toggle('is-on', !e.isIntersecting)).observe(hero);

  /* ---------------------------------------------------------------- wejścia (raz) */
  const enter = () => requestAnimationFrame(() => { if (hero) hero.classList.add('is-in'); d.querySelectorAll('.phero').forEach((p) => p.classList.add('is-in')); });
  (d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve()).then(enter);
  setTimeout(enter, 900);
  const rv = [...d.querySelectorAll('.rv')];
  if (reduce) rv.forEach((el) => el.classList.add('is-in'));
  else {
    const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
    rv.forEach((el) => rio.observe(el));
  }

  /* ---------------------------------------------------------------- zdanie podświetlane słowo po słowie */
  const statement = d.querySelector('[data-statement]');
  const words = [];
  const wrapWords = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = d.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(d.createTextNode(part)); return; }
        const s = d.createElement('span'); s.className = 'w'; s.textContent = part; words.push(s); frag.append(s);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1) wrapWords(n);
  });
  if (statement && !reduce) {
    wrapWords(statement);
    const lightUp = () => {
      const r = statement.getBoundingClientRect();
      const p = clamp((innerHeight * 0.88 - r.top) / (r.height + innerHeight * 0.42));
      const lit = p * words.length;
      words.forEach((w, i) => w.style.setProperty('--wo', (0.22 + 0.78 * clamp(lit - i)).toFixed(2)));
    };
    addEventListener('scroll', () => requestAnimationFrame(lightUp), { passive: true });
    lightUp();
  }

  /* ---------------------------------------------------------------- liczby z wodą (dół cyfr w kolorze wody, jak w logo) */
  const wls = [...d.querySelectorAll('.wl')];
  wls.forEach((el) => {
    const txt = el.textContent;
    const top = d.createElement('span'); top.className = 'wl__t'; top.append(d.createTextNode(txt));
    const probe = d.createElement('i'); probe.className = 'wl__probe'; top.append(probe);
    const water = d.createElement('span'); water.className = 'wl__w'; water.setAttribute('aria-hidden', 'true'); water.textContent = txt;
    el.replaceChildren(top, water);
  });
  const measure = () => wls.forEach((el) => {
    const fs = parseFloat(getComputedStyle(el).fontSize);
    el.style.setProperty('--cut', `${(el.querySelector('.wl__probe').offsetTop - 0.11 * fs).toFixed(1)}px`);
  });
  const setText = (el, s) => { el.querySelector('.wl__t').firstChild.nodeValue = s; el.querySelector('.wl__w').textContent = s; };
  const count = (el) => {
    const to = parseFloat(el.dataset.count);
    if (Number.isNaN(to) || reduce) { el.classList.add('is-wet'); return; }
    const from = parseFloat(el.dataset.from || 0);
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / 1500);
      setText(el, String(Math.round(from + (to - from) * ease(k))));
      if (k < 1) requestAnimationFrame(tick); else el.classList.add('is-wet');
    };
    requestAnimationFrame(tick);
  };
  (d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve()).then(measure);
  addEventListener('resize', measure);
  const sio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    sio.unobserve(e.target); measure();
    setTimeout(() => count(e.target), 140 * wls.indexOf(e.target));
  }), { threshold: 0.6 });
  wls.forEach((el) => sio.observe(el));

  /* ---------------------------------------------------------------- filtry kategorii i przełączniki */
  const pgrid = d.querySelector('[data-pgrid]');
  d.querySelectorAll('.filter').forEach((f) => f.addEventListener('click', () => {
    const group = f.parentElement;
    group.querySelectorAll('.filter').forEach((x) => { x.classList.toggle('is-on', x === f); x.setAttribute('aria-pressed', String(x === f)); });
    if (pgrid && f.dataset.filter) pgrid.querySelectorAll('.pcard').forEach((c) => { c.hidden = f.dataset.filter !== 'all' && c.dataset.tag !== f.dataset.filter; });
  }));

  /* ---------------------------------------------------------------- poświata za kursorem */
  d.querySelectorAll('[data-glow]').forEach((card) => card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  /* ---------------------------------------------------------------- formularze */
  const topic = new URLSearchParams(location.search).get('temat');
  d.querySelectorAll('[data-form]').forEach((form) => {
    if (topic) { const r = form.querySelector(`input[name="typ"][value="${topic}"]`); if (r) r.checked = true; }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      form.querySelectorAll('[required]').forEach((f) => {
        const val = f.value.trim();
        const bad = f.type === 'checkbox' ? !f.checked
          : !val
          || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(val))
          || (f.matches('[data-tel-mask]') && val.replace(/\D/g, '').length < 9);
        f.closest('.field, .check').classList.toggle('is-invalid', bad);
        f.setAttribute('aria-invalid', String(bad));
        if (bad && ok) { f.focus(); ok = false; }
      });
      form.querySelector('.form__note').hidden = !ok;
    });
    form.addEventListener('input', (e) => { const box = e.target.closest('.is-invalid'); if (box) box.classList.remove('is-invalid'); });
  });
  /* ---------------------------------------------------------------- numery telefonów ukryte do kliknięcia; jedno kliknięcie odsłania wszystkie (zapamiętane) */
  const TEL_KEY = 'swimstone-tel';
  const telLinks = [...d.querySelectorAll('a[href^="tel:"]')].filter((a) => a.textContent.replace(/\D/g, '').length >= 9);
  const maskTel = (t) => { const n = t.replace(/\D/g, '').length; let i = 0; return t.replace(/\d/g, (m) => (++i > n - 6 ? '•' : m)); };
  let telShown = false;
  try { telShown = localStorage.getItem(TEL_KEY) === '1'; } catch { /* prywatny tryb */ }
  const telButtons = [...d.querySelectorAll('[data-tel-show]')];
  const showTel = () => {
    telShown = true;
    try { localStorage.setItem(TEL_KEY, '1'); } catch { /* prywatny tryb */ }
    telLinks.forEach((a) => { if (a.dataset.telFull) a.textContent = a.dataset.telFull; a.classList.remove('is-masked'); a.removeAttribute('aria-label'); });
    telButtons.forEach((b) => { b.hidden = true; });
  };
  if (telShown) telButtons.forEach((b) => { b.hidden = true; });
  else {
    telLinks.forEach((a) => {
      a.dataset.telFull = a.textContent;
      a.textContent = maskTel(a.textContent);
      a.classList.add('is-masked');
      a.setAttribute('aria-label', 'Pokaż numer telefonu');
      a.addEventListener('click', (e) => { if (!telShown) { e.preventDefault(); showTel(); } });
    });
    telButtons.forEach((b) => b.addEventListener('click', showTel));
  }
  d.querySelectorAll('[data-tel-call]').forEach((a) => a.addEventListener('click', () => { if (!telShown) showTel(); }));

  /* ---------------------------------------------------------------- pasek na dole ekranu (telefon): zapytanie i telefon */
  const mbar = d.querySelector('[data-mbar]');
  if (mbar) {
    const forms = [...d.querySelectorAll('[data-form]')];
    const seen = new Set();
    const upd = () => {
      const on = scrollY > innerHeight * 0.6 && seen.size === 0;
      mbar.classList.toggle('is-on', on);
      mbar.inert = !on;
    };
    if (forms.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target))); upd(); }, { rootMargin: '0px 0px -15% 0px' });
      forms.forEach((f) => io.observe(f));
    }
    addEventListener('scroll', upd, { passive: true });
    upd();
    mbar.querySelector('[data-mbar-cta]').addEventListener('click', (e) => {
      if (!forms.length) return;
      e.preventDefault();
      forms[0].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* ---------------------------------------------------------------- maska telefonu ___-___-___ */
  d.querySelectorAll('[data-tel-mask]').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const v = inp.value;
      if (v.trim().startsWith('+')) { inp.value = v.replace(/[^\d+ ]/g, ''); return; }
      if (e.inputType && e.inputType.startsWith('delete')) { inp.value = v.replace(/-$/, ''); return; }
      let dg = v.replace(/\D/g, '');
      if (dg.length > 9 && dg.startsWith('48')) dg = dg.slice(2);
      dg = dg.slice(0, 9);
      inp.value = [dg.slice(0, 3), dg.slice(3, 6), dg.slice(6, 9)].filter(Boolean).join('-');
    });
  });

  /* ---------------------------------------------------------------- podpowiedzi lokalizacji (Photon, dane OpenStreetMap, bez klucza API) */
  const GEO_URL = 'https://photon.komoot.io/api/';
  const PL_BOX = '14.07,49.0,24.15,54.84';
  const GEO_SKIP = new Set(['highway', 'railway', 'public_transport', 'historic', 'shop', 'power', 'office', 'craft', 'man_made', 'barrier', 'emergency', 'aeroway', 'boundary']);
  const GEO_KIND = { reservoir: 'zalew', lake: 'jezioro', pond: 'staw', river: 'rzeka', canal: 'kanał', water: 'akwen', bay: 'zatoka', swimming_pool: 'pływalnia', water_park: 'aquapark', sports_centre: 'obiekt sportowy', beach_resort: 'kąpielisko', swimming_area: 'kąpielisko', beach: 'plaża', marina: 'przystań', camp_site: 'kemping', hotel: 'hotel', city: 'miasto', town: 'miasto', village: 'wieś', hamlet: 'osada', suburb: 'dzielnica', neighbourhood: 'osiedle', park: 'park' };
  let geoN = 0;
  d.querySelectorAll('input[name="where"]').forEach((input) => {
    const id = `geo-${++geoN}`;
    const list = d.createElement('ul');
    list.className = 'geo'; list.id = id; list.hidden = true;
    list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', 'Podpowiedzi lokalizacji');
    const coords = d.createElement('input');
    coords.type = 'hidden'; coords.name = 'where_geo';
    input.after(list, coords);
    input.closest('.field').classList.add('field--geo');
    input.autocomplete = 'off';
    input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-controls', id);
    let items = []; let cur = -1; let timer; let ctrl;
    const close = () => { list.hidden = true; cur = -1; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
    const where = (p) => [p.city || p.county, p.state && p.state.replace('województwo ', 'woj. ')]
      .filter((x, i, a) => x && x !== p.name && a.indexOf(x) === i).join(', ');
    const render = () => {
      list.innerHTML = items.map((it, i) => `<li role="option" id="${id}-${i}" aria-selected="${i === cur}"><b>${esc(it.name)}</b><small>${esc([it.kind, it.place].filter(Boolean).join(' · '))}</small></li>`).join('')
        + '<li class="geo__src" aria-hidden="true">Podpowiedzi: © OpenStreetMap</li>';
      const open = items.length > 0;
      list.hidden = !open; input.setAttribute('aria-expanded', String(open));
      if (cur >= 0) input.setAttribute('aria-activedescendant', `${id}-${cur}`); else input.removeAttribute('aria-activedescendant');
    };
    const pick = (i) => {
      const it = items[i];
      if (!it) return;
      input.value = it.place ? `${it.name}, ${it.place}` : it.name;
      coords.value = it.geo;
      close();
    };
    const query = async (q) => {
      if (ctrl) ctrl.abort();
      ctrl = new AbortController();
      try {
        const r = await fetch(`${GEO_URL}?q=${encodeURIComponent(q)}&limit=12&lang=default&bbox=${PL_BOX}`, { signal: ctrl.signal });
        const data = await r.json();
        const seen = new Set();
        items = (data.features || [])
          .filter((f) => { const p = f.properties; return p.name && p.countrycode === 'PL' && !GEO_SKIP.has(p.osm_key) && !/stop|platform/.test(p.osm_value); })
          .map((f) => { const p = f.properties; return { name: p.name, kind: GEO_KIND[p.osm_value] || '', place: where(p), geo: `${f.geometry.coordinates[1]},${f.geometry.coordinates[0]}` }; })
          .filter((it) => { const k = `${it.name}|${it.place}`; if (seen.has(k)) return false; seen.add(k); return true; })
          .slice(0, 6);
        cur = -1;
        if (input.value.trim() === q) render();
      } catch (err) { if (err.name !== 'AbortError') close(); }
    };
    input.addEventListener('input', () => {
      coords.value = '';
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 3) { items = []; close(); return; }
      timer = setTimeout(() => query(q), 260);
    });
    input.addEventListener('keydown', (e) => {
      if (list.hidden || !items.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); cur = (cur + 1) % items.length; render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cur = (cur - 1 + items.length) % items.length; render(); }
      else if (e.key === 'Enter' && cur >= 0) { e.preventDefault(); pick(cur); }
      else if (e.key === 'Escape') { e.stopPropagation(); close(); }
    });
    list.addEventListener('mousedown', (e) => e.preventDefault());
    list.addEventListener('click', (e) => {
      const li = e.target.closest('[role="option"]');
      if (li) pick([...list.querySelectorAll('[role="option"]')].indexOf(li));
    });
    input.addEventListener('blur', () => setTimeout(close, 150));
  });
  d.querySelectorAll('[data-chip]').forEach((a) => a.addEventListener('click', () => {
    const r = d.querySelector(`[data-form] input[name="typ"][value="${a.dataset.chip}"]`);
    if (r) r.checked = true;
  }));
})();
