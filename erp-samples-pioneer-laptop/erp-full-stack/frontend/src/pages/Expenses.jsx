import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import Modal from '../components/Modal.jsx'

const CATS = ['Ingredients','Utilities','Rent','Salaries','Equipment','Marketing','Other']
const blank = { description:'', date: new Date().toISOString().slice(0,10), amount:'', category:'Ingredients', supplier:'', status:'Paid' }
const statusColor = { Paid:'green', Pending:'amber', Overdue:'red' }
const peso = n => '₱' + Number(n).toLocaleString('en-PH')

export default function Expenses() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(blank)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [err, setErr] = useState('')

  const load = () => { setLoading(true); api.get('/expenses').then(d => { setItems(d); setLoading(false); }) }
  useEffect(load, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const openAdd = () => { setForm(blank); setEditId(null); setErr(''); setModal(true); }
  const openEdit = item => { setForm({ ...item, amount: item.amount }); setEditId(item.id); setErr(''); setModal(true); }

  const save = async () => {
    if (!form.description || !form.amount) { setErr('Description and amount required'); return; }
    setSaving(true); setErr('')
    try {
      const payload = { ...form, amount: Number(form.amount) }
      if (editId) await api.put(`/expenses/${editId}`, payload)
      else await api.post('/expenses', payload)
      setModal(false); load()
    } catch(e) { setErr(e.message) }
    setSaving(false)
  }

  const del = async id => { if (!confirm('Delete?')) return; await api.del(`/expenses/${id}`); load() }

  const filtered = items.filter(i =>
    i.description.toLowerCase().includes(search.toLowerCase()) ||
    (i.category||'').toLowerCase().includes(search.toLowerCase()) ||
    (i.supplier||'').toLowerCase().includes(search.toLowerCase())
  )
  const total = filtered.reduce((s, i) => s + Number(i.amount), 0)

  return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26 }}>Expenses</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:2 }}>Purchases, bills, and operating costs</p>
        </div>
        <button className="btn primary" onClick={openAdd}><i className="ti ti-plus" /> Add expense</button>
      </div>

      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <i className="ti ti-search" style={{ color:'var(--hint)' }} aria-hidden="true" />
            <input placeholder="Search expenses…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:260, border:'none', padding:'6px 0', background:'transparent', outline:'none', fontSize:13 }} />
          </div>
          {filtered.length > 0 && <div style={{ fontSize:13, color:'var(--muted)' }}>Total: <strong style={{ color:'var(--text)' }}>{peso(total)}</strong></div>}
        </div>
        {loading ? <div className="empty"><span className="spinner" /></div>
        : filtered.length === 0 ? <div className="empty">No expenses found</div>
        : <table>
            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Supplier</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td style={{ color:'var(--muted)' }}>{item.date}</td>
                  <td style={{ fontWeight:500 }}>{item.description}</td>
                  <td><span className="badge blue">{item.category}</span></td>
                  <td style={{ color:'var(--muted)' }}>{item.supplier || '—'}</td>
                  <td style={{ fontWeight:500 }}>{peso(item.amount)}</td>
                  <td><span className={`badge ${statusColor[item.status]||'gray'}`}>{item.status}</span></td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button className="btn sm" onClick={() => openEdit(item)}><i className="ti ti-edit" /></button>
                    <button className="btn sm danger" onClick={() => del(item.id)}><i className="ti ti-trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>

      {modal && (
        <Modal title={editId ? 'Edit expense' : 'Add expense'} onClose={() => setModal(false)} onSave={save} loading={saving}>
          <div className="form-grid">
            <div className="form-group full"><label>Description</label><input placeholder="e.g. Weekly vegetable delivery" value={form.description} onChange={set('description')} /></div>
            <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={set('date')} /></div>
            <div className="form-group"><label>Amount (₱)</label><input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={set('amount')} /></div>
            <div className="form-group"><label>Category</label><select value={form.category} onChange={set('category')}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="form-group"><label>Supplier / Payee</label><input placeholder="Supplier name" value={form.supplier} onChange={set('supplier')} /></div>
            <div className="form-group"><label>Status</label><select value={form.status} onChange={set('status')}><option>Paid</option><option>Pending</option><option>Overdue</option></select></div>
          </div>
          {err && <div style={{ color:'var(--accent)', fontSize:12, marginTop:8 }}>{err}</div>}
        </Modal>
      )}
    </div>
  )
}
