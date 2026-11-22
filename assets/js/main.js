/* Swimstone · strona główna v2 · ruch i wideo (oba warianty).
   Wideo gra tylko, gdy jest widoczne; jeden przycisk pauzy zatrzymuje wszystkie nagrania.
   Przy „ogranicz ruch” nic nie startuje samo, a efekty przewijania stoją w stanie końcowym. */
(() => {
  const d = document;
  const root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPhone = () => innerWidth < 768;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  let paused = reduce;

  /* ---------------------------------------------------------------- nawigacja */
  const nav = d.querySelector('[data-nav]');
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
  const langBtn = d.querySelector('.lang__btn');
  const langMenu = d.getElementById('lang-menu');
  const setLang = (open) => { langBtn.setAttribute('aria-expanded', String(open)); langMenu.hidden = !open; };
  langBtn.addEventListener('click', (e) => { e.stopPropagation(); setLang(langMenu.hidden); });
  langMenu.addEventListener('click', (e) => { if (e.target.closest('a')) { e.preventDefault(); setLang(false); } });
  d.addEventListener('click', (e) => { if (!e.target.closest('[data-lang]')) setLang(false); });
  d.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!langMenu.hidden) { setLang(false); langBtn.focus(); }
    if (!menu.hidden) { setMenu(false); burger.focus(); }
  });

  /* ---------------------------------------------------------------- wideo */
  const vids = [...d.querySelectorAll('video[data-src]')];
  const load = (v) => {
    if (v.dataset.loaded) return;
    v.src = (isPhone() && v.dataset.srcM) || v.dataset.src;
    v.dataset.loaded = '1';
  };
  const tryPlay = (v) => {
    if (paused || !v._vis) return;
    load(v);
    const p = v.play();
    if (p) p.catch(() => {});
  };
  vids.forEach((v) => { if (isPhone() && v.dataset.posterM) v.poster = v.dataset.posterM; });
  const vio = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    v._vis = e.isIntersecting;
    if (v._vis) { load(v); tryPlay(v); } else v.pause();
  }), { rootMargin: '160px 0px', threshold: 0.01 });
  vids.forEach((v) => vio.observe(v));

  const pauseBtns = [...d.querySelectorAll('[data-pause]')];
  const syncPause = () => pauseBtns.forEach((b) => {
    b.setAttribute('aria-pressed', String(paused));
    b.setAttribute('aria-label', paused ? 'Odtwórz wideo na stronie' : 'Zatrzymaj wideo na stronie');
  });
  pauseBtns.forEach((b) => b.addEventListener('click', () => {
    paused = !paused;
    syncPause();
    vids.forEach((v) => (paused ? v.pause() : tryPlay(v)));
  }));
  syncPause();
  const hero = d.querySelector('[data-hero]');
  const vfloat = d.querySelector('.vfloat');
  new IntersectionObserver(([e]) => vfloat.classList.toggle('is-on', !e.isIntersecting)).observe(hero);

  /* ---------------------------------------------------------------- wejście hero (raz) */
  const enter = () => requestAnimationFrame(() => hero.classList.add('is-in'));
  (d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve()).then(enter);
  setTimeout(enter, 900);

  /* ---------------------------------------------------------------- nagłówki sekcji (raz) */
  const rv = [...d.querySelectorAll('.rv')];
  if (reduce) rv.forEach((el) => el.classList.add('is-in'));
  else {
    const rio = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); }
    }), { rootMargin: '0px 0px -12% 0px' });
    rv.forEach((el) => rio.observe(el));
  }

  /* ---------------------------------------------------------------- zdanie podświetlane słowo po słowie */
  const statement = d.querySelector('[data-statement]');
  const words = [];
  const wrapWords = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = d.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(d.createTextNode(part)); return; }
          const s = d.createElement('span');
          s.className = 'w';
          s.textContent = part;
          words.push(s);
          frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrapWords(n);
    });
  };
  if (statement && !reduce) wrapWords(statement);

  /* ---------------------------------------------------------------- liczby z wodą */
  const wls = [...d.querySelectorAll('.wl')];
  wls.forEach((el) => {
    const txt = el.textContent;
    const top = d.createElement('span');
    top.className = 'wl__t';
    top.append(d.createTextNode(txt));
    const probe = d.createElement('i');
    probe.className = 'wl__probe';
    top.append(probe);
    const water = d.createElement('span');
    water.className = 'wl__w';
    water.setAttribute('aria-hidden', 'true');
    water.textContent = txt;
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
    sio.unobserve(e.target);
    measure();
    setTimeout(() => count(e.target), 140 * wls.indexOf(e.target));
  }), { threshold: 0.6 });
  wls.forEach((el) => sio.observe(el));

  /* ---------------------------------------------------------------- efekty przewijania (jedna pętla rAF) */
  const spot = d.querySelector('[data-spot]');
  const spotMedia = spot.querySelector('.spot__media');
  const feats = [...spot.querySelectorAll('.feat'), spot.querySelector('.spot__cta')];
  const heroMedia = d.querySelector('[data-hero-media]');
  const steps = d.querySelector('[data-steps]');
  const stepItems = [...steps.querySelectorAll('.step')];
  const variantB = root.dataset.variant === 'kafle';
  let ticking = false;
  const frame = () => {
    ticking = false;
    const vh = innerHeight;
    nav.classList.toggle('is-scrolled', scrollY > 24);

    // B: wideo w hero rozszerza się do pełnej szerokości
    if (variantB && !reduce) heroMedia.style.setProperty('--hp', clamp(scrollY / (vh * 0.45)).toFixed(3));

    // zdanie: słowa zapalają się, gdy akapit przechodzi przez ekran
    if (words.length) {
      const r = statement.getBoundingClientRect();
      const p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.42));
      const lit = p * words.length;
      words.forEach((w, i) => w.style.setProperty('--wo', (0.22 + 0.78 * clamp(lit - i)).toFixed(2)));
    }

    // parki: kafel z wideo rozszerza się do pełnego ekranu, potem pojawiają się karty
    if (!reduce) {
      const r = spot.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh));
      spotMedia.style.setProperty('--e', ease(clamp(p / 0.42)).toFixed(3));
      spot.style.setProperty('--h', ease(clamp((p - 0.18) / 0.22)).toFixed(3));
      feats.forEach((f, i) => f.style.setProperty('--f', ease(clamp((p - 0.42 - i * 0.06) / 0.2)).toFixed(3)));
    }

    // współpraca: linia postępu i kolejne kroki
    {
      const r = steps.getBoundingClientRect();
      const p = reduce ? 1 : clamp((vh * 0.8 - r.top) / (vh * 0.55));
      steps.style.setProperty('--pp', p.toFixed(3));
      stepItems.forEach((s, i) => s.classList.toggle('is-on', p >= i / (stepItems.length - 1) - 0.02));
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  frame();

  /* ---------------------------------------------------------------- oferta na telefonie: kropki przewijania */
  const tiles = d.querySelector('[data-tiles]');
  const dots = [...d.querySelectorAll('.tiles__dots i')];
  tiles.addEventListener('scroll', () => {
    const cards = [...tiles.children];
    const x = tiles.scrollLeft + tiles.clientWidth * 0.3;
    let idx = 0;
    cards.forEach((c, i) => { if (c.offsetLeft - tiles.offsetLeft <= x) idx = i; });
    dots.forEach((dot, i) => dot.classList.toggle('is-on', i === idx));
  }, { passive: true });

  /* ---------------------------------------------------------------- poświata za kursorem na kartach */
  d.querySelectorAll('[data-glow]').forEach((card) => card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  /* ---------------------------------------------------------------- formularz */
  const form = d.querySelector('[data-form]');
  d.querySelectorAll('[data-chip]').forEach((a) => a.addEventListener('click', () => {
    const r = form.querySelector(`input[name="typ"][value="${a.dataset.chip}"]`);
    if (r) r.checked = true;
  }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach((f) => {
      const bad = f.type === 'checkbox' ? !f.checked : !f.value.trim();
      f.closest('.field, .check').classList.toggle('is-invalid', bad);
      f.setAttribute('aria-invalid', String(bad));
      if (bad && ok) { f.focus(); ok = false; }
    });
    form.querySelector('.form__note').hidden = !ok;
  });
  form.addEventListener('input', (e) => { const box = e.target.closest('.is-invalid'); if (box) box.classList.remove('is-invalid'); });
})();
