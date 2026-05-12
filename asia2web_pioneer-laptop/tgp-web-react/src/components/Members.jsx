// src/components/Members.jsx
import { useState } from 'react'
import { MEMBERS, getInitials, getMemberTier } from '../data/members'

const filters = [
  { key: 'all',        label: 'All Brothers' },
  { key: 'leadership', label: 'Grand Leadership' },
  { key: 'master',     label: 'Master Officers' },
  { key: 'brother',    label: 'Brothers' },
  { key: 'former',     label: 'Former Officers' },
]

export default function Members() {
  const [active, setActive] = useState('all')

  const filtered = active === 'all'
    ? MEMBERS
    : MEMBERS.filter(m => getMemberTier(m.role) === active)

  return (
    <section id="members" className="py-24 px-12" style={{ background: 'var(--dark2)' }}>
      <div className="max-w-[1160px] mx-auto">
        <div className="text-center mb-16">
          <span className="section-label">The Brotherhood</span>
          <h2 className="font-cinzel font-bold text-white" style={{ fontSize: 'clamp(28px,4vw,46px)' }}>
            Our Members
          </h2>
          <div className="gold-line" />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 justify-center flex-wrap mb-12">
          {filters.map(f => (
            <button key={f.key} onClick={() => setActive(f.key)}
              className="font-cinzel text-[11px] tracking-widest uppercase px-5 py-2 transition-all duration-300 cursor-pointer"
              style={{
                background:   active === f.key ? 'var(--gold)' : 'transparent',
                color:        active === f.key ? 'var(--dark)' : 'var(--text-muted)',
                border:       '1px solid var(--gold-dark)',
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))' }}>
          {filtered.map(m => (
            <div key={m.id} className="member-card">
              <div className="member-avatar">
                {m.photo
                  ? <img src={m.photo} alt={m.name} />
                  : getInitials(m.name)
                }
              </div>
              <div className="text-[10px] mb-1 tracking-[1px]" style={{ color: 'var(--text-muted)' }}>
                #{String(m.id).padStart(2, '0')}
              </div>
              <div className="font-cinzel text-white text-[12px] leading-snug mb-2">{m.name}</div>
              <div className="text-[10px] tracking-[1.5px] uppercase leading-snug" style={{ color: 'var(--gold)' }}>
                {m.role}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center mt-10 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Showing <span className="font-cinzel text-[18px]" style={{ color: 'var(--gold)' }}>{filtered.length}</span> brothers of Asia 2 Community Chapter
        </p>
      </div>
    </section>
  )
}
