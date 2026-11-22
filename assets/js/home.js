/* Swimstone · strona główna · efekty przewijania: rozszerzane wideo w hero (B), sekcja parków, kroki współpracy, kropki oferty. */
(() => {
  const d = document;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const spot = d.querySelector('[data-spot]');
  const spotMedia = spot && spot.querySelector('.spot__media');
  const feats = spot ? [...spot.querySelectorAll('.feat'), spot.querySelector('.spot__cta')] : [];
  const heroMedia = d.querySelector('[data-hero-media]');
  const steps = d.querySelector('[data-steps]');
  const stepItems = steps ? [...steps.querySelectorAll('.step')] : [];
  const variantB = d.documentElement.dataset.variant === 'kafle';
  let ticking = false;
  const frame = () => {
    ticking = false;
    const vh = innerHeight;
    if (variantB && heroMedia && !reduce) heroMedia.style.setProperty('--hp', clamp(scrollY / (vh * 0.45)).toFixed(3));
    if (spot && !reduce) {
      const r = spot.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh));
      spotMedia.style.setProperty('--e', ease(clamp(p / 0.42)).toFixed(3));
      spot.style.setProperty('--h', ease(clamp((p - 0.18) / 0.22)).toFixed(3));
      feats.forEach((f, i) => f && f.style.setProperty('--f', ease(clamp((p - 0.42 - i * 0.06) / 0.2)).toFixed(3)));
    }
    if (steps) {
      const r = steps.getBoundingClientRect();
      const p = reduce ? 1 : clamp((vh * 0.8 - r.top) / (vh * 0.55));
      steps.style.setProperty('--pp', p.toFixed(3));
      stepItems.forEach((s, i) => s.classList.toggle('is-on', p >= i / (stepItems.length - 1) - 0.02));
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame);
  frame();

  const tiles = d.querySelector('[data-tiles]');
  const dots = [...d.querySelectorAll('.tiles__dots i')];
  if (tiles) tiles.addEventListener('scroll', () => {
    const x = tiles.scrollLeft + tiles.clientWidth * 0.3;
    let idx = 0;
    [...tiles.children].forEach((c, i) => { if (c.offsetLeft - tiles.offsetLeft <= x) idx = i; });
    dots.forEach((dot, i) => dot.classList.toggle('is-on', i === idx));
  }, { passive: true });
})();
