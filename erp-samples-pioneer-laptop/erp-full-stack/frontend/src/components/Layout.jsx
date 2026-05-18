import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

const navItems = [
  { to: '/dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { to: '/inventory',  icon: 'ti-box',               label: 'Inventory' },
  { to: '/expenses',   icon: 'ti-receipt',            label: 'Expenses' },
  { to: '/contacts',   icon: 'ti-users',              label: 'Contacts' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login'); }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: '#1A1814', color: '#fff',
        display: 'flex', flexDirection: 'column',
        padding: '0 0 20px', position: 'sticky', top: 0, height: '100vh'
      }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: '#fff', letterSpacing: '-.02em' }}>
            BizlERP
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>Restaurant</div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              fontSize: 13, fontWeight: 500, color: isActive ? '#fff' : 'rgba(255,255,255,.5)',
              background: isActive ? 'rgba(255,255,255,.1)' : 'transparent',
              transition: 'all .15s',
            })}>
              <i className={`ti ${icon}`} style={{ fontSize: 17 }} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(200,75,47,.6)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0,
            }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn sm ghost" style={{ width: '100%', justifyContent: 'center', color: 'rgba(255,255,255,.5)', marginTop: 4 }}>
            <i className="ti ti-logout" aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowX: 'hidden', padding: '28px 32px', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}
