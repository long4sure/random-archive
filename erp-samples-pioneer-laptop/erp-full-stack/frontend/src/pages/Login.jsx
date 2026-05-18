import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, letterSpacing: '-.02em', color: 'var(--text)' }}>
            BizlERP
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Restaurant management, simplified.</div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 24 }}>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
          <form onSubmit={submit}>
            {mode === 'register' && (
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Full name</label>
                <input placeholder="Juan dela Cruz" value={form.name} onChange={set('name')} required />
              </div>
            )}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
            </div>
            {error && <div style={{ background: '#fdf3f1', color: 'var(--accent)', border: '1px solid #f5cdc5', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
            <button type="submit" className="btn primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 16px' }} disabled={loading}>
              {loading ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : null}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button className="btn ghost sm" style={{ padding: '2px 6px', color: 'var(--accent)' }}
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
