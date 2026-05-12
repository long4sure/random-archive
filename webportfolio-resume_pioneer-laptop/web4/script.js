/* ═══════════════════════════════════════════════════════
   Jerome Misa Portfolio — script.js
   Features: custom cursor, page loader, magnetic buttons,
   scroll progress, parallax, counter animation,
   scroll reveal, typing effect, nav highlight,
   ripple, form validation & mailto
═══════════════════════════════════════════════════════ */

/* ── PAGE LOADER ── */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 700);
    }
  }, 1400);
});

/* ── CUSTOM CURSOR ── */
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let mx = -100, my = -100, rx = -100, ry = -100;

document.addEventListener('mousemove', (e) => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});

// smooth ring follow
(function ringLoop() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top  = ry + 'px';
  requestAnimationFrame(ringLoop);
})();

document.querySelectorAll('a, button, .skill-card, .skill-item, .contact-item, .nav-resume-btn, .footer-back-top').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

document.addEventListener('mousedown', () => {
  document.body.classList.add('cursor-click');
  setTimeout(() => document.body.classList.remove('cursor-click'), 150);
});

document.addEventListener('mouseleave', () => {
  cursor.style.opacity = '0';
  cursorRing.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
  cursor.style.opacity = '1';
  cursorRing.style.opacity = '1';
});

/* ── SCROLL PROGRESS BAR ── */
const navProgress = document.querySelector('.nav-progress');
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const total    = document.documentElement.scrollHeight - window.innerHeight;
  navProgress.style.width = (scrolled / total * 100) + '%';

  // nav style on scroll
  const nav = document.querySelector('nav');
  nav.classList.toggle('scrolled', scrolled > 30);
}, { passive: true });

/* ── SCROLL REVEAL ── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      const el   = entry.target;
      const base = parseFloat(el.dataset.delay || 0);
      const idx  = el.dataset.idx ? parseInt(el.dataset.idx) : 0;
      el.style.transitionDelay = (base + idx * 0.06) + 's';
      requestAnimationFrame(() => el.classList.add('visible'));
      revealObserver.unobserve(el);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-scale').forEach((el, i) => {
  el.dataset.idx = i % 6;
  revealObserver.observe(el);
});

/* ── COUNTER ANIMATION ── */
function animateCounter(el) {
  const target = parseInt(el.dataset.count);
  const duration = 1600;
  const start = performance.now();
  const suffix = el.dataset.suffix || '';

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease out expo
    const ease = 1 - Math.pow(2, -10 * progress);
    el.textContent = Math.round(ease * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

/* ── TYPING EFFECT in hero tag ── */
const typingEl = document.getElementById('typing-text');
if (typingEl) {
  const words   = ['Web Developer', 'Frontend Dev', 'Backend Dev', 'Full Stack Aspirant'];
  let   wIdx    = 0, cIdx = 0, deleting = false;

  function type() {
    const word    = words[wIdx];
    const display = deleting ? word.slice(0, cIdx--) : word.slice(0, cIdx++);
    typingEl.textContent = display;

    let delay = deleting ? 60 : 100;
    if (!deleting && cIdx > word.length) { delay = 1800; deleting = true; }
    else if (deleting && cIdx < 0)       { deleting = false; wIdx = (wIdx + 1) % words.length; cIdx = 0; delay = 300; }
    setTimeout(type, delay);
  }
  setTimeout(type, 1600);
}

/* ── MAGNETIC BUTTONS ── */
document.querySelectorAll('.btn-primary, .btn-resume').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) * 0.25;
    const dy = (e.clientY - cy) * 0.25;
    btn.style.transform = `translate(${dx}px, ${dy}px) translateY(-3px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

/* ── RIPPLE on .btn clicks ── */
document.querySelectorAll('.btn, .form-submit').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const rect   = this.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 2;
    const ripple = document.createElement('span');
    ripple.classList.add('btn-ripple');
    ripple.style.cssText = `
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size/2}px;
      top:${e.clientY - rect.top  - size/2}px;
    `;
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

/* ── ACTIVE NAV LINK ── */
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
const sections   = document.querySelectorAll('section[id]');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navAnchors.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + id);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => navObserver.observe(s));

/* ── HAMBURGER / MOBILE MENU ── */
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

/* ── PARALLAX BLOBS ── */
window.addEventListener('mousemove', (e) => {
  const xFrac = (e.clientX / window.innerWidth  - 0.5) * 2;
  const yFrac = (e.clientY / window.innerHeight - 0.5) * 2;
  document.querySelectorAll('.hero-blob').forEach((blob, i) => {
    const depth = (i + 1) * 0.012;
    blob.style.transform = `translate(${xFrac * 40 * depth}px, ${yFrac * 40 * depth}px)`;
  });
}, { passive: true });

/* ── SKILL CARD TILT ── */
document.querySelectorAll('.skill-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `translateY(-6px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    card.style.transformStyle = 'preserve-3d';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transformStyle = '';
  });
});

/* ── PHOTO HOVER PARALLAX ── */
const photoWrapper = document.querySelector('.photo-wrapper');
if (photoWrapper) {
  photoWrapper.addEventListener('mousemove', (e) => {
    const rect = photoWrapper.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 12;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 12;
    photoWrapper.style.transform = `perspective(600px) rotateX(${-y}deg) rotateY(${x}deg)`;
  });
  photoWrapper.addEventListener('mouseleave', () => {
    photoWrapper.style.transform = '';
  });
}

/* ── CONTACT FORM ── */
const form      = document.getElementById('contact-form');
const statusEl  = document.getElementById('form-status');
const submitBtn = document.getElementById('form-submit');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name    = document.getElementById('f-name').value.trim();
    const email   = document.getElementById('f-email').value.trim();
    const subject = document.getElementById('f-subject').value.trim();
    const message = document.getElementById('f-message').value.trim();

    if (!name || !email || !message) {
      setStatus('⚠ Please fill in all required fields.', 'error'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('⚠ Please enter a valid email address.', 'error'); return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Opening mail client…';

    const body = encodeURIComponent(
      `Hello Jerome,\n\nMy name is ${name}.\n\n${message}\n\n---\nReply to: ${email}`
    );
    const sub = encodeURIComponent(subject || `Portfolio message from ${name}`);

    setTimeout(() => {
      window.location.href = `mailto:jemisa@sscrcan.edu.ph?subject=${sub}&body=${body}`;
      setStatus('✓ Mail client opened — thank you!', 'success');
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message →';
    }, 500);
  });
}

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = 'form-status ' + type;
}

/* ── BACK TO TOP ── */
const backTop = document.querySelector('.footer-back-top');
if (backTop) {
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── SECTION HEADING SPLIT CHAR ANIMATION ── */
document.querySelectorAll('.split-chars').forEach(el => {
  const text = el.textContent;
  el.innerHTML = text.split('').map((ch, i) =>
    `<span style="display:inline-block;transition-delay:${i*0.03}s">${ch === ' ' ? '&nbsp;' : ch}</span>`
  ).join('');
  el.classList.add('chars-ready');
});

/* ── SCROLL-TRIGGERED SKILL ITEM STAGGER ── */
const skillSectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.skill-item').forEach((item, i) => {
        item.style.transitionDelay = (i * 0.04) + 's';
        item.classList.add('visible');
      });
      skillSectionObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.skill-card').forEach(card => {
  card.querySelectorAll('.skill-item').forEach(item => {
    item.classList.add('reveal');
  });
  skillSectionObserver.observe(card);
});
