// Cinematic motion layer: preloader, smooth scroll, hero "opening shot",
// scroll-velocity marquee and the pinned horizontal project reel.
// Needs GSAP + ScrollTrigger (and optionally Lenis). If they fail to load, or the
// visitor prefers reduced motion, the page stays fully usable without animation.
(() => {
  const root = document.documentElement;
  const hasGsap = window.gsap && window.ScrollTrigger;
  if (!root.classList.contains('cine') || !hasGsap) {
    root.classList.remove('cine');
    document.querySelector('.preloader')?.remove();
    return;
  }
  root.classList.add('cine-ready');
  gsap.registerPlugin(ScrollTrigger);

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  // ---------- Smooth scroll ----------
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const target = id === '#top' || id === '#' ? 0 : document.querySelector(id);
        if (target === null) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: target === 0 ? 0 : -70, duration: 1.6 });
      });
    });
  }

  // ---------- Text splitting ----------
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    for (const ch of text) {
      const s = document.createElement('span');
      s.className = 'char';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
    }
    return $$('.char', el);
  }
  // Wraps each word for a masked reveal; words inside <em> keep their emphasis
  function splitWords(el) {
    const parts = [];
    Array.from(el.childNodes).forEach((n) => {
      const isEm = n.nodeType === 1 && n.tagName === 'EM';
      n.textContent.split(/\s+/).filter(Boolean).forEach((w) => parts.push([w, isEm]));
    });
    el.textContent = '';
    parts.forEach(([w, isEm], i) => {
      const outer = document.createElement('span');
      outer.className = 'word';
      const inner = document.createElement('span');
      if (isEm) {
        const em = document.createElement('em');
        em.textContent = w;
        inner.appendChild(em);
      } else {
        inner.textContent = w;
      }
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < parts.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return $$('.word > span', el);
  }

  // ---------- Hero: opening shot ----------
  const heroChars = $$('.hero-name .line-text').flatMap(splitChars);
  const portrait = $('.hero-portrait');
  const portraitImg = $('.hero-portrait img');
  const heroFoot = $$('.hero-kicker, .hero-foot > *, .cine-hero .hero-social');

  gsap.set(heroChars, { yPercent: 115 });
  gsap.set(portrait, { clipPath: 'inset(50% 50% 50% 50%)' });
  gsap.set(portraitImg, { scale: 1.6 });
  gsap.set(heroFoot, { autoAlpha: 0, y: 30 });

  function heroIntro() {
    return gsap.timeline()
      .to('.letterbox', { height: '6vh', duration: .9, ease: 'expo.out' }, 0)
      .to(heroChars, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: .035 }, .1)
      .to(portrait, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' }, .2)
      .to(portraitImg, { scale: 1.15, duration: 2, ease: 'expo.out' }, .3)
      .to(heroFoot, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .08 }, .8)
      .to('.letterbox', { height: 0, duration: 1.2, ease: 'expo.inOut' }, 2.2);
  }

  // ---------- Preloader ----------
  const pre = $('.preloader');
  const countEl = $('.preloader-count');
  lenis?.stop();
  const counter = { v: 0 };
  gsap.timeline({
    onComplete() {
      pre?.remove();
      lenis?.start();
      ScrollTrigger.refresh();
    },
  })
    .to(counter, {
      v: 100,
      duration: 1.7,
      ease: 'power2.inOut',
      onUpdate() { countEl.textContent = String(Math.round(counter.v)).padStart(3, '0'); },
    })
    .to('.preloader-bar i', { scaleX: 1, duration: 1.7, ease: 'power2.inOut' }, 0)
    .to('.preloader-inner', { autoAlpha: 0, y: -24, duration: .45, ease: 'power2.in' })
    .to('.preloader-panel.top', { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, '-=.05')
    .to('.preloader-panel.bottom', { yPercent: 100, duration: 1.2, ease: 'expo.inOut' }, '<')
    .add(heroIntro(), '-=.85');

  // Hero parallax as it leaves the screen
  gsap.timeline({
    scrollTrigger: { trigger: '.cine-hero', start: 'top top', end: 'bottom top', scrub: true },
  })
    .to('.hero-name .line:nth-child(1)', { xPercent: -18, ease: 'none' }, 0)
    .to('.hero-name .line:nth-child(2)', { xPercent: 18, ease: 'none' }, 0)
    .to(portrait, { yPercent: 18, scale: 1.12, ease: 'none' }, 0)
    .to('.hero-foot', { autoAlpha: 0, y: -40, ease: 'none' }, 0);

  // ---------- Marquee driven by scroll velocity ----------
  const track = $('.marquee-track');
  if (track) {
    const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    let dir = 1;
    ScrollTrigger.create({
      trigger: '.marquee',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate(self) {
        dir = self.direction;
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 6);
        gsap.to(loop, { timeScale: boost * dir, duration: .2, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: .2, overwrite: false });
      },
    });
  }

  // ---------- Reel ----------
  const slides = $$('.reel-slide');
  slides.forEach((s) => {
    const title = $('.reel-title', s);
    if (title) splitWords(title);
  });

  function slideIntro(s, st) {
    const frame = $('.reel-frame', s);
    return gsap.timeline({ scrollTrigger: { ...st, toggleActions: 'play none none reverse' } })
      .from(frame, { clipPath: 'inset(0% 0% 0% 100%)', duration: 1.3, ease: 'expo.inOut' }, 0)
      .from($$('.reel-title .word > span', s), { yPercent: 110, duration: 1, ease: 'expo.out', stagger: .06 }, .3)
      .from([$('.reel-index', s), $('.reel-kicker', s), $('.reel-desc', s), $('.reel-tags', s), $('.reel-links', s), $('figcaption', s)],
        { autoAlpha: 0, y: 24, duration: .8, ease: 'power3.out', stagger: .07 }, .45);
  }

  const mm = gsap.matchMedia();

  mm.add('(min-width: 1000px)', () => {
    const strip = $('.reel-track');
    const glow = $('.reel-glow');
    const bar = $('.reel-progress i');
    const counterEl = $('.reel-counter');
    const total = slides.length;
    const dist = () => strip.scrollWidth - window.innerWidth;
    let active = -1;

    const setActive = (i) => {
      if (i === active) return;
      active = i;
      const accent = slides[i].style.getPropertyValue('--reel-accent') || '#ffffff';
      if (glow) gsap.to(glow, { backgroundColor: accent, duration: .8, ease: 'power2.out' });
      // The whole page picks up the brand colour of the project on screen
      root.style.setProperty('--accent-live', accent);
      if (counterEl) counterEl.textContent = `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    };
    setActive(0);
    root.style.removeProperty('--accent-live');

    const hTween = gsap.to(strip, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.reel-pin',
        pin: true,
        scrub: 1,
        start: 'top top',
        end: () => '+=' + dist(),
        invalidateOnRefresh: true,
        // Settle on a whole slide when scrolling stops, like cutting between shots
        snap: { snapTo: 1 / (total - 1), duration: { min: .35, max: .9 }, delay: .08, ease: 'power2.inOut' },
        onToggle(self) {
          if (self.isActive) { active = -1; setActive(Math.min(total - 1, Math.round(self.progress * (total - 1)))); }
          // Scrolling back above the reel restores the default accent; going past it,
          // the archive trigger below takes care of that once the next section is in view.
          else if (self.direction < 0) root.style.removeProperty('--accent-live');
        },
        onUpdate(self) {
          if (bar) bar.style.transform = `scaleX(${self.progress})`;
          setActive(Math.min(total - 1, Math.round(self.progress * (total - 1))));
        },
      },
    });

    ScrollTrigger.create({
      trigger: '.archive',
      start: 'top 55%',
      onEnter: () => root.style.removeProperty('--accent-live'),
      onLeaveBack: () => { active = -1; setActive(total - 1); },
    });

    slides.forEach((s, i) => {
      const img = $('.reel-frame img', s);
      gsap.fromTo(img, { xPercent: -5 }, {
        xPercent: 5,
        ease: 'none',
        scrollTrigger: { trigger: s, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true },
      });
      if (i === 0) slideIntro(s, { trigger: '.reel-pin', start: 'top 70%' });
      else slideIntro(s, { trigger: s, containerAnimation: hTween, start: 'left 70%' });
    });
  });

  mm.add('(max-width: 999px)', () => {
    slides.forEach((s) => {
      const img = $('.reel-frame img', s);
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5,
        ease: 'none',
        scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true },
      });
      slideIntro(s, { trigger: s, start: 'top 80%' });
    });
  });

  // Reel heading
  const reelHead = $('.reel-head h2');
  if (reelHead) {
    gsap.from(reelHead.children, {
      yPercent: 100, autoAlpha: 0, duration: 1.1, ease: 'expo.out', stagger: .1,
      scrollTrigger: { trigger: reelHead, start: 'top 85%' },
    });
  }

  // Earlier work rows
  gsap.from('.archive-list li', {
    autoAlpha: 0, y: 30, duration: .8, ease: 'power3.out', stagger: .06,
    scrollTrigger: { trigger: '.archive-list', start: 'top 85%' },
  });

  // ---------- Statement: words light up as you scroll ----------
  const statement = $('.statement-text');
  if (statement) {
    // Split into word spans while keeping <em> emphasis intact
    const wrapWords = (text, parent, em) => {
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { parent.appendChild(document.createTextNode(' ')); return; }
        const s = document.createElement('span');
        s.className = 'sw';
        if (em) {
          const e = document.createElement('em');
          e.textContent = part;
          s.appendChild(e);
        } else {
          s.textContent = part;
        }
        parent.appendChild(s);
      });
    };
    const nodes = Array.from(statement.childNodes);
    statement.textContent = '';
    nodes.forEach((n) => wrapWords(n.textContent, statement, n.nodeType === 1));
    gsap.to($$('.sw', statement), {
      opacity: 1, ease: 'none', stagger: .1,
      scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  }

  // ---------- Stats count up ----------
  $$('.stats strong[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const o = { v: 0 };
    el.textContent = '0' + suffix;
    gsap.to(o, {
      v: end, duration: 1.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: () => { el.textContent = Math.round(o.v) + suffix; },
    });
  });

  // ---------- Clients and stack ----------
  gsap.fromTo('.client-logos li', { autoAlpha: 0, y: 30 }, {
    autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .1,
    scrollTrigger: { trigger: '.client-logos', start: 'top 88%' },
  });
  const stackTitle = $('.stack-title');
  if (stackTitle) {
    gsap.from(splitWords(stackTitle), {
      yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .06,
      scrollTrigger: { trigger: stackTitle, start: 'top 85%' },
    });
  }
  $$('.stack-group').forEach((g) => {
    gsap.fromTo($$('.stack-tile', g), { autoAlpha: 0, y: 26, scale: .94 }, {
      autoAlpha: 1, y: 0, scale: 1, duration: .7, ease: 'power3.out', stagger: .045,
      scrollTrigger: { trigger: g, start: 'top 88%' },
    });
  });

  // ---------- Cursor ----------
  const cursor = $('.cine-cursor');
  if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const xTo = gsap.quickTo(cursor, 'x', { duration: .35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: .35, ease: 'power3' });
    window.addEventListener('mousemove', (e) => {
      cursor.style.opacity = 1;
      xTo(e.clientX);
      yTo(e.clientY);
    }, { passive: true });
    $$('.reel-frame').forEach((f) => {
      f.addEventListener('mouseenter', () => cursor.classList.add('is-view'));
      f.addEventListener('mouseleave', () => cursor.classList.remove('is-view'));
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
