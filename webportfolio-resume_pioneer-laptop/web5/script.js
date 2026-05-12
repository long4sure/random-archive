/* ═══════════════════════════════════════════════════════
   Jerome Misa Portfolio — script.js
═══════════════════════════════════════════════════════ */

/* ══════════════════════════════════════
   SPACE BACKGROUND CANVAS
══════════════════════════════════════ */
(function initSpace() {
  const canvas = document.getElementById('space-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, stars = [], shootingStars = [], nebulas = [];
  let mouseX = 0, mouseY = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function randomRange(a, b) { return a + Math.random() * (b - a); }

  /* ── STARS ── */
  function initStars() {
    stars = [];
    const count = Math.floor((W * H) / 3200);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: randomRange(0.3, 1.8),
        alpha: randomRange(0.15, 1),
        twinkleSpeed: randomRange(0.003, 0.012),
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
        color: ['#ffffff', '#d0e4ff', '#ffe8d0', '#e8ffee'][Math.floor(Math.random() * 4)],
        parallaxFactor: randomRange(0.0008, 0.003)
      });
    }
  }

  /* ── NEBULAS (soft painted clouds) ── */
  function initNebulas() {
    nebulas = [
      { x: W * 0.12, y: H * 0.28, rx: W * 0.28, ry: H * 0.20, r1: 'rgba(60,20,120,0.09)',  r2: 'rgba(60,20,120,0)' },
      { x: W * 0.82, y: H * 0.65, rx: W * 0.22, ry: H * 0.25, r1: 'rgba(15,60,140,0.08)',  r2: 'rgba(15,60,140,0)' },
      { x: W * 0.50, y: H * 0.88, rx: W * 0.35, ry: H * 0.15, r1: 'rgba(80,15,60,0.06)',   r2: 'rgba(80,15,60,0)'  },
      { x: W * 0.70, y: H * 0.10, rx: W * 0.20, ry: H * 0.18, r1: 'rgba(20,80,100,0.07)',  r2: 'rgba(20,80,100,0)' },
    ];
  }

  /* ── SHOOTING STARS ── */
  function spawnShootingStar() {
    const angle = randomRange(20, 50) * Math.PI / 180;
    const x = randomRange(-100, W * 0.7);
    const y = randomRange(-30,  H * 0.4);
    shootingStars.push({
      x, y,
      vx: Math.cos(angle) * randomRange(8, 16),
      vy: Math.sin(angle) * randomRange(8, 16),
      len: randomRange(60, 140),
      alpha: 1,
      life: 0,
      maxLife: randomRange(40, 80)
    });
  }

  function drawNebulas() {
    nebulas.forEach(n => {
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, Math.max(n.rx, n.ry));
      grd.addColorStop(0, n.r1);
      grd.addColorStop(1, n.r2);
      ctx.save();
      ctx.scale(1, n.ry / n.rx);
      ctx.beginPath();
      ctx.ellipse(n.x, n.y * (n.rx / n.ry), n.rx, n.rx, 0, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.restore();
    });
  }

  function drawStars(t) {
    const px = (mouseX / W - 0.5);
    const py = (mouseY / H - 0.5);
    stars.forEach(s => {
      s.alpha += s.twinkleSpeed * s.twinkleDir;
      if (s.alpha >= 1)    { s.alpha = 1;    s.twinkleDir = -1; }
      if (s.alpha <= 0.08) { s.alpha = 0.08; s.twinkleDir =  1; }

      const ox = px * s.parallaxFactor * W * 60;
      const oy = py * s.parallaxFactor * H * 60;

      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;

      // bright stars get a subtle cross-glow
      if (s.r > 1.3) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = s.color;
      }
      ctx.beginPath();
      ctx.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawShootingStars() {
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      ss.x += ss.vx; ss.y += ss.vy; ss.life++;
      const progress = ss.life / ss.maxLife;
      ss.alpha = 1 - progress;
      if (ss.life >= ss.maxLife) { shootingStars.splice(i, 1); continue; }

      ctx.save();
      ctx.globalAlpha = ss.alpha * 0.85;
      const grd = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * (ss.len / ss.vx || 8), ss.y - ss.vy * (ss.len / (ss.vy || 1)));
      grd.addColorStop(0, 'rgba(232,255,71,0.95)');
      grd.addColorStop(0.4, 'rgba(200,230,255,0.5)');
      grd.addColorStop(1, 'rgba(200,230,255,0)');
      ctx.strokeStyle = grd;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - ss.vx * 8, ss.y - ss.vy * 8);
      ctx.stroke();
      ctx.restore();
    }
  }

  let lastShoot = 0;
  function loop(t) {
    ctx.clearRect(0, 0, W, H);
    // deep space bg gradient
    const bg = ctx.createRadialGradient(W * 0.4, H * 0.3, 0, W * 0.4, H * 0.3, Math.max(W, H));
    bg.addColorStop(0, '#050520');
    bg.addColorStop(0.5, '#030314');
    bg.addColorStop(1, '#02020c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawNebulas();
    drawStars(t);
    drawShootingStars();

    // spawn shooting stars randomly
    if (t - lastShoot > randomRange(3000, 8000)) {
      spawnShootingStar();
      lastShoot = t;
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { resize(); initStars(); initNebulas(); });
  window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });

  resize();
  initStars();
  initNebulas();
  requestAnimationFrame(loop);
})();

/* ══════════════════════════════════════
   PAGE LOADER
══════════════════════════════════════ */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) { loader.classList.add('hidden'); setTimeout(() => loader.remove(), 750); }
  }, 1500);
});

/* ══════════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════════ */
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let mx = -200, my = -200, rx = -200, ry = -200;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});

(function ringLoop() {
  rx += (mx - rx) * 0.13;
  ry += (my - ry) * 0.13;
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top  = ry + 'px';
  requestAnimationFrame(ringLoop);
})();

const hoverTargets = 'a, button, .skill-card, .skill-item, .contact-item, [data-tip], .footer-back-top, .form-submit, .nav-hamburger';
document.querySelectorAll(hoverTargets).forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

document.addEventListener('mousedown', () => { document.body.classList.add('cursor-click'); setTimeout(() => document.body.classList.remove('cursor-click'), 140); });
document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; cursorRing.style.opacity = '0'; });
document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; cursorRing.style.opacity = '1'; });

/* ══════════════════════════════════════
   SCROLL PROGRESS BAR
══════════════════════════════════════ */
const navProgress = document.querySelector('.nav-progress');
const nav = document.querySelector('nav');

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const total    = document.documentElement.scrollHeight - window.innerHeight;
  if (navProgress) navProgress.style.width = (scrolled / total * 100) + '%';
  if (nav) nav.classList.toggle('scrolled', scrolled > 30);
}, { passive: true });

/* ══════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el  = entry.target;
      const idx = parseInt(el.dataset.idx || 0);
      const base = parseFloat(el.dataset.delay || 0);
      el.style.transitionDelay = (base + idx * 0.065) + 's';
      requestAnimationFrame(() => el.classList.add('visible'));
      revealObserver.unobserve(el);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-scale').forEach((el, i) => {
  el.dataset.idx = i % 7;
  revealObserver.observe(el);
});

/* ══════════════════════════════════════
   COUNTER ANIMATION
══════════════════════════════════════ */
function animateCounter(el) {
  const target = parseInt(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const dur    = 1800;
  const start  = performance.now();
  (function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(2, -10 * p);
    el.textContent = Math.round(e * target) + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
}

const cntObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); cntObs.unobserve(e.target); } });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => cntObs.observe(el));

/* ══════════════════════════════════════
   TYPING EFFECT
══════════════════════════════════════ */
const typingEl = document.getElementById('typing-text');
if (typingEl) {
  const words = ['Web Developer', 'Frontend Dev', 'Backend Dev', 'Full Stack Aspirant'];
  let wIdx = 0, cIdx = 0, deleting = false;
  function type() {
    const word    = words[wIdx];
    const display = deleting ? word.slice(0, cIdx--) : word.slice(0, cIdx++);
    typingEl.textContent = display;
    let delay = deleting ? 55 : 95;
    if (!deleting && cIdx > word.length)  { delay = 1900; deleting = true; }
    else if (deleting && cIdx < 0)         { deleting = false; wIdx = (wIdx + 1) % words.length; cIdx = 0; delay = 320; }
    setTimeout(type, delay);
  }
  setTimeout(type, 1700);
}

/* ══════════════════════════════════════
   MAGNETIC BUTTONS
══════════════════════════════════════ */
document.querySelectorAll('.btn-primary, .btn-resume').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r  = btn.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width  / 2)) * 0.22;
    const dy = (e.clientY - (r.top  + r.height / 2)) * 0.22;
    btn.style.transform = `translate(${dx}px, ${dy}px) translateY(-3px)`;
  });
  btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
});

/* ══════════════════════════════════════
   RIPPLE ON ALL BUTTONS
══════════════════════════════════════ */
document.querySelectorAll('.btn, .form-submit').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const r    = this.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const rpl  = document.createElement('span');
    rpl.classList.add('btn-ripple');
    rpl.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size/2}px;top:${e.clientY - r.top - size/2}px;`;
    this.appendChild(rpl);
    setTimeout(() => rpl.remove(), 600);
  });
});

/* ══════════════════════════════════════
   ACTIVE NAV HIGHLIGHT
══════════════════════════════════════ */
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
const sections   = document.querySelectorAll('section[id]');

const navObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => navObs.observe(s));

/* ══════════════════════════════════════
   HAMBURGER / MOBILE MENU
══════════════════════════════════════ */
const hamburger  = document.querySelector('.nav-hamburger');
const mobileMenu = document.querySelector('.nav-mobile');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ══════════════════════════════════════
   PARALLAX BLOBS (mouse)
══════════════════════════════════════ */
window.addEventListener('mousemove', e => {
  const xf = (e.clientX / window.innerWidth  - 0.5) * 2;
  const yf = (e.clientY / window.innerHeight - 0.5) * 2;
  document.querySelectorAll('.hero-blob').forEach((b, i) => {
    const d = (i + 1) * 0.014;
    b.style.transform = `translate(${xf * 40 * d}px, ${yf * 40 * d}px)`;
  });
}, { passive: true });

/* ══════════════════════════════════════
   SKILL CARD 3D TILT
══════════════════════════════════════ */
document.querySelectorAll('.skill-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform      = `translateY(-6px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
    card.style.transformStyle = 'preserve-3d';
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.transformStyle = ''; });
});

/* ══════════════════════════════════════
   PHOTO 3D TILT
══════════════════════════════════════ */
const photoWrapper = document.querySelector('.photo-wrapper');
if (photoWrapper) {
  photoWrapper.addEventListener('mousemove', e => {
    const r = photoWrapper.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - 0.5) * 14;
    const y = ((e.clientY - r.top)  / r.height - 0.5) * 14;
    photoWrapper.style.transform = `perspective(700px) rotateX(${-y}deg) rotateY(${x}deg)`;
  });
  photoWrapper.addEventListener('mouseleave', () => { photoWrapper.style.transform = ''; });
}

/* ══════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════ */
const form      = document.getElementById('contact-form');
const statusEl  = document.getElementById('form-status');
const submitBtn = document.getElementById('form-submit');

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = document.getElementById('f-name').value.trim();
    const email   = document.getElementById('f-email').value.trim();
    const subject = document.getElementById('f-subject').value.trim();
    const message = document.getElementById('f-message').value.trim();

    if (!name || !email || !message) { setStatus('⚠ Please fill in all required fields.', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus('⚠ Please enter a valid email address.', 'error'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Opening mail client…';

    const body = encodeURIComponent(`Hello Jerome,\n\nMy name is ${name}.\n\n${message}\n\n---\nReply to: ${email}`);
    const sub  = encodeURIComponent(subject || `Portfolio message from ${name}`);

    setTimeout(() => {
      window.location.href = `mailto:jemisa@sscrcan.edu.ph?subject=${sub}&body=${body}`;
      setStatus('✓ Mail client opened — thank you for reaching out!', 'success');
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message →';
    }, 500);
  });
}
function setStatus(msg, type) { statusEl.textContent = msg; statusEl.className = 'form-status ' + type; }

/* ══════════════════════════════════════
   BACK TO TOP
══════════════════════════════════════ */
const backTop = document.querySelector('.footer-back-top');
if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ══════════════════════════════════════
   SKILL ITEM STAGGER ON CARD REVEAL
══════════════════════════════════════ */
const skillCardObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.skill-item').forEach((item, i) => {
        item.style.opacity         = '0';
        item.style.transform       = 'translateY(10px)';
        item.style.transition      = `opacity 0.35s ease, transform 0.35s ease`;
        item.style.transitionDelay = (i * 0.04) + 's';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          item.style.opacity   = '1';
          item.style.transform = 'none';
        }));
      });
      skillCardObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.skill-card').forEach(card => skillCardObs.observe(card));
