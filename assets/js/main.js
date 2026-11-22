/* Swimstone · strona główna · ruch i wideo (oba warianty).
   Zasady: wideo gra tylko, gdy jest widoczne; jeden przycisk pauzy zatrzymuje wszystkie nagrania;
   przy „ogranicz ruch” nic nie startuje samo, a liczby i nagłówki stoją od razu na miejscu. */
(() => {
  const d = document;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPhone = () => innerWidth < 768;
  let paused = reduce;

  /* ---------------------------------------------------------------- nawigacja */
  const nav = d.querySelector('[data-nav]');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
    const mobileOk = !v.dataset.mOnly || v.dataset.mOnly === d.documentElement.dataset.variant;
    v.src = (isPhone() && mobileOk && v.dataset.srcM) || v.dataset.src;
    v.dataset.loaded = '1';
  };
  const gated = (v) => { const m = v.closest('[data-step-media]'); return m && !m.classList.contains('is-active'); };
  const tryPlay = (v) => {
    if (paused || !v._vis || gated(v)) return;
    load(v);
    const p = v.play();
    if (p) p.catch(() => {});
  };
  vids.forEach((v) => { if (isPhone() && v.dataset.posterM) v.poster = v.dataset.posterM; });
  const vio = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    v._vis = e.isIntersecting;
    if (v._vis) { load(v); tryPlay(v); } else v.pause();
  }), { rootMargin: '120px 0px', threshold: 0.01 });
  vids.forEach((v) => vio.observe(v));

  /* pauza: przycisk w hero + pływający przycisk, gdy hero zniknie z ekranu */
  const pauseBtns = [...d.querySelectorAll('[data-pause]')];
  const syncPauseBtn = () => pauseBtns.forEach((b) => {
    b.setAttribute('aria-pressed', String(paused));
    b.setAttribute('aria-label', paused ? 'Odtwórz wideo na stronie' : 'Zatrzymaj wideo na stronie');
  });
  pauseBtns.forEach((b) => b.addEventListener('click', () => {
    paused = !paused;
    syncPauseBtn();
    vids.forEach((v) => (paused ? v.pause() : tryPlay(v)));
  }));
  syncPauseBtn();
  const vfloat = d.querySelector('.vfloat');
  new IntersectionObserver(([e]) => vfloat.classList.toggle('is-on', !e.isIntersecting))
    .observe(d.querySelector('[data-hero]'));

  /* sceny montażu w hero (granice ujęć z src/web_video.py) */
  const heroV = d.querySelector('[data-hero-video]');
  const scenes = [...d.querySelectorAll('.scene')];
  const cuts = [0, 5.15, 12.45, 15.75, 19.95];
  const sceneAt = (t) => { for (let i = 3; i >= 0; i--) if (t >= cuts[i]) return i; return 0; };
  let rafScene = 0;
  const drawScene = () => {
    const t = heroV.currentTime % 20.4;
    const i = t >= cuts[4] ? 0 : sceneAt(t);
    const a = cuts[i];
    const b = cuts[i + 1];
    scenes.forEach((s, k) => {
      s.classList.toggle('is-on', k === i);
      s.querySelector('i').style.setProperty('--p', k < i ? 1 : k === i ? Math.min(1, (t - a) / (b - a)) : 0);
    });
    if (!heroV.paused) rafScene = requestAnimationFrame(drawScene);
  };
  heroV.addEventListener('play', () => { cancelAnimationFrame(rafScene); rafScene = requestAnimationFrame(drawScene); });
  heroV.addEventListener('pause', drawScene);
  heroV.addEventListener('loadedmetadata', drawScene);
  scenes[0].classList.add('is-on');

  /* ---------------------------------------------------------------- wejście hero (raz) */
  const hero = d.querySelector('[data-hero]');
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

  /* ---------------------------------------------------------------- liczby z wodą */
  const wls = [...d.querySelectorAll('.wl')];
  const fmt = (n) => String(Math.round(n));
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
    const probe = el.querySelector('.wl__probe');
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const base = probe.offsetTop;
    el.style.setProperty('--cut', `${(base - 0.11 * fs).toFixed(1)}px`);
  });
  const setText = (el, s) => {
    el.querySelector('.wl__t').firstChild.nodeValue = s;
    el.querySelector('.wl__w').textContent = s;
  };
  const count = (el) => {
    const to = parseFloat(el.dataset.count);
    if (Number.isNaN(to) || reduce) { el.classList.add('is-wet'); return; }
    const from = parseFloat(el.dataset.from || 0);
    const t0 = performance.now();
    const dur = 1500;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setText(el, fmt(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(tick);
      else { setText(el, fmt(to)); el.classList.add('is-wet'); }
    };
    setText(el, fmt(from));
    requestAnimationFrame(tick);
  };
  (d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve()).then(measure);
  addEventListener('resize', measure);
  const sio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    sio.unobserve(e.target);
    measure();
    setTimeout(() => count(e.target), 120 * wls.indexOf(e.target));
  }), { threshold: 0.6 });
  wls.forEach((el) => sio.observe(el));

  /* ---------------------------------------------------------------- od akwenu do sezonu */
  const steps = [...d.querySelectorAll('.step')];
  const media = [...d.querySelectorAll('[data-step-media]')];
  const pips = [...d.querySelectorAll('.proc__dots li')];
  const activate = (i) => {
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    pips.forEach((s, k) => s.classList.toggle('is-active', k <= i));
    media.forEach((m, k) => {
      const on = k === i;
      m.classList.toggle('is-active', on);
      const v = m.querySelector('video');
      if (!v) return;
      if (on) { v._vis = true; tryPlay(v); } else v.pause();
    });
  };
  const pio = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) activate(steps.indexOf(e.target));
  }), { rootMargin: '-48% 0px -48% 0px' });
  steps.forEach((s) => pio.observe(s));

  /* ---------------------------------------------------------------- stoper ALGE */
  const timer = d.querySelector('[data-timer]');
  const out = timer.querySelector('[data-timer-out]');
  const lane = timer.querySelector('.is-me');
  const to = parseFloat(timer.dataset.to);
  const show = (s) => {
    const m = Math.floor(s / 60);
    const r = s - m * 60;
    out.textContent = `${String(m).padStart(2, '0')}:${r.toFixed(2).padStart(5, '0')}`;
    lane.style.setProperty('--lane', Math.min(1, s / to));
  };
  let tRaf = 0;
  const run = () => {
    cancelAnimationFrame(tRaf);
    timer.classList.remove('is-done');
    const t0 = performance.now();
    const step = (now) => {
      const s = (now - t0) / 1000;
      if (s >= to) { show(to); timer.classList.add('is-done'); return; }
      show(s);
      tRaf = requestAnimationFrame(step);
    };
    tRaf = requestAnimationFrame(step);
  };
  if (reduce) { show(to); timer.classList.add('is-done'); }
  else {
    show(0);
    new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting && !timer.classList.contains('is-running')) { timer.classList.add('is-running'); run(); }
      if (!e.isIntersecting) { timer.classList.remove('is-running'); }
    }), { threshold: 0.5 }).observe(timer);
  }

  /* ---------------------------------------------------------------- mapa ↔ lista */
  const dots = new Map([...d.querySelectorAll('.dot')].map((el) => [el.dataset.key, el]));
  d.querySelectorAll('.row').forEach((r) => {
    const dot = dots.get(r.dataset.key);
    if (!dot) return;
    r.addEventListener('mouseenter', () => dot.classList.add('is-hot'));
    r.addEventListener('mouseleave', () => dot.classList.remove('is-hot'));
  });

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
  form.addEventListener('input', (e) => {
    const box = e.target.closest('.is-invalid');
    if (box) box.classList.remove('is-invalid');
  });
})();
