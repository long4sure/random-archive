/* ─────────────────────────────────────────
   Jerome Misa Portfolio — script.js
   ───────────────────────────────────────── */

/* == SCROLL REVEAL == */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.08 }
);

document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = (i % 5) * 70 + "ms";
  observer.observe(el);
});

/* == CONTACT FORM == */
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("form-status");
const submitBtn = document.getElementById("form-submit");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name    = document.getElementById("f-name").value.trim();
    const email   = document.getElementById("f-email").value.trim();
    const subject = document.getElementById("f-subject").value.trim();
    const message = document.getElementById("f-message").value.trim();

    if (!name || !email || !message) {
      setStatus("Please fill in all required fields.", "error");
      return;
    }

    if (!isValidEmail(email)) {
      setStatus("Please enter a valid email address.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    // Build mailto link as the contact mechanism
    const body = encodeURIComponent(
      `Hello Jerome,\n\nMy name is ${name}.\n\n${message}\n\n---\nSent from portfolio contact form\nReply to: ${email}`
    );
    const sub  = encodeURIComponent(subject || `Portfolio message from ${name}`);
    const mailto = `mailto:jemisa@sscrcan.edu.ph?subject=${sub}&body=${body}`;

    // Small delay for UX feedback, then open mail client
    setTimeout(() => {
      window.location.href = mailto;
      setStatus("✓ Your mail client has been opened. Thank you!", "success");
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message →";
    }, 500);
  });
}

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = "form-status " + type;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* == ACTIVE NAV LINK HIGHLIGHT ON SCROLL == */
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach((sec) => {
    const top = sec.offsetTop - 120;
    if (window.scrollY >= top) current = sec.getAttribute("id");
  });
  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === "#" + current) {
      link.classList.add("active");
    }
  });
}, { passive: true });
