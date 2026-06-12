(async function () {
  const auth = await requireAuth();
  if (!auth) return;

  if (auth.profile.role !== "admin") {
    showToast("Admin access required", "error");
    location.href = appUrl("dashboard.html");
    return;
  }

  renderNav(auth.profile, "admin");
  document.getElementById("btn-logout")?.addEventListener("click", signOut);

  document.getElementById("h-users").innerHTML = `${icon("users")} All users`;
  document.getElementById("h-activity").innerHTML = `${icon("chart")} Recent activity`;

  const sb = getSupabase();

  async function load() {
    const [profiles, activity, erpCount, posCount, crmCount] = await Promise.all([
      sb.from("profiles").select("*").order("created_at", { ascending: false }),
      sb
        .from("app_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      sb.from("erp_products").select("id", { count: "exact", head: true }),
      sb.from("pos_sales").select("id", { count: "exact", head: true }),
      sb.from("crm_contacts").select("id", { count: "exact", head: true }),
    ]);

    const users = profiles.data || [];
    const logs = activity.data || [];
    const profileMap = Object.fromEntries(users.map((u) => [u.id, u]));

    document.getElementById("admin-stats").innerHTML = `
      <div class="stat-card"><div class="label">Users</div><div class="value">${users.length}</div></div>
      <div class="stat-card"><div class="label">ERP records</div><div class="value">${erpCount.count ?? 0}</div></div>
      <div class="stat-card"><div class="label">POS sales</div><div class="value">${posCount.count ?? 0}</div></div>
      <div class="stat-card"><div class="label">CRM contacts</div><div class="value">${crmCount.count ?? 0}</div></div>
    `;

    const ut = document.getElementById("users-table");
    ut.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Joined</th></tr></thead>
        <tbody>
          ${users
            .map(
              (u) => `<tr>
              <td>${escapeHtml(u.full_name || "—")}</td>
              <td>${escapeHtml(u.email)}</td>
              <td><span class="status-pill">${escapeHtml(u.role)}</span></td>
              <td>${u.email_verified ? icon("check") : "—"}</td>
              <td>${formatDate(u.created_at)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;

    const at = document.getElementById("activity-table");
    if (!logs.length) {
      at.innerHTML = `<p class="empty-state">No activity logged yet.</p>`;
    } else {
      at.innerHTML = `
        <table class="data-table">
          <thead><tr><th>User</th><th>System</th><th>Action</th><th>When</th></tr></thead>
          <tbody>
            ${logs
              .map((a) => {
                const p = profileMap[a.user_id];
                const name = p?.full_name || p?.email || a.user_id?.slice(0, 8) || "—";
                return `<tr>
                  <td>${escapeHtml(name)}</td>
                  <td><span class="status-pill">${escapeHtml(a.system)}</span></td>
                  <td>${escapeHtml(a.action)}</td>
                  <td>${formatDate(a.created_at)}</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>`;
    }
  }

  await logActivity("admin", "open", {});
  load();
})();
