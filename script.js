// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

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
}, { threshold: 0.4, rootMargin: '-74px 0px -50% 0px' });
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
- Core skills: React, PHP, HTML, CSS, MySQL, Node.js, React Native (Expo), UI/UX design.
- Projects:
  - Sahess E-Voting System — secure online election platform for Sacred Heart School. Live: http://hesshub.infinityfreeapp.com/voting/ · GitHub: https://github.com/Heisdanito/school-e-votting
  - Champion Restaurant — online food ordering system. GitHub: https://github.com/Heisdanito/champion-restaurant-0098
  - Infoctess — mobile & web attendance-marking system (React Native/Expo + web dashboard). GitHub: https://github.com/Heisdanito/infoctess
  - Water Management System — web platform for monitoring water usage. Live: https://heis-host-2.infinityfreeapp.com/?i=1
  - School Management System — PHP-based school admin system.
  - Socialmate — social networking concept platform, UI/UX focused.
- Contact: Email hesidanito@gmail.com · Phone +233 53 832 7598 · GitHub github.com/Heisdanito · X (Twitter) @heisdanito.
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
