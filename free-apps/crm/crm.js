(async function () {
  const auth = await initAppShell("crm");
  if (!auth) return;

  document.getElementById("h-contacts").innerHTML = `${icon("users")} Contacts`;
  document.getElementById("h-deals").innerHTML = `${icon("chart")} Deals pipeline`;
  document.getElementById("btn-add-contact").innerHTML = `${icon("plus")} Add contact`;
  document.getElementById("btn-add-deal").innerHTML = `${icon("plus")} Add deal`;

  const sb = getSupabase();
  const uid = auth.session.user.id;

  async function load() {
    const [contacts, deals] = await Promise.all([
      sb.from("crm_contacts").select("*").order("created_at", { ascending: false }),
      sb.from("crm_deals").select("*, crm_contacts(name)").order("created_at", { ascending: false }),
    ]);

    const c = contacts.data || [];
    const d = deals.data || [];
    const pipeline = d.filter((x) => !["won", "lost"].includes(x.stage));
    const wonValue = d.filter((x) => x.stage === "won").reduce((s, x) => s + Number(x.value), 0);

    document.getElementById("crm-stats").innerHTML = `
      <div class="stat-card"><div class="label">Contacts</div><div class="value">${c.length}</div></div>
      <div class="stat-card"><div class="label">Open deals</div><div class="value">${pipeline.length}</div></div>
      <div class="stat-card"><div class="label">Won value</div><div class="value">${formatMoney(wonValue)}</div></div>
    `;

    const sel = document.getElementById("deal-contact");
    sel.innerHTML =
      `<option value="">— None —</option>` +
      c.map((x) => `<option value="${x.id}">${escapeHtml(x.name)}</option>`).join("");

    const ct = document.getElementById("contacts-table");
    if (!c.length) {
      ct.innerHTML = `<p class="empty-state">No contacts yet.</p>`;
    } else {
      ct.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${c
              .map(
                (r) => `<tr>
                <td>${escapeHtml(r.name)}</td>
                <td>${escapeHtml(r.company || "—")}</td>
                <td>${escapeHtml(r.email || "—")}</td>
                <td><span class="status-pill">${escapeHtml(r.status)}</span></td>
                <td><button type="button" class="btn btn--ghost btn--sm" data-del-contact="${r.id}">${icon("trash")}</button></td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>`;
      ct.querySelectorAll("[data-del-contact]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await sb.from("crm_contacts").delete().eq("id", btn.dataset.delContact);
          load();
        });
      });
    }

    const dt = document.getElementById("deals-table");
    if (!d.length) {
      dt.innerHTML = `<p class="empty-state">No deals yet.</p>`;
    } else {
      dt.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Title</th><th>Contact</th><th>Stage</th><th>Value</th><th></th></tr></thead>
          <tbody>
            ${d
              .map((r) => {
                const contactName = r.crm_contacts?.name || "—";
                return `<tr>
                  <td>${escapeHtml(r.title)}</td>
                  <td>${escapeHtml(contactName)}</td>
                  <td><span class="status-pill">${escapeHtml(r.stage)}</span></td>
                  <td>${formatMoney(r.value)}</td>
                  <td><button type="button" class="btn btn--ghost btn--sm" data-del-deal="${r.id}">${icon("trash")}</button></td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>`;
      dt.querySelectorAll("[data-del-deal]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await sb.from("crm_deals").delete().eq("id", btn.dataset.delDeal);
          load();
        });
      });
    }
  }

  document.getElementById("form-contact").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await sb.from("crm_contacts").insert({
      user_id: uid,
      name: fd.get("name"),
      email: fd.get("email") || null,
      phone: fd.get("phone") || null,
      company: fd.get("company") || null,
      status: fd.get("status"),
    });
    await logActivity("crm", "create_contact", {});
    e.target.reset();
    showToast("Contact added", "success");
    load();
  });

  document.getElementById("form-deal").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const contact_id = fd.get("contact_id") || null;
    await sb.from("crm_deals").insert({
      user_id: uid,
      title: fd.get("title"),
      contact_id: contact_id || null,
      value: Number(fd.get("value")),
      stage: fd.get("stage"),
    });
    await logActivity("crm", "create_deal", {});
    e.target.reset();
    showToast("Deal added", "success");
    load();
  });

  await logActivity("crm", "open", {});
  load();
})();
