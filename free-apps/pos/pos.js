(async function () {
  const auth = await initAppShell("pos");
  if (!auth) return;

  document.getElementById("h-checkout").innerHTML = `${icon("pos")} Quick checkout`;
  document.getElementById("h-products").innerHTML = `${icon("package")} Products`;
  document.getElementById("h-sales").innerHTML = `${icon("chart")} Recent sales`;
  document.getElementById("btn-checkout").innerHTML = `${icon("check")} Complete sale`;
  document.getElementById("btn-add-product").innerHTML = `${icon("plus")} Add product`;

  const sb = getSupabase();
  const uid = auth.session.user.id;
  let productsCache = [];

  async function load() {
    const [products, sales] = await Promise.all([
      sb.from("pos_products").select("*").order("name"),
      sb.from("pos_sales").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    productsCache = products.data || [];
    const s = sales.data || [];
    const todayTotal = s
      .filter((x) => new Date(x.created_at).toDateString() === new Date().toDateString())
      .reduce((sum, x) => sum + Number(x.total), 0);

    document.getElementById("pos-stats").innerHTML = `
      <div class="stat-card"><div class="label">Products</div><div class="value">${productsCache.length}</div></div>
      <div class="stat-card"><div class="label">Sales today</div><div class="value">${formatMoney(todayTotal)}</div></div>
      <div class="stat-card"><div class="label">All receipts</div><div class="value">${s.length}</div></div>
    `;

    const sel = document.getElementById("checkout-product");
    sel.innerHTML = productsCache.length
      ? productsCache.map((p) => `<option value="${p.id}">${escapeHtml(p.name)} — ${formatMoney(p.price)} (stock: ${p.stock})</option>`).join("")
      : `<option value="">Add products first</option>`;

    const pt = document.getElementById("products-table");
    if (!productsCache.length) {
      pt.innerHTML = `<p class="empty-state">No products yet.</p>`;
    } else {
      pt.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Name</th><th>Price</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            ${productsCache
              .map(
                (p) => `
              <tr>
                <td>${escapeHtml(p.name)}</td>
                <td>${formatMoney(p.price)}</td>
                <td>${p.stock}</td>
                <td><button type="button" class="btn btn--ghost btn--sm" data-del="${p.id}">${icon("trash")}</button></td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>`;
      pt.querySelectorAll("[data-del]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await sb.from("pos_products").delete().eq("id", btn.dataset.del);
          load();
        });
      });
    }

    const st = document.getElementById("sales-table");
    if (!s.length) {
      st.innerHTML = `<p class="empty-state">No sales yet.</p>`;
    } else {
      st.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Receipt</th><th>Items</th><th>Total</th><th>Payment</th><th>Date</th></tr></thead>
          <tbody>
            ${s
              .map((r) => {
                const items = (r.items || []).map((i) => `${i.name} x${i.qty}`).join(", ");
                return `<tr>
                  <td>${escapeHtml(r.receipt_no)}</td>
                  <td>${escapeHtml(items)}</td>
                  <td>${formatMoney(r.total)}</td>
                  <td>${escapeHtml(r.payment_method)}</td>
                  <td>${formatDate(r.created_at)}</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>`;
    }
  }

  document.getElementById("form-product").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await sb.from("pos_products").insert({
      user_id: uid,
      name: fd.get("name"),
      price: Number(fd.get("price")),
      stock: Number(fd.get("stock")),
    });
    await logActivity("pos", "create_product", {});
    e.target.reset();
    showToast("Product added", "success");
    load();
  });

  document.getElementById("form-checkout").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const product = productsCache.find((p) => p.id === fd.get("product_id"));
    if (!product) {
      showToast("Select a product", "error");
      return;
    }
    const qty = Number(fd.get("qty"));
    if (qty > product.stock) {
      showToast("Insufficient stock", "error");
      return;
    }

    const subtotal = qty * Number(product.price);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    const receipt_no = `RCP-${Date.now().toString(36).toUpperCase()}`;

    await sb.from("pos_sales").insert({
      user_id: uid,
      receipt_no,
      items: [{ product_id: product.id, name: product.name, qty, price: product.price }],
      subtotal,
      tax,
      total,
      payment_method: fd.get("payment_method"),
    });

    await sb
      .from("pos_products")
      .update({ stock: product.stock - qty })
      .eq("id", product.id);

    await logActivity("pos", "sale", { receipt_no, total });
    showToast(`Sale ${receipt_no} — ${formatMoney(total)}`, "success");
    load();
  });

  await logActivity("pos", "open", {});
  load();
})();
