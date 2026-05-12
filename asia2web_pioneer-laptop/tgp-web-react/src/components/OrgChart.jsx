// src/components/OrgChart.jsx

function OrgNode({ role, name, note, tier = '' }) {
  return (
    <div className={`org-node ${tier}`}>
      <div className="text-[10px] tracking-[1.5px] uppercase mb-1" style={{ color: 'var(--gold)' }}>{role}</div>
      <div className="font-cinzel text-white text-[13px] font-semibold leading-snug">{name}</div>
      {note && <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{note}</div>}
    </div>
  )
}

function LevelLabel({ children }) {
  return (
    <p className="text-[10px] tracking-[4px] uppercase text-center mt-2 mb-1" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}

export default function OrgChart() {
  return (
    <section id="orgchart" className="py-24 px-12" style={{ background: 'var(--dark)' }}>
      <div className="max-w-[1160px] mx-auto">
        <div className="text-center mb-16">
          <span className="section-label">Leadership</span>
          <h2 className="font-cinzel font-bold text-white" style={{ fontSize: 'clamp(28px,4vw,46px)' }}>
            Organizational Chart
          </h2>
          <div className="gold-line" />
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex flex-col items-center min-w-[700px]">

            <LevelLabel>Supreme Leadership</LevelLabel>
            <div className="flex justify-center gap-4 py-2">
              <OrgNode tier="tier-top" role="Grand Triskelion" name="Bro. Laureano Pontejos" note="Chapter President" />
            </div>

            <div className="org-connector" />
            <div className="org-h-line w-1/2" />

            <LevelLabel>Deputy Leadership</LevelLabel>
            <div className="flex justify-center gap-4 py-2">
              <OrgNode tier="tier-deputy" role="Deputy Grand Triskelion" name="Bro. Gibe Ibuna" />
            </div>

            <div className="org-connector" />
            <div className="org-h-line w-3/4" />

            <LevelLabel>Discipline &amp; Enforcement</LevelLabel>
            <div className="flex justify-center gap-4 py-2 flex-wrap">
              <OrgNode role="Master Wielder of the Whip – External" name="Bro. Mark Anthony Lama" />
              <OrgNode role="Master Wielder of the Whip – Internal" name="Bro. Jerome Misa" />
            </div>

            <div className="org-connector" />
            <div className="org-h-line w-4/5" />

            <LevelLabel>Master Officers</LevelLabel>
            <div className="flex justify-center gap-4 py-2 flex-wrap">
              <OrgNode role="Master Triskelion Chairman"  name="Bro. Errol Felipe" />
              <OrgNode role="Master Keeper of the Scroll" name="Bro. Ryven Castolero" />
              <OrgNode role="Master Keeper of the Chest"  name="Bro. Alvin Mallari" />
            </div>

            <div className="org-connector" />
            <div className="org-h-line w-4/5" />

            <LevelLabel>Master Triskelions</LevelLabel>
            <div className="flex justify-center gap-4 py-2 flex-wrap">
              {['JohnPaul Calera','Marl Mueca','John Paul Aquino','Dexter Ebero','Karl Kent Gipa','Jhun Refugia'].map(n => (
                <OrgNode key={n} role="Master Triskelion" name={`Bro. ${n}`} />
              ))}
            </div>

            <div className="org-connector" />

            <div className="flex justify-center py-2">
              <div className="org-node" style={{ minWidth: '300px', borderColor: 'var(--gold-dark)' }}>
                <div className="text-[10px] tracking-[1.5px] uppercase mb-1" style={{ color: 'var(--gold)' }}>General Brotherhood</div>
                <div className="font-cinzel text-white text-[13px] font-semibold">Active Brothers</div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>The Backbone of Asia 2 Community Chapter</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
