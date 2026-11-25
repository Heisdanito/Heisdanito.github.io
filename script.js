// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Light / dark theme. The first paint is handled by the inline script in <head>;
// this wires up the toggle and follows the system setting until the visitor picks one.
(() => {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const apply = (theme, save) => {
    root.setAttribute('data-theme', theme);
    if (save) { try { localStorage.setItem('theme', theme); } catch (e) {} }
    window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  };
  toggle?.addEventListener('click', () => {
    apply(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
  });
  const media = matchMedia('(prefers-color-scheme: light)');
  media.addEventListener?.('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (err) {}
    if (!saved) apply(e.matches ? 'light' : 'dark', false);
  });
})();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
  });
});

// Scroll progress bar
const scrollProgress = document.getElementById('scrollProgress');
function updateScrollProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgress.style.width = `${pct}%`;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

// Scroll-reveal animations
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = entry.target.dataset.revealDelay || 0;
      setTimeout(() => entry.target.classList.add('is-visible'), delay);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

// Active nav link on scroll
const sections = document.querySelectorAll('main section[id], header#top');
const navAnchors = document.querySelectorAll('.nav-links a[data-nav]');
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navAnchors.forEach(a => a.classList.toggle('active', a.dataset.nav === id));
    }
  });
// A section counts as active while it crosses the middle of the screen, which also
// works for the very tall pinned project reel.
}, { threshold: 0, rootMargin: '-50% 0px -50% 0px' });
sections.forEach(sec => navObserver.observe(sec));

// Rotating hero role text
const heroRole = document.getElementById('heroRole');
if (heroRole) {
  const roles = ['Frontend Developer', 'React Developer', 'UI Engineer', 'Full-Stack Builder'];
  let roleIndex = 0;
  setInterval(() => {
    roleIndex = (roleIndex + 1) % roles.length;
    heroRole.style.opacity = 0;
    setTimeout(() => {
      heroRole.textContent = roles[roleIndex];
      heroRole.style.opacity = 1;
    }, 250);
  }, 2800);
  heroRole.style.transition = 'opacity .25s ease';
}

// Project card tilt-on-hover
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(700px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// Contact form -> opens the visitor's email client with a prefilled message
// (this is a static GitHub Pages site, so there's no backend to receive form posts)
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = contactForm.name.value.trim();
  const email = contactForm.email.value.trim();
  const message = contactForm.message.value.trim();
  const subject = encodeURIComponent(`Portfolio contact from ${name}`);
  const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
  window.location.href = `mailto:hesidanito@gmail.com?subject=${subject}&body=${body}`;
});

// ---- AI Chat Widget ----
const aiChat = document.getElementById('aiChat');
const aiChatToggle = document.getElementById('aiChatToggle');
const aiChatClose = document.getElementById('aiChatClose');
const aiChatForm = document.getElementById('aiChatForm');
const aiChatInput = document.getElementById('aiChatInput');
const aiChatMessages = document.getElementById('aiChatMessages');
const aiChatPanel = document.getElementById('aiChatPanel');

aiChatToggle.addEventListener('click', () => {
  const open = aiChat.classList.toggle('open');
  if (open) requestAnimationFrame(() => aiChatPanel.classList.add('animate-in'));
  else aiChatPanel.classList.remove('animate-in');
});
aiChatClose.addEventListener('click', () => {
  aiChat.classList.remove('open');
  aiChatPanel.classList.remove('animate-in');
});

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
// NOTE: this key is exposed to anyone who views this site's source — it is
// only safe if you're okay with it being public and rate-limited/rotated.
const NVIDIA_API_KEY = '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';

const SYSTEM_PROMPT = `You are the AI assistant on Daniel "Heisdanito" 's personal portfolio website. Answer visitor questions about Daniel only, using the facts below. Be concise, friendly and professional. When relevant, share the specific link. If asked something you don't know about Daniel, say you don't have that detail and suggest contacting him directly.

Facts about Daniel (Heisdanito):
- Role: Frontend developer, also does graphic design and video editing.
- Studies at the University of Education, Winneba (UEW), Ghana.
- Core skills: JavaScript, TypeScript, PHP, SQL, HTML, CSS, React, React Native (Expo), Vue, Vite, Tailwind, Node.js, MySQL/MariaDB, SQLite, Firebase, Electron, Paystack/MoMo payments, UI/UX design.
- Industry / client projects:
  - Champions Restaurant — ordering and reservations platform for Champions Chicken in Berekum, Ghana: menu, online orders with delivery quotes, table reservations, a full order workflow (pending to delivered), hardened security. PHP + MySQL. GitHub: https://github.com/Heisdanito/champion-restaurant-0098
  - SAHESS E-Voting — the voting system for SAHESS student council / prefect elections: voter upload, candidates per category, one vote per student, live results, live API for other schools. PHP + MySQL. GitHub: https://github.com/Heisdanito/school-e-votting
  - UEW Library — visitor tracking for the University of Education, Winneba library: staff record visits from a phone or desk, live rolling count, dashboards by gender/weekday/staff, exportable reports. React + Expo + PHP + MySQL.
  - SocialMate — a full social network (feeds, stories, reels, live streaming with gifts, chat and calls, groups, jobs, wallet, AI chat), Expo app + web + admin. Web: https://socialmate.online · Google Play: https://play.google.com/store/apps/details?id=com.anonymous.socialmate · App Store: coming soon
- Other recent projects (2026):
  - HEIS-SMS — multi-tenant school management platform: per-school data, branding and grading, attendance, timetables, finance with MoMo/Paystack, AI performance evaluation. Raw PHP 8.2 + React 19 + MySQL. Private repo.
  - Infoctess Attendance SaaS — face-verified, geofenced, device-bound class attendance for UEW. PHP API, Expo student app, React web console for lecturers and course reps. Private repo.
  - KOTB Marketplace — multi-vendor e-commerce for Ghana with seller KYC (Ghana Card), Seller Center, admin, Paystack checkout. React + raw PHP + Expo. Private repo.
  - LocalBite — food delivery for Winneba: one Expo app for customers, sellers and riders, web ordering, admin dashboard, Paystack split payments. Web: https://localbite.store · Android app on Google Play · App Store: coming soon.
  - Afrocupid — dating web app with swipe deck, matching, chat and Paystack premium. Private repo.
  - MicMe — use your phone as a PC microphone, camera and screen, plus two-way file sharing over hotspot, USB or Wi-Fi. Electron + React Native. GitHub: https://github.com/Heisdanito/micme
  - Church CMS — fully configurable church management: members, attendance, giving, sermons with audio. PHP + React + Expo. Private repo.
  - Mirror — private, offline journaling app with mood tracking and insights. React Native + Expo + SQLite. GitHub: https://github.com/Heisdanito/mirror
  - Food Commerce — online ordering kit for a single restaurant (customer, kitchen and rider apps + owner dashboard). Private repo.
  - Side by Side — dating app for African and diaspora singles (Expo, React, PHP, MySQL). Private repo.
  - AI Predict — mobile-first football predictions app with MoMo activation and diamond-unlocked picks. React + PHP + MySQL. Private repo.
  - For private projects, visitors can email Daniel to request a demo.
- Earlier projects: Infoctess v1, a POS backend (KB-obj), Water Management System, School Management System, Bus Ticket Booking (VB.NET), Tailwind Resume Card.
- Contact: Email hesidanito@gmail.com · Phone +233 53 832 7598 · WhatsApp +233 53 832 7598 (https://wa.me/233538327598) or +233 59 561 4353 (https://wa.me/233595614353).
- Social media: the handle is heisdanito on every platform — Instagram, TikTok, X (Twitter), Facebook, LinkedIn, Snapchat, YouTube, GitHub (github.com/Heisdanito).
- Full project list and details: https://github.com/Heisdanito`;

const chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];

function addMessage(text, who) {
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg-${who}`;
  div.textContent = text;
  aiChatMessages.appendChild(div);
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  return div;
}

function stripThinking(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

aiChatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const question = aiChatInput.value.trim();
  if (!question) return;

  addMessage(question, 'user');
  chatHistory.push({ role: 'user', content: question });
  aiChatInput.value = '';
  aiChatInput.disabled = true;

  const loadingEl = addMessage('Thinking…', 'loading');

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
        messages: chatHistory,
        max_tokens: 600,
        reasoning_budget: 1024,
        stream: false,
        temperature: 0.6,
        top_p: 0.95
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const reply = stripThinking(data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a reply.");

    loadingEl.remove();
    addMessage(reply, 'bot');
    chatHistory.push({ role: 'assistant', content: reply });
  } catch (err) {
    loadingEl.remove();
    addMessage("Sorry, I'm having trouble connecting right now. Feel free to reach Daniel directly at hesidanito@gmail.com.", 'bot');
    console.error('AI chat error:', err);
  } finally {
    aiChatInput.disabled = false;
    aiChatInput.focus();
  }
});

// ---- Animated logo: letters roll over on hover and every few seconds ----
(() => {
  const logo = document.querySelector('.logo');
  if (!logo) return;
  let i = 0;
  logo.querySelectorAll('.logo-word').forEach((word) => {
    const text = word.textContent;
    word.textContent = '';
    for (const ch of text) {
      const s = document.createElement('span');
      s.className = 'lc';
      s.style.setProperty('--i', i++);
      s.textContent = ch;
      word.appendChild(s);
    }
  });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Intro once the page has loaded, then a roll every 6 seconds
  requestAnimationFrame(() => logo.classList.add('is-in'));
  setInterval(() => {
    if (logo.matches(':hover')) return;
    logo.classList.add('is-rolling');
    setTimeout(() => logo.classList.remove('is-rolling'), 1100);
  }, 6000);
})();

// ---- About: a deck of photos. One random photo lands on top, the others
// fan out behind it like a hand of cards. Select one to bring it forward. ----
(() => {
  const deck = document.getElementById('photoDeck');
  if (!deck) return;
  const cards = Array.from(deck.querySelectorAll('.deck-card'));
  const caption = document.getElementById('deckCaption');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // order[0] is the front card; order[1] fans left, order[2] fans right
  let order = cards.map((_, i) => i);
  const front = Math.floor(Math.random() * cards.length);
  order = [front, ...order.filter((i) => i !== front)];

  const layout = () => {
    const slots = ['is-front', 'is-left', 'is-right'];
    order.forEach((cardIndex, slot) => {
      const c = cards[cardIndex];
      c.classList.remove('is-front', 'is-left', 'is-right');
      c.classList.add(slots[slot] || 'is-right');
      c.setAttribute('aria-current', slot === 0 ? 'true' : 'false');
    });
    caption.textContent = cards[order[0]].dataset.caption;
  };

  const bringForward = (cardIndex) => {
    if (order[0] === cardIndex) return;
    const card = cards[cardIndex];
    // The old front card slides into the slot the chosen card leaves
    const slot = order.indexOf(cardIndex);
    order[slot] = order[0];
    order[0] = cardIndex;
    card.classList.remove('is-pop');
    void card.offsetWidth;
    card.classList.add('is-pop');
    layout();
  };

  cards.forEach((c, i) => {
    c.addEventListener('click', () => { bringForward(i); restartAuto(); });
    c.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bringForward(i); restartAuto(); }
    });
  });

  // Gentle tilt toward the pointer
  if (!reduce) {
    deck.addEventListener('pointermove', (e) => {
      const r = deck.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      deck.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
      deck.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
    });
    deck.addEventListener('pointerleave', () => {
      deck.style.setProperty('--ry', '0deg');
      deck.style.setProperty('--rx', '0deg');
    });
  }

  // Cycle through the photos while the deck is on screen
  let timer = null;
  let visible = false;
  const next = () => bringForward(order[1]);
  function restartAuto() {
    clearInterval(timer);
    if (visible && !reduce) timer = setInterval(next, 4200);
  }

  layout();
  if (reduce) { deck.classList.add('is-dealt'); return; }
  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      visible = entry.isIntersecting;
      if (visible && !deck.classList.contains('is-dealt')) {
        // Deal: the pile sits stacked, then bends out into a fan
        setTimeout(() => deck.classList.add('is-dealt'), 250);
      }
      restartAuto();
    });
  }, { threshold: 0.35 }).observe(deck);
})();
