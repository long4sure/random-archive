import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import Modal from '../components/Modal.jsx'

const blank = { name:'', type:'Supplier', category:'', email:'', phone:'', notes:'' }

export default function Contacts() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(blank)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [err, setErr] = useState('')

  const load = () => { setLoading(true); api.get('/contacts').then(d => { setItems(d); setLoading(false); }) }
  useEffect(load, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const openAdd = () => { setForm(blank); setEditId(null); setErr(''); setModal(true); }
  const openEdit = item => { setForm(item); setEditId(item.id); setErr(''); setModal(true); }

  const save = async () => {
    if (!form.name) { setErr('Name is required'); return; }
    setSaving(true); setErr('')
    try {
      if (editId) await api.put(`/contacts/${editId}`, form)
      else await api.post('/contacts', form)
      setModal(false); load()
    } catch(e) { setErr(e.message) }
    setSaving(false)
  }

  const del = async id => { if (!confirm('Delete?')) return; await api.del(`/contacts/${id}`); load() }

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.type||'').toLowerCase().includes(search.toLowerCase()) ||
    (i.category||'').toLowerCase().includes(search.toLowerCase())
  )

  const initials = name => name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()

  return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26 }}>Contacts</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:2 }}>Suppliers and customers</p>
        </div>
        <button className="btn primary" onClick={openAdd}><i className="ti ti-plus" /> Add contact</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:20 }}>
        {[['Total',items.length],['Suppliers',items.filter(i=>i.type==='Supplier').length],['Customers',items.filter(i=>i.type==='Customer').length]].map(([l,v])=>(
          <div key={l} className="card" style={{ padding:'12px 16px' }}>
            <div style={{ fontSize:11, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:22, fontWeight:500 }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <i className="ti ti-search" style={{ color:'var(--hint)' }} aria-hidden="true" />
          <input placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:260, border:'none', padding:'6px 0', background:'transparent', outline:'none', fontSize:13 }} />
        </div>
        {loading ? <div className="empty"><span className="spinner" /></div>
        : filtered.length === 0 ? <div className="empty">No contacts found</div>
        : <table>
            <thead><tr><th>Name</th><th>Type</th><th>Category</th><th>Email</th><th>Phone</th><th></th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:'#eef3fc', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'var(--info)', flexShrink:0 }}>
                        {initials(item.name)}
                      </div>
                      <span style={{ fontWeight:500 }}>{item.name}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${item.type==='Supplier'?'amber':'blue'}`}>{item.type}</span></td>
                  <td style={{ color:'var(--muted)' }}>{item.category||'—'}</td>
                  <td style={{ color:'var(--info)' }}>{item.email||'—'}</td>
                  <td>{item.phone||'—'}</td>
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
        <Modal title={editId ? 'Edit contact' : 'Add contact'} onClose={() => setModal(false)} onSave={save} loading={saving}>
          <div className="form-grid">
            <div className="form-group full"><label>Full name / Business name</label><input placeholder="e.g. Metro Meat Supply" value={form.name} onChange={set('name')} /></div>
            <div className="form-group"><label>Type</label><select value={form.type} onChange={set('type')}><option>Supplier</option><option>Customer</option></select></div>
            <div className="form-group"><label>Category</label><input placeholder="e.g. Meat supplier, VIP customer" value={form.category} onChange={set('category')} /></div>
            <div className="form-group"><label>Email</label><input type="email" placeholder="email@example.com" value={form.email} onChange={set('email')} /></div>
            <div className="form-group"><label>Phone</label><input placeholder="+63 9xx xxx xxxx" value={form.phone} onChange={set('phone')} /></div>
            <div className="form-group full"><label>Notes</label><input placeholder="Any notes…" value={form.notes} onChange={set('notes')} /></div>
          </div>
          {err && <div style={{ color:'var(--accent)', fontSize:12, marginTop:8 }}>{err}</div>}
        </Modal>
      )}
    </div>
  )
}
