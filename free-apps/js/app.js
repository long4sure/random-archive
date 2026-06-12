function formatMoney(n) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function showToast(message, type = "info") {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = `toast toast--${type} toast--visible`;
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.classList.remove("toast--visible");
  }, 4000);
}

function renderNav(profile, activeSystem) {
  const nav = document.getElementById("app-nav");
  if (!nav) return;

  const systems = [
    { id: "erp", label: "ERP", path: appUrl("erp/index.html") },
    { id: "pos", label: "POS", path: appUrl("pos/index.html") },
    { id: "crm", label: "CRM", path: appUrl("crm/index.html") },
  ];

  let links = systems
    .map(
      (s) =>
        `<a href="${s.path}" class="nav-link${activeSystem === s.id ? " nav-link--active" : ""}">${icon(s.id)} ${s.label}</a>`
    )
    .join("");

  if (profile?.role === "admin") {
    links += `<a href="${appUrl("admin/index.html")}" class="nav-link${activeSystem === "admin" ? " nav-link--active" : ""}">${icon("admin")} Admin</a>`;
  }

  nav.innerHTML = `
    <div class="nav-brand"><a href="${appUrl("dashboard.html")}">${icon("shield", "icon icon--sm")} BizSuite</a></div>
    <div class="nav-links">${links}</div>
    <div class="nav-user">
      <span class="nav-user-name">${profile?.full_name || profile?.email || "User"}</span>
      <button type="button" class="btn btn--ghost btn--sm" id="btn-logout">${icon("logout")} Sign out</button>
    </div>
  `;

  document.getElementById("btn-logout")?.addEventListener("click", signOut);
}

async function initAppShell(activeSystem) {
  const auth = await requireAuth();
  if (!auth) return null;

  renderNav(auth.profile, activeSystem);
  return auth;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

window.formatMoney = formatMoney;
window.formatDate = formatDate;
window.showToast = showToast;
window.renderNav = renderNav;
window.initAppShell = initAppShell;
window.escapeHtml = escapeHtml;
