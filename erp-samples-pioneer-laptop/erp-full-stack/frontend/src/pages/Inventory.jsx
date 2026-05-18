import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import Modal from '../components/Modal.jsx'

const CATS = ['Meat & Poultry','Vegetables','Dairy','Beverages','Dry Goods','Seafood','Other']
const UNITS = ['kg','g','L','ml','pcs','box','bottle','pack']

const blank = { name:'', category:'Meat & Poultry', stock:'', unit:'kg', min_stock:'', cost_per_unit:'' }

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(blank)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [err, setErr] = useState('')

  const load = () => { setLoading(true); api.get('/inventory').then(d => { setItems(d); setLoading(false); }) }
  useEffect(load, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const openAdd = () => { setForm(blank); setEditId(null); setErr(''); setModal(true); }
  const openEdit = item => { setForm({ ...item, stock: item.stock, min_stock: item.min_stock, cost_per_unit: item.cost_per_unit }); setEditId(item.id); setErr(''); setModal(true); }

  const save = async () => {
    if (!form.name) { setErr('Name is required'); return; }
    setSaving(true); setErr('')
    try {
      const payload = { ...form, stock: Number(form.stock)||0, min_stock: Number(form.min_stock)||0, cost_per_unit: Number(form.cost_per_unit)||0 }
      if (editId) await api.put(`/inventory/${editId}`, payload)
      else await api.post('/inventory', payload)
      setModal(false); load()
    } catch(e) { setErr(e.message) }
    setSaving(false)
  }

  const del = async id => {
    if (!confirm('Delete this item?')) return
    await api.del(`/inventory/${id}`); load()
  }

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.category||'').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26 }}>Inventory</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:2 }}>Products, ingredients, and supplies</p>
        </div>
        <button className="btn primary" onClick={openAdd}><i className="ti ti-plus" /> Add item</button>
      </div>

      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <i className="ti ti-search" style={{ color:'var(--hint)' }} aria-hidden="true" />
          <input placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:260, border:'none', padding:'6px 0', background:'transparent', outline:'none', fontSize:13 }} />
        </div>
        {loading ? <div className="empty"><span className="spinner" /></div>
        : filtered.length === 0 ? <div className="empty">No items found</div>
        : <table>
            <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Unit</th><th>Min stock</th><th>Cost/unit</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(item => {
                const low = Number(item.stock) <= Number(item.min_stock)
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight:500 }}>{item.name}</td>
                    <td><span className="badge gray">{item.category}</span></td>
                    <td style={{ color: low ? 'var(--accent)' : undefined, fontWeight: low ? 500 : undefined }}>{item.stock}</td>
                    <td style={{ color:'var(--muted)' }}>{item.unit}</td>
                    <td>{item.min_stock}</td>
                    <td>₱{Number(item.cost_per_unit).toLocaleString()}</td>
                    <td><span className={`badge ${low ? 'red':'green'}`}>{low ? 'Low stock':'OK'}</span></td>
                    <td style={{ display:'flex', gap:6 }}>
                      <button className="btn sm" onClick={() => openEdit(item)}><i className="ti ti-edit" /></button>
                      <button className="btn sm danger" onClick={() => del(item.id)}><i className="ti ti-trash" /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        }
      </div>

      {modal && (
        <Modal title={editId ? 'Edit item' : 'Add inventory item'} onClose={() => setModal(false)} onSave={save} loading={saving}>
          <div className="form-grid">
            <div className="form-group full"><label>Item name</label><input placeholder="e.g. Chicken breast" value={form.name} onChange={set('name')} /></div>
            <div className="form-group"><label>Category</label><select value={form.category} onChange={set('category')}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="form-group"><label>Unit</label><select value={form.unit} onChange={set('unit')}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></div>
            <div className="form-group"><label>Current stock</label><input type="number" min="0" placeholder="0" value={form.stock} onChange={set('stock')} /></div>
            <div className="form-group"><label>Minimum stock</label><input type="number" min="0" placeholder="0" value={form.min_stock} onChange={set('min_stock')} /></div>
            <div className="form-group full"><label>Cost per unit (₱)</label><input type="number" min="0" step="0.01" placeholder="0.00" value={form.cost_per_unit} onChange={set('cost_per_unit')} /></div>
          </div>
          {err && <div style={{ color:'var(--accent)', fontSize:12, marginTop:8 }}>{err}</div>}
        </Modal>
      )}
    </div>
  )
}
