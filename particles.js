// Interactive black & white particle wave background.
// A grid of dots forms a flowing wave; the wave distorts near the mouse
// cursor and pulses whenever a key is pressed.
(function () {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, dpr;
  let points = [];
  let time = 0;
  let keyPulse = 0;

  const mouse = { x: -9999, y: -9999, active: false };

  const SPACING = window.innerWidth < 700 ? 34 : 26;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildGrid();
  }

  function buildGrid() {
    points = [];
    const cols = Math.ceil(width / SPACING) + 2;
    const rows = Math.ceil(height / SPACING) + 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        points.push({
          x: c * SPACING,
          y: r * SPACING,
          baseX: c * SPACING,
          baseY: r * SPACING
        });
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    if (!prefersReducedMotion) {
      time += 0.012;
      keyPulse *= 0.94;
    }

    for (let i = 0; i < points.length; i++) {
      const p = points[i];

      // Base flowing wave (two overlapping sine fields for an organic feel)
      const wave =
        Math.sin(p.baseX * 0.012 + time) * 10 +
        Math.sin((p.baseX + p.baseY) * 0.01 - time * 1.3) * 8;

      let px = p.baseX;
      let py = p.baseY + wave;
      let brightness = 0.18 + Math.abs(wave) / 40;

      // Mouse ripple: points near the cursor lift and brighten
      if (mouse.active) {
        const dx = px - mouse.x;
        const dy = py - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = 180;
        if (dist < radius) {
          const force = (1 - dist / radius);
          px += (dx / (dist || 1)) * force * 22;
          py += (dy / (dist || 1)) * force * 22;
          brightness += force * 0.8;
        }
      }

      // Keyboard pulse: brief global ripple + brightness boost
      if (keyPulse > 0.01) {
        const cx = width / 2, cy = height / 2;
        const dx = px - cx, dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ring = Math.sin(dist * 0.02 - time * 4) * keyPulse * 14;
        px += (dx / dist) * ring;
        py += (dy / dist) * ring;
        brightness += keyPulse * 0.6;
      }

      brightness = Math.min(brightness, 1);
      const radius = 1 + brightness * 1.4;

      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${brightness.toFixed(3)})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }, { passive: true });

  window.addEventListener('mouseleave', () => { mouse.active = false; });

  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      mouse.active = true;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => { mouse.active = false; });

  window.addEventListener('keydown', () => {
    keyPulse = 1;
  });

  resize();
  draw();
})();
