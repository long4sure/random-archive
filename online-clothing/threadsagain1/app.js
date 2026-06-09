/* ============================================================
   ThreadsAgain — Frontend MVC App
   Architecture:
     Model   → ProductModel, CartModel  (data + storage)
     View    → ProductView, CartView, AdminView  (render)
     Controller → App  (orchestrates everything)
   ============================================================ */

// ══════════════════════════════════════════════════════════════
// MODEL LAYER
// ══════════════════════════════════════════════════════════════

const ProductModel = (() => {
  const STORAGE_KEY = 'threadsagain_products';

  // Seed data — default products
  const SEED = [
    {
      id: 1, name: "Vintage Levi's Denim Jacket", category: "Outerwear",
      price: 650, size: "M", condition: "Like New", stock: 1,
      image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=400&q=80",
      description: "Classic 90s Levi's trucker jacket. Light wash, minimal wear on collar. A timeless wardrobe staple."
    },
    {
      id: 2, name: "Floral Wrap Dress", category: "Dresses",
      price: 380, size: "S", condition: "Good", stock: 2,
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80",
      description: "Lightweight summer wrap dress with beautiful floral print. Hits at the knee. Perfect for picnics or brunch."
    },
    {
      id: 3, name: "Oversized Plaid Blazer", category: "Outerwear",
      price: 480, size: "L", condition: "Like New", stock: 1,
      image: "https://images.unsplash.com/photo-1594938298603-c8148c4f5a32?w=400&q=80",
      description: "Oversized plaid blazer in earth tones. Great layering piece for fall. Barely worn."
    },
    {
      id: 4, name: "Y2K Baby Tee", category: "Tops",
      price: 180, size: "XS", condition: "Good", stock: 3,
      image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80",
      description: "Ribbed stretch baby tee in soft lavender. Very Y2K energy. Pairs with low-waist jeans or a maxi skirt."
    },
    {
      id: 5, name: "Wide-Leg Corduroy Pants", category: "Bottoms",
      price: 420, size: "M", condition: "Like New", stock: 1,
      image: "https://images.unsplash.com/photo-1594938382347-35d85f8e87da?w=400&q=80",
      description: "Rich terracotta corduroy wide-legs. High-waisted and super flattering. Side pockets."
    },
    {
      id: 6, name: "Bucket Hat — Patchwork", category: "Accessories",
      price: 150, size: "One Size", condition: "Good", stock: 4,
      image: "https://images.unsplash.com/photo-1533827432537-70133748f5c8?w=400&q=80",
      description: "Fun patchwork bucket hat made from repurposed fabric scraps. Truly one-of-a-kind piece."
    },
    {
      id: 7, name: "Band Tee — The Cure", category: "Tops",
      price: 250, size: "L", condition: "Fair", stock: 1,
      image: "https://images.unsplash.com/photo-1503341733017-1901578f9f1e?w=400&q=80",
      description: "Worn-in authentic band tee from the 90s. Some fading adds to its character. A real collector's find."
    },
    {
      id: 8, name: "Denim Mini Skirt", category: "Bottoms",
      price: 290, size: "S", condition: "Like New", stock: 2,
      image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&q=80",
      description: "Classic denim mini with frayed hem. High waist, zip closure. Pairs with anything."
    }
  ];

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    // First visit — seed and save
    _save(SEED);
    return JSON.parse(JSON.stringify(SEED));
  }

  function _save(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }

  function getAll() { return _load(); }

  function getById(id) {
    return _load().find(p => p.id === id) || null;
  }

  function create(data) {
    const products = _load();
    const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const product = { id: newId, ...data };
    products.unshift(product);
    _save(products);
    return product;
  }

  function update(id, data) {
    const products = _load();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...data };
    _save(products);
    return products[idx];
  }

  function remove(id) {
    const products = _load().filter(p => p.id !== id);
    _save(products);
  }

  function decreaseStock(id) {
    const products = _load();
    const p = products.find(p => p.id === id);
    if (p && p.stock > 0) { p.stock--; _save(products); }
  }

  return { getAll, getById, create, update, remove, decreaseStock };
})();


// ── CART MODEL ──────────────────────────────────────────────
const CartModel = (() => {
  const STORAGE_KEY = 'threadsagain_cart';

  function _load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
  }

  function _save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function getItems() { return _load(); }

  function getCount() { return _load().reduce((sum, i) => sum + i.qty, 0); }

  function addItem(product) {
    const items = _load();
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      if (existing.qty < product.stock) existing.qty++;
    } else {
      items.push({ id: product.id, qty: 1 });
    }
    _save(items);
  }

  function removeItem(id) {
    _save(_load().filter(i => i.id !== id));
  }

  function updateQty(id, qty) {
    const items = _load();
    const item = items.find(i => i.id === id);
    if (item) { item.qty = Math.max(1, qty); _save(items); }
  }

  function clear() { _save([]); }

  function getTotal() {
    const items = _load();
    return items.reduce((sum, i) => {
      const p = ProductModel.getById(i.id);
      return sum + (p ? p.price * i.qty : 0);
    }, 0);
  }

  return { getItems, getCount, addItem, removeItem, updateQty, clear, getTotal };
})();


// ══════════════════════════════════════════════════════════════
// VIEW LAYER
// ══════════════════════════════════════════════════════════════

const ProductView = (() => {

  function conditionClass(c) {
    if (c === 'Like New') return 'badge-like-new';
    if (c === 'Good') return 'badge-good';
    return 'badge-fair';
  }

  function fallbackImg(e) {
    e.target.src = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80';
  }

  function renderGrid(products) {
    const grid = document.getElementById('productGrid');
    const empty = document.getElementById('emptyState');
    const countEl = document.getElementById('itemCount');

    countEl.textContent = `${products.length} item${products.length !== 1 ? 's' : ''}`;

    if (!products.length) {
      grid.innerHTML = '';
      empty.classList.remove('d-none');
      return;
    }
    empty.classList.add('d-none');

    grid.innerHTML = products.map(p => `
      <div class="col-6 col-sm-6 col-md-4 col-lg-3">
        <div class="product-card" onclick="App.showDetail(${p.id})">
          <div class="product-img-wrap">
            <img src="${p.image || ''}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80'"/>
            <span class="product-badge ${conditionClass(p.condition)}">${p.condition}</span>
            ${p.stock === 0 ? '<div class="out-of-stock-overlay">Sold Out</div>' : ''}
          </div>
          <div class="product-body">
            <p class="product-cat">${p.category}</p>
            <h3 class="product-name">${p.name}</h3>
            <div class="product-meta">
              <span class="product-size">${p.size}</span>
              <span class="product-price">₱${p.price.toLocaleString()}</span>
            </div>
            <button class="btn-addcart" onclick="event.stopPropagation(); App.addToCart(${p.id})" ${p.stock === 0 ? 'disabled' : ''}>
              ${p.stock === 0 ? 'Sold Out' : '+ Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderDetail(p) {
    const cartItems = CartModel.getItems();
    const inCart = cartItems.find(i => i.id === p.id);

    document.getElementById('detailContent').innerHTML = `
      <div class="col-md-6">
        <img src="${p.image || ''}" alt="${p.name}" class="detail-img"
          onerror="this.src='https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80'"/>
      </div>
      <div class="col-md-6 d-flex flex-column justify-content-center">
        <p style="font-size:0.78rem;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted)">${p.category}</p>
        <h2 style="font-family:var(--font-display);font-size:1.9rem;font-weight:900;color:var(--bark)">${p.name}</h2>
        <p class="detail-price">₱${p.price.toLocaleString()}</p>
        <div class="detail-badge-row">
          <span class="detail-tag ${conditionClass(p.condition)}">${p.condition}</span>
          <span class="detail-tag" style="background:var(--sand);color:var(--bark)">Size: ${p.size}</span>
          <span class="detail-tag" style="background:var(--rust-light);color:var(--rust)">${p.stock > 0 ? `${p.stock} in stock` : 'Sold Out'}</span>
        </div>
        <p class="detail-desc">${p.description || 'No description provided.'}</p>
        <div class="d-flex gap-2 mt-3 flex-wrap">
          <button class="btn btn-hero" onclick="App.addToCart(${p.id})" ${p.stock === 0 ? 'disabled' : ''}>
            ${p.stock === 0 ? 'Sold Out' : (inCart ? '+ Add More' : '+ Add to Cart')}
          </button>
          ${inCart ? `<button class="btn btn-back" onclick="App.showView('cart')">View Cart (${inCart.qty})</button>` : ''}
        </div>
      </div>
    `;
  }

  return { renderGrid, renderDetail };
})();


const CartView = (() => {

  function render() {
    const items = CartModel.getItems();
    const container = document.getElementById('cartContent');

    if (!items.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <h4>Your cart is empty</h4>
          <p>Browse the shop and find something you love.</p>
          <button class="btn btn-hero mt-2" onclick="App.showView('home')">Browse Shop</button>
        </div>`;
      return;
    }

    const total = CartModel.getTotal();

    const listHTML = items.map(item => {
      const p = ProductModel.getById(item.id);
      if (!p) return '';
      return `
        <div class="cart-item" id="cart-item-${p.id}">
          <img src="${p.image || ''}" alt="${p.name}"
            onerror="this.src='https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80'"/>
          <div class="cart-item-info">
            <p class="cart-item-name">${p.name}</p>
            <p class="cart-item-sub">${p.category} · Size ${p.size} · ${p.condition}</p>
            <div class="qty-control mt-2">
              <button class="qty-btn" onclick="App.updateCartQty(${p.id}, ${item.qty - 1})">−</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn" onclick="App.updateCartQty(${p.id}, ${item.qty + 1})">+</button>
            </div>
          </div>
          <div class="text-end">
            <p class="cart-item-price">₱${(p.price * item.qty).toLocaleString()}</p>
            <button class="btn-remove" title="Remove" onclick="App.removeFromCart(${p.id})">✕</button>
          </div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8">${listHTML}</div>
        <div class="col-lg-4">
          <div class="cart-summary sticky-top" style="top:80px">
            <h5 style="font-family:var(--font-display);font-weight:700;margin-bottom:1rem">Order Summary</h5>
            <div class="d-flex justify-content-between mb-2">
              <span style="color:var(--muted)">Subtotal</span>
              <span>₱${total.toLocaleString()}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span style="color:var(--muted)">Shipping</span>
              <span style="color:var(--moss)">FREE</span>
            </div>
            <hr style="border-color:var(--sand)"/>
            <div class="d-flex justify-content-between mb-3">
              <strong>Total</strong>
              <strong style="color:var(--rust)">₱${total.toLocaleString()}</strong>
            </div>
            <button class="btn btn-hero w-100" onclick="App.checkout()">Place Order</button>
            <button class="btn btn-back w-100 mt-2" onclick="App.showView('home')">Continue Shopping</button>
          </div>
        </div>
      </div>`;
  }

  return { render };
})();


const AdminView = (() => {

  function renderStats() {
    const products = ProductModel.getAll();
    const totalItems = products.length;
    const totalStock = products.reduce((s, p) => s + p.stock, 0);
    const avgPrice = totalItems ? Math.round(products.reduce((s, p) => s + p.price, 0) / totalItems) : 0;
    const soldOut = products.filter(p => p.stock === 0).length;

    document.getElementById('adminStats').innerHTML = `
      ${stat('Total Items', totalItems)}
      ${stat('Total Stock', totalStock)}
      ${stat('Avg. Price', '₱' + avgPrice.toLocaleString())}
      ${stat('Sold Out', soldOut)}
    `;
  }

  function stat(label, value) {
    return `
      <div class="col-6 col-md-3">
        <div class="stat-card">
          <p class="stat-label">${label}</p>
          <p class="stat-value">${value}</p>
        </div>
      </div>`;
  }

  function renderTable() {
    const products = ProductModel.getAll();
    document.getElementById('adminTableBody').innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.image || ''}" alt="${p.name}" class="admin-thumb"
          onerror="this.src='https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80'"/></td>
        <td style="font-weight:600;max-width:160px">${p.name}</td>
        <td>${p.category}</td>
        <td>${p.size}</td>
        <td>${p.condition}</td>
        <td style="color:var(--rust);font-weight:600">₱${p.price.toLocaleString()}</td>
        <td>
          <span style="background:${p.stock > 0 ? 'var(--rust-light)' : 'var(--sand)'};color:${p.stock > 0 ? 'var(--rust)' : 'var(--muted)'};padding:2px 8px;border-radius:4px;font-size:0.78rem;font-weight:600">
            ${p.stock}
          </span>
        </td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn-edit" onclick="App.openModal(${p.id})">Edit</button>
            <button class="btn-del" onclick="App.confirmDelete(${p.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderAll() {
    renderStats();
    renderTable();
  }

  return { renderAll };
})();


// ══════════════════════════════════════════════════════════════
// CONTROLLER LAYER
// ══════════════════════════════════════════════════════════════

const App = (() => {

  let _currentView = 'home';
  let _filter = { category: 'All', search: '', sort: 'default' };
  let _deleteTargetId = null;

  const VIEWS = ['home', 'detail', 'cart', 'admin', 'success'];

  // ── Bootstrap instances
  let _productModal, _deleteModal, _toast;

  function init() {
    _productModal = new bootstrap.Modal(document.getElementById('productModal'));
    _deleteModal  = new bootstrap.Modal(document.getElementById('deleteModal'));
    _toast        = new bootstrap.Toast(document.getElementById('appToast'), { delay: 2500 });

    document.getElementById('confirmDeleteBtn').addEventListener('click', _doDelete);

    showView('home');
    _updateCartBadge();
  }

  // ── VIEW SWITCHING ───────────────────────────────────────
  function showView(view, id) {
    VIEWS.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.add('d-none');
    });

    const hero = document.getElementById('heroSection');
    hero.style.display = view === 'home' ? '' : 'none';

    document.getElementById(`view-${view}`).classList.remove('d-none');
    _currentView = view;

    if (view === 'home')   { _renderShop(); }
    if (view === 'detail') { _renderDetail(id); }
    if (view === 'cart')   { CartView.render(); }
    if (view === 'admin')  { AdminView.renderAll(); }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function scrollToShop() {
    document.getElementById('appContent').scrollIntoView({ behavior: 'smooth' });
  }

  // ── SHOP RENDERING ───────────────────────────────────────
  function _renderShop() {
    let products = ProductModel.getAll();

    // Filter category
    if (_filter.category !== 'All') {
      products = products.filter(p => p.category === _filter.category);
    }

    // Filter search
    if (_filter.search.trim()) {
      const q = _filter.search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (_filter.sort === 'price-asc') products.sort((a, b) => a.price - b.price);
    if (_filter.sort === 'price-desc') products.sort((a, b) => b.price - a.price);
    if (_filter.sort === 'name-asc') products.sort((a, b) => a.name.localeCompare(b.name));

    ProductView.renderGrid(products);

    // Update heading
    document.getElementById('shopHeading').textContent = _filter.category === 'All' ? 'All Items' : _filter.category;
    document.getElementById('shopSubtitle').textContent =
      _filter.search ? `Results for "${_filter.search}"` : 'Explore our full collection';
  }

  function _renderDetail(id) {
    const p = ProductModel.getById(id);
    if (!p) { showView('home'); return; }
    ProductView.renderDetail(p);
  }

  // ── FILTER / SEARCH / SORT ───────────────────────────────
  function filterCategory(cat) {
    _filter.category = cat;
    _filter.search = '';
    document.getElementById('searchInput').value = '';
    showView('home');
  }

  function search(query) {
    _filter.search = query;
    if (_currentView !== 'home') showView('home');
    else _renderShop();
  }

  function sort(val) {
    _filter.sort = val;
    _renderShop();
  }

  // ── CART ────────────────────────────────────────────────
  function addToCart(id) {
    const p = ProductModel.getById(id);
    if (!p || p.stock === 0) return;
    CartModel.addItem(p);
    _updateCartBadge();
    _showToast(`"${p.name}" added to cart 🛒`);
    // Refresh detail view button state if on detail page
    if (_currentView === 'detail') _renderDetail(id);
  }

  function removeFromCart(id) {
    CartModel.removeItem(id);
    _updateCartBadge();
    CartView.render();
  }

  function updateCartQty(id, qty) {
    const p = ProductModel.getById(id);
    if (!p) return;
    if (qty < 1) { removeFromCart(id); return; }
    if (qty > p.stock) { _showToast('Not enough stock available.'); return; }
    CartModel.updateQty(id, qty);
    _updateCartBadge();
    CartView.render();
  }

  function checkout() {
    const items = CartModel.getItems();
    // Decrease stock for each item
    items.forEach(item => {
      for (let i = 0; i < item.qty; i++) ProductModel.decreaseStock(item.id);
    });
    CartModel.clear();
    _updateCartBadge();
    showView('success');
  }

  function _updateCartBadge() {
    document.getElementById('cartCount').textContent = CartModel.getCount();
  }

  // ── CRUD: ADD / EDIT ────────────────────────────────────
  function openModal(id) {
    const err = document.getElementById('formError');
    err.classList.add('d-none');

    if (id) {
      const p = ProductModel.getById(id);
      if (!p) return;
      document.getElementById('modalTitle').textContent = 'Edit Item';
      document.getElementById('editId').value = p.id;
      document.getElementById('f-name').value = p.name;
      document.getElementById('f-category').value = p.category;
      document.getElementById('f-price').value = p.price;
      document.getElementById('f-size').value = p.size;
      document.getElementById('f-stock').value = p.stock;
      document.getElementById('f-condition').value = p.condition;
      document.getElementById('f-image').value = p.image || '';
      document.getElementById('f-desc').value = p.description || '';
    } else {
      document.getElementById('modalTitle').textContent = 'Add New Item';
      document.getElementById('editId').value = '';
      ['f-name','f-category','f-price','f-size','f-stock','f-condition','f-image','f-desc']
        .forEach(id => { document.getElementById(id).value = ''; });
      document.getElementById('f-size').value = 'One Size';
      document.getElementById('f-condition').value = 'Like New';
    }
    _productModal.show();
  }

  function saveProduct() {
    const err = document.getElementById('formError');
    const name     = document.getElementById('f-name').value.trim();
    const category = document.getElementById('f-category').value;
    const price    = parseFloat(document.getElementById('f-price').value);
    const size     = document.getElementById('f-size').value;
    const stock    = parseInt(document.getElementById('f-stock').value);
    const condition = document.getElementById('f-condition').value;
    const image    = document.getElementById('f-image').value.trim();
    const description = document.getElementById('f-desc').value.trim();

    // Validation
    if (!name || !category || isNaN(price) || isNaN(stock)) {
      err.textContent = 'Please fill in all required fields (Name, Category, Price, Stock).';
      err.classList.remove('d-none');
      return;
    }
    if (price < 0 || stock < 0) {
      err.textContent = 'Price and stock must be 0 or greater.';
      err.classList.remove('d-none');
      return;
    }

    const data = { name, category, price, size, stock, condition, image, description };
    const editId = document.getElementById('editId').value;

    if (editId) {
      ProductModel.update(parseInt(editId), data);
      _showToast('Item updated ✓');
    } else {
      ProductModel.create(data);
      _showToast('New item added ✓');
    }

    _productModal.hide();
    AdminView.renderAll();
  }

  // ── CRUD: DELETE ─────────────────────────────────────────
  function confirmDelete(id) {
    _deleteTargetId = id;
    _deleteModal.show();
  }

  function _doDelete() {
    if (_deleteTargetId !== null) {
      ProductModel.remove(_deleteTargetId);
      CartModel.removeItem(_deleteTargetId);
      _deleteTargetId = null;
      _deleteModal.hide();
      _updateCartBadge();
      AdminView.renderAll();
      _showToast('Item deleted.');
    }
  }

  // ── DETAIL ───────────────────────────────────────────────
  function showDetail(id) {
    showView('detail', id);
  }

  // ── TOAST ─────────────────────────────────────────────
  function _showToast(msg, type = 'success') {
    document.getElementById('toastMsg').textContent = msg;
    const el = document.getElementById('appToast');
    el.style.background = type === 'error' ? '#C0392B' : 'var(--bark)';
    _toast.show();
  }

  // ── PUBLIC API ───────────────────────────────────────────
  return {
    init, showView, scrollToShop,
    filterCategory, search, sort,
    addToCart, removeFromCart, updateCartQty, checkout,
    showDetail, openModal, saveProduct, confirmDelete
  };

})();

// Bootstrap the app once DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
