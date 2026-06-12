/* Business Suite — vanilla JS + Supabase (OTP via Resend SMTP in Supabase) */

const U = window.Utils
const I = window.ICONS
const Auth = window.Auth

function configBanner() {
  if (window.isConfigValid()) return ''
  return `
    <div class="config-banner">
      ${I.alert}
      <span>Edit <code>js/config.js</code> with your Supabase URL and anon key, then push again.</span>
    </div>`
}

function header(showUser) {
  const p = Auth.profile
  const adminLink =
    showUser && Auth.isAdmin()
      ? `<a href="#/admin" class="btn btn-secondary">${I.shield} Admin</a>`
      : ''
  return `
    ${configBanner()}
    <header class="site-header">
      <div class="container inner">
        <a href="#/" class="logo">${I.logo} Business Suite</a>
        ${
          showUser && p
            ? `<div class="header-actions">
                <span class="text-muted">${U.escapeHtml(p.full_name || p.email)}</span>
                ${adminLink}
                <button type="button" class="btn btn-secondary" id="btn-logout">Sign out</button>
              </div>`
            : ''
        }
      </div>
    </header>`
}

function bindLogout() {
  const btn = document.getElementById('btn-logout')
  if (btn) {
    btn.onclick = async () => {
      await Auth.signOut()
      location.hash = '#/'
    }
  }
}

// --- Pages ---

function renderHome() {
  document.getElementById('app').innerHTML = `
    ${header(false)}
    <section class="hero">
      <div class="container">
        <div class="badge">${I.sparkles} ERP · POS · CRM</div>
        <h1>Choose your system</h1>
        <p>Select ERP, POS, or CRM. Sign in or register with email OTP (sent via Resend).</p>
      </div>
    </section>
    <div class="container cards">
      <button type="button" class="card" data-system="erp">
        <div class="icon-wrap violet">${I.boxes}</div>
        <h2>ERP</h2>
        <p>Inventory, products, and supply chain.</p>
        <span class="link-text">Continue ${I.chevron}</span>
      </button>
      <button type="button" class="card" data-system="pos">
        <div class="icon-wrap emerald">${I.cart}</div>
        <h2>POS</h2>
        <p>Point of sale and daily sales.</p>
        <span class="link-text">Continue ${I.chevron}</span>
      </button>
      <button type="button" class="card" data-system="crm">
        <div class="icon-wrap amber">${I.users}</div>
        <h2>CRM</h2>
        <p>Contacts, leads, and customers.</p>
        <span class="link-text">Continue ${I.chevron}</span>
      </button>
    </div>`
  document.querySelectorAll('[data-system]').forEach((btn) => {
    btn.onclick = () => {
      U.setSystem(btn.dataset.system)
      location.hash = Auth.isLoggedIn() ? `#/${btn.dataset.system}` : '#/login'
    }
  })
}

function renderLogin() {
  const sys = U.getSystem()
  document.getElementById('app').innerHTML = `
    ${header(false)}
    <div class="page-center">
      <div class="form-card">
        <a href="#/" class="back-link">${I.arrowLeft} Back</a>
        <h1>Sign in</h1>
        <p class="subtitle">${sys ? `Access ${sys.toUpperCase()}` : 'We email you a one-time code'}</p>
        <div id="err" class="alert alert-error hidden"></div>
        <form id="login-form">
          <label for="email">Email</label>
          <input id="email" type="email" required placeholder="you@company.com" />
          <button type="submit" class="btn btn-primary" ${!window.isConfigValid() ? 'disabled' : ''}>
            ${I.logIn} Send verification code
          </button>
        </form>
        <p class="text-center text-muted mt-1">No account? <a href="#/register">Register</a></p>
      </div>
    </div>`
  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault()
    U.hideError('err')
    const email = document.getElementById('email').value.trim()
    try {
      await Auth.sendOtp(email, false)
      sessionStorage.setItem('otp_email', email)
      sessionStorage.setItem('otp_mode', 'login')
      location.hash = '#/verify'
    } catch (err) {
      U.showError('err', err.message || 'Failed to send code')
    }
  }
}

function renderRegister() {
  const sys = U.getSystem()
  document.getElementById('app').innerHTML = `
    ${header(false)}
    <div class="page-center">
      <div class="form-card">
        <a href="#/" class="back-link">${I.arrowLeft} Back</a>
        <h1>Create account</h1>
        <p class="subtitle">${sys ? `Register for ${sys.toUpperCase()}` : 'Verify email with OTP'}</p>
        <div id="err" class="alert alert-error hidden"></div>
        <form id="reg-form">
          <label for="name">Full name</label>
          <input id="name" type="text" required />
          <label for="email">Email</label>
          <input id="email" type="email" required />
          <button type="submit" class="btn btn-primary" ${!window.isConfigValid() ? 'disabled' : ''}>
            Send verification code
          </button>
        </form>
        <p class="text-center text-muted mt-1"><a href="#/login">Sign in</a></p>
      </div>
    </div>`
  document.getElementById('reg-form').onsubmit = async (e) => {
    e.preventDefault()
    U.hideError('err')
    const name = document.getElementById('name').value.trim()
    const email = document.getElementById('email').value.trim()
    try {
      sessionStorage.setItem('pending_full_name', name)
      await Auth.sendOtp(email, true)
      sessionStorage.setItem('otp_email', email)
      sessionStorage.setItem('otp_mode', 'register')
      location.hash = '#/verify'
    } catch (err) {
      U.showError('err', err.message || 'Failed to send code')
    }
  }
}

function renderVerify() {
  const email = sessionStorage.getItem('otp_email') || ''
  document.getElementById('app').innerHTML = `
    ${header(false)}
    <div class="page-center">
      <div class="form-card">
        <h1>Verify email</h1>
        <p class="subtitle">Code sent to <strong>${U.escapeHtml(email)}</strong></p>
        <div id="err" class="alert alert-error hidden"></div>
        <form id="verify-form">
          <label for="code">6-digit code</label>
          <input id="code" type="text" inputmode="numeric" maxlength="8" required placeholder="000000" class="code-input" />
          <button type="submit" class="btn btn-primary">${I.key} Verify</button>
        </form>
        <button type="button" class="btn-link mt-1" id="resend">Resend code</button>
      </div>
    </div>`
  if (!email) {
    location.hash = '#/login'
    return
  }
  document.getElementById('verify-form').onsubmit = async (e) => {
    e.preventDefault()
    U.hideError('err')
    const code = document.getElementById('code').value.replace(/\D/g, '')
    try {
      await Auth.verifyOtp(email, code)
      if (sessionStorage.getItem('otp_mode') === 'register') {
        const name = sessionStorage.getItem('pending_full_name') || ''
        await Auth.updateProfileName(name, email)
        sessionStorage.removeItem('pending_full_name')
      }
      sessionStorage.removeItem('otp_email')
      sessionStorage.removeItem('otp_mode')
      const sys = U.getSystem()
      location.hash = sys ? `#/${sys}` : '#/'
    } catch (err) {
      U.showError('err', err.message || 'Invalid code')
    }
  }
  document.getElementById('resend').onclick = async () => {
    try {
      await Auth.sendOtp(email, sessionStorage.getItem('otp_mode') === 'register')
    } catch (err) {
      U.showError('err', err.message)
    }
  }
}

async function renderAuthCallback() {
  document.getElementById('app').innerHTML = `
    <div class="page-center"><p class="text-muted">Signing you in…</p></div>`
  await Auth.init()
  const sys = U.getSystem()
  location.hash = sys ? `#/${sys}` : '#/'
}

async function requireAuth() {
  if (!Auth.isLoggedIn()) {
    location.hash = '#/login'
    return false
  }
  return true
}

async function renderErp() {
  if (!(await requireAuth())) return
  if (U.getSystem() !== 'erp') {
    location.hash = '#/'
    return
  }
  document.getElementById('app').innerHTML = `
    ${header(true)}
    <main class="container page-main">
      <h1>${I.boxes} ERP — Inventory</h1>
      <p class="text-muted mb-2">Your products (stored in Supabase, private to you).</p>
      <div id="err" class="alert alert-error hidden"></div>
      <form id="erp-form" class="form-card form-grid">
        <div><label>Name</label><input name="name" required /></div>
        <div><label>SKU</label><input name="sku" required /></div>
        <div><label>Qty</label><input name="qty" type="number" min="0" value="0" required /></div>
        <div><label>Unit price</label><input name="price" type="number" min="0" step="0.01" required /></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">Add product</button></div>
      </form>
      <div class="table-wrap"><table><thead><tr><th>Name</th><th>SKU</th><th>Qty</th><th>Price</th><th></th></tr></thead><tbody id="erp-rows"></tbody></table></div>
    </main>`
  bindLogout()
  await loadErp()
  document.getElementById('erp-form').onsubmit = async (e) => {
    e.preventDefault()
    const f = e.target
    const uid = Auth.session.user.id
    const { error } = await window.supabase.from('erp_products').insert({
      user_id: uid,
      name: f.name.value.trim(),
      sku: f.sku.value.trim(),
      quantity: +f.qty.value,
      unit_price: +f.price.value,
    })
    if (error) U.showError('err', error.message)
    else {
      f.reset()
      await loadErp()
    }
  }
}

async function loadErp() {
  const { data, error } = await window.supabase
    .from('erp_products')
    .select('*')
    .order('created_at', { ascending: false })
  const tbody = document.getElementById('erp-rows')
  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">${U.escapeHtml(error.message)}</td></tr>`
    return
  }
  if (!data?.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">No products yet.</td></tr>'
    return
  }
  tbody.innerHTML = data
    .map(
      (r) => `
    <tr>
      <td>${U.escapeHtml(r.name)}</td>
      <td>${U.escapeHtml(r.sku)}</td>
      <td>${r.quantity}</td>
      <td>$${Number(r.unit_price).toFixed(2)}</td>
      <td><button type="button" class="btn btn-secondary btn-sm" data-id="${r.id}">Delete</button></td>
    </tr>`
    )
    .join('')
  tbody.querySelectorAll('[data-id]').forEach((btn) => {
    btn.onclick = async () => {
      await window.supabase.from('erp_products').delete().eq('id', btn.dataset.id)
      await loadErp()
    }
  })
}

async function renderPos() {
  if (!(await requireAuth())) return
  if (U.getSystem() !== 'pos') {
    location.hash = '#/'
    return
  }
  document.getElementById('app').innerHTML = `
    ${header(true)}
    <main class="container page-main">
      <h1>${I.cart} POS — Sales</h1>
      <p id="pos-total" class="stat-pill"></p>
      <div id="err" class="alert alert-error hidden"></div>
      <form id="pos-form" class="form-card form-grid">
        <div><label>Item</label><input name="item" required /></div>
        <div><label>Qty</label><input name="qty" type="number" min="1" value="1" required /></div>
        <div><label>Total ($)</label><input name="total" type="number" min="0" step="0.01" required /></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">Record sale</button></div>
      </form>
      <div class="table-wrap"><table><thead><tr><th>Item</th><th>Qty</th><th>Total</th><th></th></tr></thead><tbody id="pos-rows"></tbody></table></div>
    </main>`
  bindLogout()
  await loadPos()
  document.getElementById('pos-form').onsubmit = async (e) => {
    e.preventDefault()
    const f = e.target
    const { error } = await window.supabase.from('pos_sales').insert({
      user_id: Auth.session.user.id,
      item_name: f.item.value.trim(),
      quantity: +f.qty.value,
      total: +f.total.value,
    })
    if (error) U.showError('err', error.message)
    else {
      f.reset()
      f.qty.value = 1
      await loadPos()
    }
  }
}

async function loadPos() {
  const { data, error } = await window.supabase
    .from('pos_sales')
    .select('*')
    .order('created_at', { ascending: false })
  const sum = (data || []).reduce((s, r) => s + Number(r.total), 0)
  document.getElementById('pos-total').textContent = `Total sales: $${sum.toFixed(2)}`
  const tbody = document.getElementById('pos-rows')
  if (error || !data?.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">${error ? U.escapeHtml(error.message) : 'No sales yet.'}</td></tr>`
    return
  }
  tbody.innerHTML = data
    .map(
      (r) => `
    <tr>
      <td>${U.escapeHtml(r.item_name)}</td>
      <td>${r.quantity}</td>
      <td class="text-emerald">$${Number(r.total).toFixed(2)}</td>
      <td><button type="button" class="btn btn-secondary btn-sm" data-id="${r.id}">Delete</button></td>
    </tr>`
    )
    .join('')
  tbody.querySelectorAll('[data-id]').forEach((btn) => {
    btn.onclick = async () => {
      await window.supabase.from('pos_sales').delete().eq('id', btn.dataset.id)
      await loadPos()
    }
  })
}

async function renderCrm() {
  if (!(await requireAuth())) return
  if (U.getSystem() !== 'crm') {
    location.hash = '#/'
    return
  }
  document.getElementById('app').innerHTML = `
    ${header(true)}
    <main class="container page-main">
      <h1>${I.users} CRM — Contacts</h1>
      <div id="err" class="alert alert-error hidden"></div>
      <form id="crm-form" class="form-card form-grid">
        <div><label>Name</label><input name="name" required /></div>
        <div><label>Email</label><input name="email" type="email" /></div>
        <div><label>Company</label><input name="company" /></div>
        <div><label>Status</label><select name="status"><option>lead</option><option>qualified</option><option>customer</option></select></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">Add contact</button></div>
      </form>
      <div id="crm-list" class="cards cards-inner"></div>
    </main>`
  bindLogout()
  await loadCrm()
  document.getElementById('crm-form').onsubmit = async (e) => {
    e.preventDefault()
    const f = e.target
    const { error } = await window.supabase.from('crm_contacts').insert({
      user_id: Auth.session.user.id,
      name: f.name.value.trim(),
      email: f.email.value.trim() || null,
      company: f.company.value.trim() || null,
      status: f.status.value,
    })
    if (error) U.showError('err', error.message)
    else {
      f.reset()
      await loadCrm()
    }
  }
}

async function loadCrm() {
  const { data, error } = await window.supabase
    .from('crm_contacts')
    .select('*')
    .order('created_at', { ascending: false })
  const wrap = document.getElementById('crm-list')
  if (error || !data?.length) {
    wrap.innerHTML = `<p class="empty">${error ? U.escapeHtml(error.message) : 'No contacts yet.'}</p>`
    return
  }
  wrap.innerHTML = data
    .map(
      (r) => `
    <div class="card card-static">
      <h2>${U.escapeHtml(r.name)}</h2>
      ${r.company ? `<p class="text-muted">${U.escapeHtml(r.company)}</p>` : ''}
      ${r.email ? `<p class="text-muted">${U.escapeHtml(r.email)}</p>` : ''}
      <span class="status-badge">${U.escapeHtml(r.status)}</span>
      <button type="button" class="btn btn-secondary btn-sm mt-1" data-id="${r.id}">Delete</button>
    </div>`
    )
    .join('')
  wrap.querySelectorAll('[data-id]').forEach((btn) => {
    btn.onclick = async () => {
      await window.supabase.from('crm_contacts').delete().eq('id', btn.dataset.id)
      await loadCrm()
    }
  })
}

async function renderAdmin() {
  if (!(await requireAuth())) return
  if (!Auth.isAdmin()) {
    location.hash = '#/'
    return
  }
  document.getElementById('app').innerHTML = `
    ${header(true)}
    <main class="container page-main">
      <h1>${I.shield} Admin</h1>
      <p class="text-muted mb-2">Monitor users and totals (read-only aggregates).</p>
      <div id="admin-stats" class="cards cards-stats"></div>
      <div class="form-card">
        <h2>All users</h2>
        <div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody id="admin-users"></tbody></table></div>
      </div>
    </main>`
  bindLogout()
  const [profiles, erp, pos, crm] = await Promise.all([
    window.supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    window.supabase.from('erp_products').select('id', { count: 'exact', head: true }),
    window.supabase.from('pos_sales').select('id', { count: 'exact', head: true }),
    window.supabase.from('crm_contacts').select('id', { count: 'exact', head: true }),
  ])
  document.getElementById('admin-stats').innerHTML = `
    <div class="card card-static"><p class="stat-num">${profiles.data?.length ?? 0}</p><p class="text-muted">Users</p></div>
    <div class="card card-static"><p class="stat-num">${erp.count ?? 0}</p><p class="text-muted">ERP products</p></div>
    <div class="card card-static"><p class="stat-num">${pos.count ?? 0}</p><p class="text-muted">POS sales</p></div>
    <div class="card card-static"><p class="stat-num">${crm.count ?? 0}</p><p class="text-muted">CRM contacts</p></div>`
  const tbody = document.getElementById('admin-users')
  tbody.innerHTML = (profiles.data || [])
    .map(
      (u) => `
    <tr>
      <td>${U.escapeHtml(u.full_name || '—')}</td>
      <td>${U.escapeHtml(u.email)}</td>
      <td><span class="role-badge ${u.role}">${u.role}</span></td>
      <td>${new Date(u.created_at).toLocaleDateString()}</td>
    </tr>`
    )
    .join('')
}

// --- Router ---

const routes = {
  '/': renderHome,
  '/login': renderLogin,
  '/register': renderRegister,
  '/verify': renderVerify,
  '/auth/callback': renderAuthCallback,
  '/erp': renderErp,
  '/pos': renderPos,
  '/crm': renderCrm,
  '/admin': renderAdmin,
}

async function route() {
  const path = (location.hash.slice(1) || '/').split('?')[0]
  const fn = routes[path] || renderHome
  await fn()
}

async function boot() {
  document.getElementById('app').innerHTML = '<div class="page-center"><p class="text-muted">Loading…</p></div>'
  if (window.supabase) await Auth.init()
  window.onAuthChange = () => route()
  await route()
}

window.addEventListener('hashchange', () => route())
boot()
