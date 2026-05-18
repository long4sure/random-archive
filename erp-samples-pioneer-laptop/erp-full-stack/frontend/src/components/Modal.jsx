export default function Modal({ title, onClose, onSave, saveLabel = 'Save', loading, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card fade-in" style={{ width: 500, maxWidth: '100%', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 500 }}>{title}</h2>
          <button className="btn sm ghost" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        {children}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={onSave} disabled={loading}>
            {loading ? <span className="spinner" /> : null} {saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
