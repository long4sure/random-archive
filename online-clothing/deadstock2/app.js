/* ╔══════════════════════════════════════════════════════════════╗
   ║  DEADSTOCK — app.js                                         ║
   ║  Architecture: Object-Oriented Programming (OOP)            ║
   ║                                                             ║
   ║  OOP CONCEPTS USED IN THIS FILE:                            ║
   ║  1. CLASS              — blueprint for objects              ║
   ║  2. CONSTRUCTOR        — initializes a new object           ║
   ║  3. ENCAPSULATION      — hiding data inside a class         ║
   ║  4. INHERITANCE        — child class extends parent         ║
   ║  5. POLYMORPHISM       — same method, different behavior    ║
   ║  6. ABSTRACTION        — hide complexity, expose interface  ║
   ║  7. STATIC METHODS     — belongs to class, not instance     ║
   ║  8. GETTER / SETTER    — controlled property access         ║
   ╚══════════════════════════════════════════════════════════════╝ */


/* ══════════════════════════════════════════════════════════════
   ░░  SECTION 1 — DATA MODELS (Classes representing real things)
   ══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   OOP CONCEPT: CLASS + CONSTRUCTOR
   A class is a blueprint. The constructor runs when you do
   `new Product(...)` and sets up the object's initial values.
───────────────────────────────────────────────────────────── */
class Product {
  /* OOP: CONSTRUCTOR — initializes properties on `this` */
  constructor({ id, name, category, price, size, condition, stock, image, description, status = 'approved', seller = 'Admin' }) {
    /* OOP: ENCAPSULATION — all product data lives inside this object */
    this.id          = id;
    this.name        = name;
    this.category    = category;
    this.price       = price;
    this.size        = size;
    this.condition   = condition;
    this.stock       = stock;
    this.image       = image;
    this.description = description;
    this.status      = status;   // 'approved' | 'pending' | 'rejected'
    this.seller      = seller;
  }

  /* OOP: GETTER — computed property, accessed like product.isAvailable
     (no parentheses needed) */
  get isAvailable() {
    return this.stock > 0 && this.status === 'approved';
  }

  /* OOP: GETTER — returns a nicely formatted price string */
  get formattedPrice() {
    return `₱${this.price.toLocaleString()}`;
  }

  /* OOP: METHOD — behavior that belongs to a Product */
  decreaseStock() {
    if (this.stock > 0) this.stock--;
  }

  /* OOP: METHOD — returns a CSS class string for the condition badge */
  conditionClass() {
    const map = { 'Like New': 'cond-like-new', 'Good': 'cond-good', 'Fair': 'cond-fair' };
    return map[this.condition] || 'cond-fair';
  }

  /* OOP: METHOD — returns a CSS class for the status badge */
  statusClass() {
    const map = { approved: 's-approved', pending: 's-pending', rejected: 's-rejected' };
    return map[this.status] || 's-pending';
  }

  /* OOP: STATIC METHOD — belongs to the class itself, not an instance.
     Call it as Product.fallbackImage(), not product.fallbackImage() */
  static fallbackImage() {
    return 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80';
  }
}


/* ─────────────────────────────────────────────────────────────
   OOP CONCEPT: INHERITANCE
   CartItem IS-A kind of lightweight object derived from Product data.
   It "extends" nothing here, but below ProductRepository and
   SubmissionRepository BOTH extend BaseRepository — that IS inheritance.
───────────────────────────────────────────────────────────── */
class CartItem {
  constructor(product, qty = 1) {
    /* OOP: we store a reference to the Product object (composition) */
    this.productId = product.id;
    this.qty       = qty;
  }

  /* OOP: METHOD — calculates subtotal using the product's price */
  subtotal(product) {
    return product.price * this.qty;
  }

  increment() { this.qty++; }
  decrement() { if (this.qty > 1) this.qty--; }
}


/* ══════════════════════════════════════════════════════════════
   ░░  SECTION 2 — REPOSITORIES (Data access layer)
       These classes handle all localStorage read/write.
       Repositories use ABSTRACTION to hide storage details.
   ══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   OOP CONCEPT: ABSTRACTION + BASE CLASS (parent class)
   BaseRepository is never used directly. It defines the
   shared interface (load / save) that child classes inherit.
───────────────────────────────────────────────────────────── */
class BaseRepository {
  constructor(storageKey) {
    /* OOP: ENCAPSULATION — storageKey is protected inside the class */
    this._storageKey = storageKey;
  }

  /* OOP: METHOD shared by all child repositories */
  _load() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  _save(data) {
    localStorage.setItem(this._storageKey, JSON.stringify(data));
  }

  clear() {
    localStorage.removeItem(this._storageKey);
  }
}


/* ─────────────────────────────────────────────────────────────
   OOP CONCEPT: INHERITANCE
   ProductRepository EXTENDS BaseRepository.
   It inherits _load(), _save(), and clear() for free,
   and adds its own product-specific methods.
───────────────────────────────────────────────────────────── */
class ProductRepository extends BaseRepository {
  constructor() {
    /* OOP: super() calls the PARENT class constructor */
    super('deadstock_products');
    this._seed();
  }

  /* OOP: PRIVATE-BY-CONVENTION METHOD (_underscore = "don't call from outside")
     Seeds the store with default products on first visit */
  _seed() {
    if (this._load()) return; // already seeded

    const seedData = [
      {
        id: 1, name: "Vintage Levi's 501 Denim", category: "Bottoms",
        price: 680, size: "M", condition: "Like New", stock: 1,
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80",
        description: "Classic 90s Levi's 501s. Raw hem, slight fade on thighs. Pure drip."
      },
      {
        id: 2, name: "Band Tee — Joy Division", category: "Tops",
        price: 320, size: "L", condition: "Fair", stock: 1,
        image: "https://images.unsplash.com/photo-1503341733017-1901578f9f1e?w=400&q=80",
        description: "Worn-in authentic band tee. Fading adds to character. Collector's piece."
      },
      {
        id: 3, name: "Oversized Trench Coat", category: "Outerwear",
        price: 950, size: "L", condition: "Good", stock: 1,
        image: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=400&q=80",
        description: "Oversized camel trench, barely worn. Structured shoulders, belted waist."
      },
      {
        id: 4, name: "Patchwork Flannel Shirt", category: "Tops",
        price: 290, size: "M", condition: "Good", stock: 2,
        image: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400&q=80",
        description: "Handmade patchwork flannel. No two alike."
      },
      {
        id: 5, name: "Corduroy Wide-Leg Pants", category: "Bottoms",
        price: 450, size: "S", condition: "Like New", stock: 1,
        image: "https://images.unsplash.com/photo-1594938382347-35d85f8e87da?w=400&q=80",
        description: "Forest green cord wide-legs. High rise, cuffed hem."
      },
      {
        id: 6, name: "Silk Slip Dress", category: "Dresses",
        price: 520, size: "S", condition: "Like New", stock: 1,
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80",
        description: "90s slip dress energy. Bias cut, adjustable straps."
      },
      {
        id: 7, name: "Bucket Hat — Camo", category: "Accessories",
        price: 180, size: "One Size", condition: "Good", stock: 3,
        image: "https://images.unsplash.com/photo-1533827432537-70133748f5c8?w=400&q=80",
        description: "Vintage camo bucket. Worn-in brim."
      },
      {
        id: 8, name: "Denim Jacket — Painted", category: "Outerwear",
        price: 780, size: "M", condition: "Fair", stock: 1,
        image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=400&q=80",
        description: "Custom painted Levi's trucker. Hand-painted back panel, one-of-one."
      },
    ];

    /* OOP: we map raw data into Product instances (objects) */
    const products = seedData.map(data => new Product(data));
    this._save(products);
  }

  /* Returns all products as Product instances (not raw objects) */
  getAll() {
    const raw = this._load() || [];
    /* OOP: re-hydrating plain objects back into class instances */
    return raw.map(data => new Product(data));
  }

  getById(id) {
    return this.getAll().find(p => p.id === id) || null;
  }

  /* OOP: POLYMORPHISM preview — all repositories have save(),
     but each does it slightly differently (see CartRepository) */
  save(product) {
    const all = this.getAll();
    const idx = all.findIndex(p => p.id === product.id);
    if (idx !== -1) {
      all[idx] = product;
    } else {
      all.unshift(product);
    }
    this._save(all);
  }

  create(data) {
    const all = this.getAll();
    const newId = all.length ? Math.max(...all.map(p => p.id)) + 1 : 1;
    const product = new Product({ id: newId, ...data });
    all.unshift(product);
    this._save(all);
    return product;
  }

  remove(id) {
    const filtered = this.getAll().filter(p => p.id !== id);
    this._save(filtered);
  }
}


/* ─────────────────────────────────────────────────────────────
   OOP CONCEPT: INHERITANCE (again)
   SubmissionRepository also extends BaseRepository.
   This is how inheritance helps — we don't rewrite _load/_save.
───────────────────────────────────────────────────────────── */
class SubmissionRepository extends BaseRepository {
  constructor() {
    super('deadstock_submissions');
  }

  getAll() {
    return this._load() || [];
  }

  getPending() {
    return this.getAll().filter(s => s.status === 'pending');
  }

  add(submissionData) {
    const all   = this.getAll();
    const newId = all.length ? Math.max(...all.map(s => s.id)) + 1 : 1001;
    const submission = { id: newId, ...submissionData, status: 'pending' };
    all.push(submission);
    this._save(all);
    return submission;
  }

  updateStatus(id, status) {
    const all  = this.getAll();
    const item = all.find(s => s.id === id);
    if (item) {
      item.status = status;
      this._save(all);
    }
    return item;
  }
}


/* ─────────────────────────────────────────────────────────────
   OOP CONCEPT: INHERITANCE (third child of BaseRepository)
───────────────────────────────────────────────────────────── */
class CartRepository extends BaseRepository {
  constructor() {
    super('deadstock_cart');
  }

  getItems() {
    /* Returns plain objects — CartItem instances are rebuilt as needed */
    return this._load() || [];
  }

  /* OOP: POLYMORPHISM — save() here has different logic than ProductRepository.save()
     Same method name on different classes = polymorphism */
  save(items) {
    this._save(items);
  }

  addItem(product) {
    const items    = this.getItems();
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      if (existing.qty < product.stock) existing.qty++;
    } else {
      /* OOP: creating a CartItem instance, then extracting its data */
      const item = new CartItem(product);
      items.push({ productId: item.productId, qty: item.qty });
    }
    this.save(items);
  }

  removeItem(productId) {
    this.save(this.getItems().filter(i => i.productId !== productId));
  }

  updateQty(productId, qty) {
    const items = this.getItems();
    const item  = items.find(i => i.productId === productId);
    if (item) { item.qty = qty; this.save(items); }
  }

  getCount() {
    return this.getItems().reduce((sum, i) => sum + i.qty, 0);
  }

  getTotal(productRepo) {
    return this.getItems().reduce((sum, item) => {
      const p = productRepo.getById(item.productId);
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
  }
}


/* ══════════════════════════════════════════════════════════════
   ░░  SECTION 3 — VIEWS (Rendering classes)
       Each View class is responsible for ONE part of the UI.
       This is ABSTRACTION — the controller doesn't know HOW
       HTML is built, only that it calls view.render().
   ══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   OOP CONCEPT: CLASS + ENCAPSULATION
   ProductView hides all the messy HTML template strings inside
   its own class. Nothing outside needs to know how cards are built.
───────────────────────────────────────────────────────────── */
class ProductView {
  /* OOP: the constructor receives the DOM elements it will manage */
  constructor(gridEl, emptyEl, countEl) {
    this.grid  = gridEl;
    this.empty = emptyEl;
    this.count = countEl;
  }

  /* OOP: METHOD — renders the product grid */
  renderGrid(products) {
    this.count.textContent = `${products.length} piece${products.length !== 1 ? 's' : ''}`;

    if (!products.length) {
      this.grid.innerHTML = '';
      this.empty.classList.remove('d-none');
      return;
    }
    this.empty.classList.add('d-none');

    /* OOP: calling methods ON each Product object (p.conditionClass(), p.isAvailable) */
    this.grid.innerHTML = products.map(p => `
      <div class="col-6 col-sm-6 col-md-4 col-lg-3">
        <div class="ds-card" onclick="App.showDetail(${p.id})">
          <div class="ds-card-img">
            <img src="${p.image || ''}" alt="${p.name}"
              onerror="this.src='${Product.fallbackImage()}'"/>
            <span class="ds-cond-badge ${p.conditionClass()}">${p.condition}</span>
            ${p.stock === 0 ? '<div class="sold-out-tape">SOLD OUT</div>' : ''}
          </div>
          <div class="ds-card-body">
            <p class="ds-card-cat">${p.category}</p>
            <h3 class="ds-card-name">${p.name}</h3>
            <div class="ds-card-meta">
              <span class="ds-size-tag">${p.size}</span>
              <span class="ds-price">${p.formattedPrice}</span>
            </div>
            <button class="ds-add-btn"
              onclick="event.stopPropagation(); App.addToCart(${p.id})"
              ${!p.isAvailable ? 'disabled' : ''}>
              ${p.stock === 0 ? 'SOLD OUT' : '+ ADD TO BAG'}
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  /* OOP: METHOD — renders the full product detail page */
  renderDetail(product, inCart) {
    document.getElementById('detailContent').innerHTML = `
      <div class="col-md-6">
        <img src="${product.image || ''}" alt="${product.name}" class="detail-img"
          onerror="this.src='${Product.fallbackImage()}'"/>
      </div>
      <div class="col-md-6 d-flex flex-column justify-content-center gap-3">
        <p class="ds-section-sub">${product.category}</p>
        <h2 class="ds-section-title" style="font-size:2rem">${product.name}</h2>
        <p class="detail-price">${product.formattedPrice}</p>
        <div class="d-flex gap-2 flex-wrap">
          <span class="detail-tag ${product.conditionClass()}">${product.condition}</span>
          <span class="detail-tag" style="color:var(--faded);border-color:var(--worn)">SIZE ${product.size}</span>
          <span class="detail-tag" style="color:var(--tape);border-color:var(--tape)">
            ${product.stock > 0 ? `${product.stock} LEFT` : 'SOLD OUT'}
          </span>
        </div>
        <p class="detail-desc">${product.description || 'No description.'}</p>
        <div class="d-flex gap-2 mt-2 flex-wrap">
          <button class="ds-btn-primary" onclick="App.addToCart(${product.id})"
            ${!product.isAvailable ? 'disabled style="opacity:0.4"' : ''}>
            ${product.stock === 0 ? 'SOLD OUT' : '+ ADD TO BAG'}
          </button>
          ${inCart ? `<button class="ds-back-btn" onclick="App.showView('cart')">VIEW BAG (${inCart.qty})</button>` : ''}
        </div>
      </div>
    `;
  }
}


/* ─────────────────────────────────────────────────────────────
   OOP CONCEPT: CLASS — CartView
   Separate class = separate responsibility
───────────────────────────────────────────────────────────── */
class CartView {
  constructor(containerEl) {
    this.container = containerEl;
  }

  render(cartItems, productRepo) {
    if (!cartItems.length) {
      this.container.innerHTML = `
        <div class="ds-empty">
          <p class="ds-empty-icon">[ — ]</p>
          <h4>BAG IS EMPTY.</h4>
          <p>Go dig the rack first.</p>
          <button class="ds-btn-primary mt-3" onclick="App.showView('home')">BACK TO RACK →</button>
        </div>`;
      return;
    }

    const total = cartItems.reduce((sum, item) => {
      const p = productRepo.getById(item.productId);
      return sum + (p ? p.price * item.qty : 0);
    }, 0);

    const listHTML = cartItems.map(item => {
      const p = productRepo.getById(item.productId);
      if (!p) return '';
      return `
        <div class="cart-item">
          <img src="${p.image || ''}" alt="${p.name}"
            onerror="this.src='${Product.fallbackImage()}'"/>
          <div style="flex:1">
            <p class="cart-item-name">${p.name}</p>
            <p class="cart-item-sub">${p.category} · ${p.size} · ${p.condition}</p>
            <div class="d-flex align-items-center gap-2 mt-2">
              <button class="qty-btn" onclick="App.updateCartQty(${p.id}, ${item.qty - 1})">−</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn" onclick="App.updateCartQty(${p.id}, ${item.qty + 1})">+</button>
            </div>
          </div>
          <div class="text-end">
            <p class="cart-price">${ProductView._formatPrice(p.price * item.qty)}</p>
            <button class="btn-remove" onclick="App.removeFromCart(${p.id})">✕</button>
          </div>
        </div>`;
    }).join('');

    this.container.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8">${listHTML}</div>
        <div class="col-lg-4">
          <div class="cart-summary sticky-top" style="top:80px">
            <h5 class="ds-section-title mb-3" style="font-size:1.4rem">ORDER TOTAL</h5>
            <div class="d-flex justify-content-between mb-2">
              <span class="ds-section-sub">Subtotal</span>
              <span class="ds-section-sub">${ProductView._formatPrice(total)}</span>
            </div>
            <div class="d-flex justify-content-between mb-3">
              <span class="ds-section-sub">Shipping</span>
              <span style="color:var(--olive);font-family:var(--font-type);font-size:0.78rem">FREE ALWAYS</span>
            </div>
            <hr style="border-color:var(--worn)"/>
            <div class="d-flex justify-content-between mb-4">
              <strong class="ds-section-title" style="font-size:1.1rem">TOTAL</strong>
              <strong style="font-family:var(--font-display);font-size:1.2rem;color:var(--rust);letter-spacing:1px">
                ${ProductView._formatPrice(total)}
              </strong>
            </div>
            <button class="ds-btn-primary w-100" onclick="App.checkout()">COP IT →</button>
            <button class="ds-back-btn w-100 mt-2" onclick="App.showView('home')">KEEP DIGGING</button>
          </div>
        </div>
      </div>`;
  }

  /* OOP: STATIC HELPER — shared formatter, doesn't need 'this' */
  static _formatPrice(amount) {
    return `₱${amount.toLocaleString()}`;
  }
}

/* Attaching the static method to ProductView too so both can use it */
ProductView._formatPrice = CartView._formatPrice;


/* ─────────────────────────────────────────────────────────────
   OOP CONCEPT: CLASS — AdminView
───────────────────────────────────────────────────────────── */
class AdminView {
  renderStats(products) {
    const totalItems = products.length;
    const totalStock = products.reduce((s, p) => s + p.stock, 0);
    const avgPrice   = totalItems
      ? Math.round(products.reduce((s, p) => s + p.price, 0) / totalItems)
      : 0;
    const soldOut    = products.filter(p => p.stock === 0).length;

    document.getElementById('adminStats').innerHTML = [
      ['TOTAL ITEMS',  totalItems],
      ['TOTAL STOCK',  totalStock],
      ['AVG. PRICE',   `₱${avgPrice.toLocaleString()}`],
      ['SOLD OUT',     soldOut],
    ].map(([label, value]) => `
      <div class="col-6 col-md-3">
        <div class="stat-card">
          <p class="stat-label">${label}</p>
          <p class="stat-value">${value}</p>
        </div>
      </div>`).join('');
  }

  renderTable(products) {
    document.getElementById('adminTableBody').innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.image || ''}" alt="${p.name}" class="admin-thumb"
          onerror="this.src='${Product.fallbackImage()}'"/></td>
        <td style="font-family:var(--font-display);letter-spacing:1px;max-width:160px">${p.name}</td>
        <td>${p.category}</td>
        <td>${p.size}</td>
        <td>${p.condition}</td>
        <td style="color:var(--rust);font-family:var(--font-display)">${p.formattedPrice}</td>
        <td style="font-family:var(--font-mono)">${p.stock}</td>
        <td><span class="status-badge ${p.statusClass()}">${p.status.toUpperCase()}</span></td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn-edit" onclick="App.openModal(${p.id})">EDIT</button>
            <button class="btn-del" onclick="App.confirmDelete(${p.id})">DEL</button>
          </div>
        </td>
      </tr>`).join('');
  }

  renderPendingQueue(submissions) {
    const container  = document.getElementById('pendingGrid');
    const emptyEl    = document.getElementById('pendingEmpty');
    const countBadge = document.getElementById('pendingCount');

    countBadge.textContent = submissions.length;

    if (!submissions.length) {
      container.innerHTML = '';
      emptyEl.classList.remove('d-none');
      return;
    }
    emptyEl.classList.add('d-none');

    container.innerHTML = submissions.map(s => `
      <div class="pending-card" id="pending-${s.id}">
        <img src="${s.image || ''}" alt="${s.name}"
          onerror="this.src='${Product.fallbackImage()}'"/>
        <div class="pending-info">
          <p class="pending-name">${s.name}</p>
          <p class="pending-meta">${s.category} · ${s.size} · ${s.condition} · ${ProductView._formatPrice(s.price)}</p>
          <p class="pending-seller">by ${s.seller || 'anonymous'}</p>
          <p class="pending-meta mt-1" style="font-style:italic">"${(s.description || '').substring(0, 80)}${s.description && s.description.length > 80 ? '…' : ''}"</p>
        </div>
        <div class="d-flex flex-column gap-2">
          <button class="btn-approve" onclick="App.approveSubmission(${s.id})">APPROVE</button>
          <button class="btn-reject"  onclick="App.rejectSubmission(${s.id})">REJECT</button>
        </div>
      </div>`).join('');
  }
}


/* ══════════════════════════════════════════════════════════════
   ░░  SECTION 4 — CONTROLLER (The App class)
       This is the brain. It wires everything together.
       Uses COMPOSITION — it HAS-A productRepo, cartRepo, etc.
   ══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   OOP CONCEPT: CLASS — AppController
   HAS-A (Composition):
     - productRepo   → ProductRepository instance
     - cartRepo      → CartRepository instance
     - submissionRepo→ SubmissionRepository instance
     - productView   → ProductView instance
     - cartView      → CartView instance
     - adminView     → AdminView instance
   This is composition: building complex behavior by combining
   smaller objects instead of using inheritance.
───────────────────────────────────────────────────────────── */
class AppController {
  constructor() {
    /* OOP: COMPOSITION — the App HAS-A of each of these */
    this.productRepo      = new ProductRepository();
    this.cartRepo         = new CartRepository();
    this.submissionRepo   = new SubmissionRepository();

    this.productView = new ProductView(
      document.getElementById('productGrid'),
      document.getElementById('emptyState'),
      document.getElementById('itemCount')
    );
    this.cartView  = new CartView(document.getElementById('cartContent'));
    this.adminView = new AdminView();

    /* Internal state (encapsulated) */
    this._currentView   = 'home';
    this._filter        = { category: 'All', search: '', sort: 'default' };
    this._deleteTarget  = null;
    this._currentTab    = 'pending';

    /* Bootstrap component instances */
    this._productModal = null;
    this._deleteModal  = null;
    this._toast        = null;
  }

  /* OOP: METHOD — called once on DOMContentLoaded */
  init() {
    this._productModal = new bootstrap.Modal(document.getElementById('productModal'));
    this._deleteModal  = new bootstrap.Modal(document.getElementById('deleteModal'));
    this._toast        = new bootstrap.Toast(document.getElementById('appToast'), { delay: 2600 });

    document.getElementById('confirmDeleteBtn')
      .addEventListener('click', () => this._doDelete());

    this.showView('home');
    this._updateCartBadge();
  }

  /* ── VIEW ROUTING ───────────────────────────────────────── */

  showView(view, id = null) {
    const VIEWS = ['home', 'detail', 'cart', 'admin', 'success', 'sell', 'submitted'];
    VIEWS.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.add('d-none');
    });

    document.getElementById('heroSection').style.display = view === 'home' ? '' : 'none';
    document.getElementById(`view-${view}`).classList.remove('d-none');
    this._currentView = view;

    /* OOP: calling methods on our view objects */
    if (view === 'home')   this._renderShop();
    if (view === 'detail') this._renderDetail(id);
    if (view === 'cart')   this.cartView.render(this.cartRepo.getItems(), this.productRepo);
    if (view === 'admin')  this._renderAdmin();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToShop() {
    document.getElementById('appContent').scrollIntoView({ behavior: 'smooth' });
  }

  /* ── SHOP ───────────────────────────────────────────────── */

  _renderShop() {
    let products = this.productRepo.getAll()
      .filter(p => p.status === 'approved'); // only approved items show publicly

    if (this._filter.category !== 'All') {
      products = products.filter(p => p.category === this._filter.category);
    }
    if (this._filter.search.trim()) {
      const q = this._filter.search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    /* OOP: using Product object property directly */
    if (this._filter.sort === 'price-asc')  products.sort((a, b) => a.price - b.price);
    if (this._filter.sort === 'price-desc') products.sort((a, b) => b.price - a.price);
    if (this._filter.sort === 'name-asc')   products.sort((a, b) => a.name.localeCompare(b.name));

    /* OOP: delegating rendering to the View object */
    this.productView.renderGrid(products);

    document.getElementById('shopHeading').textContent =
      this._filter.category === 'All' ? 'THE RACK' : this._filter.category.toUpperCase();
    document.getElementById('shopSubtitle').textContent =
      this._filter.search ? `Results for "${this._filter.search}"` : 'All approved pieces';
  }

  _renderDetail(id) {
    const product = this.productRepo.getById(id);
    if (!product) { this.showView('home'); return; }
    const inCart = this.cartRepo.getItems().find(i => i.productId === id);
    this.productView.renderDetail(product, inCart);
  }

  /* ── FILTERS ────────────────────────────────────────────── */

  filterCategory(cat) {
    this._filter.category = cat;
    this._filter.search   = '';
    document.getElementById('searchInput').value = '';
    this.showView('home');
  }

  search(query) {
    this._filter.search = query;
    if (this._currentView !== 'home') this.showView('home');
    else this._renderShop();
  }

  sort(val) {
    this._filter.sort = val;
    this._renderShop();
  }

  /* ── CART ───────────────────────────────────────────────── */

  addToCart(id) {
    /* OOP: getById returns a Product INSTANCE, so we can call product.isAvailable */
    const product = this.productRepo.getById(id);
    if (!product || !product.isAvailable) return;
    this.cartRepo.addItem(product);
    this._updateCartBadge();
    this._toast.show();
    document.getElementById('toastMsg').textContent = `"${product.name}" added to bag.`;
    if (this._currentView === 'detail') this._renderDetail(id);
  }

  removeFromCart(id) {
    this.cartRepo.removeItem(id);
    this._updateCartBadge();
    this.cartView.render(this.cartRepo.getItems(), this.productRepo);
  }

  updateCartQty(id, qty) {
    const product = this.productRepo.getById(id);
    if (!product) return;
    if (qty < 1) { this.removeFromCart(id); return; }
    if (qty > product.stock) {
      document.getElementById('toastMsg').textContent = 'Not enough stock.';
      this._toast.show();
      return;
    }
    this.cartRepo.updateQty(id, qty);
    this._updateCartBadge();
    this.cartView.render(this.cartRepo.getItems(), this.productRepo);
  }

  checkout() {
    this.cartRepo.getItems().forEach(item => {
      const product = this.productRepo.getById(item.productId);
      if (product) {
        /* OOP: calling a METHOD on the Product instance */
        for (let i = 0; i < item.qty; i++) product.decreaseStock();
        this.productRepo.save(product);
      }
    });
    this.cartRepo.clear();
    this._updateCartBadge();
    this.showView('success');
  }

  _updateCartBadge() {
    document.getElementById('cartCount').textContent = this.cartRepo.getCount();
  }

  /* ── SELLER SUBMISSION ──────────────────────────────────── */

  submitListing() {
    const errEl = document.getElementById('sellError');
    const name      = document.getElementById('s-name').value.trim();
    const category  = document.getElementById('s-category').value;
    const price     = parseFloat(document.getElementById('s-price').value);
    const size      = document.getElementById('s-size').value;
    const condition = document.getElementById('s-condition').value;
    const image     = document.getElementById('s-image').value.trim();
    const seller    = document.getElementById('s-seller').value.trim();
    const desc      = document.getElementById('s-desc').value.trim();

    if (!name || !category || isNaN(price) || !seller) {
      errEl.textContent = 'Please fill in Name, Category, Price, and Your Name.';
      errEl.classList.remove('d-none');
      return;
    }
    errEl.classList.add('d-none');

    /* OOP: submissionRepo.add() creates a plain object (not a Product yet).
       Only becomes a Product once admin approves it. */
    this.submissionRepo.add({ name, category, price, size, condition, image, seller, description: desc });
    this.showView('submitted');
  }

  /* ── ADMIN ──────────────────────────────────────────────── */

  _renderAdmin() {
    this.adminTab(this._currentTab);
  }

  adminTab(tab) {
    this._currentTab = tab;

    document.getElementById('tab-pending').classList.toggle('active', tab === 'pending');
    document.getElementById('tab-inventory').classList.toggle('active', tab === 'inventory');
    document.getElementById('admin-pending').classList.toggle('d-none',   tab !== 'pending');
    document.getElementById('admin-inventory').classList.toggle('d-none', tab !== 'inventory');

    if (tab === 'pending') {
      /* OOP: calling method on submissionRepo instance */
      this.adminView.renderPendingQueue(this.submissionRepo.getPending());
    }
    if (tab === 'inventory') {
      const all = this.productRepo.getAll();
      this.adminView.renderStats(all);
      this.adminView.renderTable(all);
    }
  }

  /* Admin approves a submission → creates a real Product */
  approveSubmission(id) {
    const sub = this.submissionRepo.updateStatus(id, 'approved');
    if (!sub) return;

    /* OOP: creating a proper Product instance from the submission data */
    this.productRepo.create({
      name: sub.name, category: sub.category, price: sub.price,
      size: sub.size, condition: sub.condition, image: sub.image,
      description: sub.description, status: 'approved',
      seller: sub.seller, stock: 1
    });

    this._toast.show();
    document.getElementById('toastMsg').textContent = `"${sub.name}" approved and live.`;
    this.adminTab('pending');
  }

  rejectSubmission(id) {
    const sub = this.submissionRepo.updateStatus(id, 'rejected');
    if (!sub) return;
    this._toast.show();
    document.getElementById('toastMsg').textContent = `"${sub.name}" rejected.`;
    this.adminTab('pending');
  }

  /* ── CRUD: ADD / EDIT ───────────────────────────────────── */

  openModal(id = null) {
    document.getElementById('formError').classList.add('d-none');

    if (id) {
      /* OOP: getById returns a Product INSTANCE */
      const p = this.productRepo.getById(id);
      if (!p) return;
      document.getElementById('modalTitle').textContent = 'EDIT PIECE';
      document.getElementById('editId').value    = p.id;
      document.getElementById('f-name').value    = p.name;
      document.getElementById('f-category').value = p.category;
      document.getElementById('f-price').value   = p.price;
      document.getElementById('f-size').value    = p.size;
      document.getElementById('f-stock').value   = p.stock;
      document.getElementById('f-condition').value = p.condition;
      document.getElementById('f-image').value   = p.image || '';
      document.getElementById('f-desc').value    = p.description || '';
    } else {
      document.getElementById('modalTitle').textContent = 'ADD PIECE';
      document.getElementById('editId').value = '';
      ['f-name','f-category','f-price','f-stock','f-image','f-desc']
        .forEach(id => { document.getElementById(id).value = ''; });
      document.getElementById('f-size').value      = 'One Size';
      document.getElementById('f-condition').value = 'Like New';
    }
    this._productModal.show();
  }

  saveProduct() {
    const errEl = document.getElementById('formError');
    const name      = document.getElementById('f-name').value.trim();
    const category  = document.getElementById('f-category').value;
    const price     = parseFloat(document.getElementById('f-price').value);
    const size      = document.getElementById('f-size').value;
    const stock     = parseInt(document.getElementById('f-stock').value);
    const condition = document.getElementById('f-condition').value;
    const image     = document.getElementById('f-image').value.trim();
    const desc      = document.getElementById('f-desc').value.trim();

    if (!name || !category || isNaN(price) || isNaN(stock)) {
      errEl.textContent = 'Name, Category, Price, and Stock are required.';
      errEl.classList.remove('d-none');
      return;
    }
    errEl.classList.add('d-none');

    const editId = document.getElementById('editId').value;

    if (editId) {
      /* OOP: getById returns a Product instance — we mutate it directly */
      const product = this.productRepo.getById(parseInt(editId));
      if (product) {
        product.name = name; product.category = category;
        product.price = price; product.size = size;
        product.stock = stock; product.condition = condition;
        product.image = image; product.description = desc;
        this.productRepo.save(product);
        this._toast.show();
        document.getElementById('toastMsg').textContent = 'Piece updated.';
      }
    } else {
      this.productRepo.create({ name, category, price, size, stock, condition, image, description: desc });
      this._toast.show();
      document.getElementById('toastMsg').textContent = 'New piece added.';
    }

    this._productModal.hide();
    this._renderAdmin();
  }

  /* ── CRUD: DELETE ───────────────────────────────────────── */

  confirmDelete(id) {
    this._deleteTarget = id;
    this._deleteModal.show();
  }

  _doDelete() {
    if (this._deleteTarget !== null) {
      this.productRepo.remove(this._deleteTarget);
      this.cartRepo.removeItem(this._deleteTarget);
      this._deleteTarget = null;
      this._deleteModal.hide();
      this._updateCartBadge();
      this._renderAdmin();
      document.getElementById('toastMsg').textContent = 'Piece deleted.';
      this._toast.show();
    }
  }

  /* ── DETAIL SHORTCUT ────────────────────────────────────── */
  showDetail(id) {
    this.showView('detail', id);
  }
}


/* ══════════════════════════════════════════════════════════════
   ░░  SECTION 5 — BOOTSTRAP THE APP
       We create ONE instance of AppController and expose it
       globally as `App` so HTML onclick handlers can reach it.
   ══════════════════════════════════════════════════════════════ */

/* OOP: INSTANTIATION — `new AppController()` triggers the constructor */
const App = new AppController();

/* Start everything once the DOM is ready */
document.addEventListener('DOMContentLoaded', () => App.init());
