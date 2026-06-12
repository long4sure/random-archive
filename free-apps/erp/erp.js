(async function () {
  const auth = await initAppShell("erp");
  if (!auth) return;

  document.getElementById("h-products").innerHTML = icon("package");
  document.getElementById("h-orders").innerHTML = icon("chart");
  document.getElementById("btn-add-product").innerHTML = `${icon("plus")} Add product`;
  document.getElementById("btn-add-order").innerHTML = `${icon("plus")} Add order`;

  const sb = getSupabase();
  const uid = auth.session.user.id;

  async function load() {
    const [products, orders] = await Promise.all([
      sb.from("erp_products").select("*").order("created_at", { ascending: false }),
      sb.from("erp_orders").select("*").order("created_at", { ascending: false }),
    ]);

    const p = products.data || [];
    const o = orders.data || [];
    const stockValue = p.reduce((s, x) => s + x.quantity * Number(x.unit_price), 0);

    document.getElementById("erp-stats").innerHTML = `
      <div class="stat-card"><div class="label">Products</div><div class="value">${p.length}</div></div>
      <div class="stat-card"><div class="label">Orders</div><div class="value">${o.length}</div></div>
      <div class="stat-card"><div class="label">Inventory value</div><div class="value">${formatMoney(stockValue)}</div></div>
    `;

    renderTable("products-table", p, [
      { key: "sku", label: "SKU" },
      { key: "name", label: "Name" },
      { key: "quantity", label: "Qty" },
      { key: "unit_price", label: "Price", fmt: formatMoney },
    ], "erp_products");

    renderTable("orders-table", o, [
      { key: "order_number", label: "Order #" },
      { key: "status", label: "Status", pill: true },
      { key: "total_amount", label: "Total", fmt: formatMoney },
      { key: "created_at", label: "Created", fmt: formatDate },
    ], "erp_orders");
  }

  function renderTable(containerId, rows, cols, table) {
    const el = document.getElementById(containerId);
    if (!rows.length) {
      el.innerHTML = `<p class="empty-state">No records yet.</p>`;
      return;
    }
    el.innerHTML = `
      <table class="data-table">
        <thead><tr>${cols.map((c) => `<th>${c.label}</th>`).join("")}<th></th></tr></thead>
        <tbody>
          ${rows
            .map(
              (r) => `
            <tr>
              ${cols
                .map((c) => {
                  const v = r[c.key];
                  const display = c.fmt ? c.fmt(v) : c.pill ? `<span class="status-pill">${escapeHtml(v)}</span>` : escapeHtml(String(v ?? ""));
                  return `<td>${display}</td>`;
                })
                .join("")}
              <td><button type="button" class="btn btn--ghost btn--sm" data-del="${r.id}" data-table="${table}">${icon("trash")}</button></td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;

    el.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await sb.from(btn.dataset.table).delete().eq("id", btn.dataset.del);
        await logActivity("erp", "delete", { table: btn.dataset.table });
        showToast("Deleted", "success");
        load();
      });
    });
  }

  document.getElementById("form-product").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await sb.from("erp_products").insert({
      user_id: uid,
      sku: fd.get("sku"),
      name: fd.get("name"),
      quantity: Number(fd.get("quantity")),
      unit_price: Number(fd.get("unit_price")),
    });
    await logActivity("erp", "create_product", { sku: fd.get("sku") });
    e.target.reset();
    showToast("Product added", "success");
    load();
  });

  document.getElementById("form-order").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await sb.from("erp_orders").insert({
      user_id: uid,
      order_number: fd.get("order_number"),
      status: fd.get("status"),
      total_amount: Number(fd.get("total_amount")),
      notes: fd.get("notes") || "",
    });
    await logActivity("erp", "create_order", { order_number: fd.get("order_number") });
    e.target.reset();
    showToast("Order added", "success");
    load();
  });

  await logActivity("erp", "open", {});
  load();
})();
