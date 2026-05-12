// src/components/About.jsx

const stats = [
  { num: '2008', label: 'Est. Asia 2 Chapter' },
  { num: '52',   label: 'Active Brothers' },
  { num: '2',    label: 'Monthly Projects' },
  { num: '∞',    label: 'Once a Triskelion' },
]

export default function About() {
  return (
    <section id="about" className="py-24 px-12" style={{ background: 'var(--dark2)' }}>
      <div className="max-w-[1160px] mx-auto">
        <div className="text-center mb-16">
          <span className="section-label">Who We Are</span>
          <h2 className="font-cinzel font-bold text-white" style={{ fontSize: 'clamp(28px,4vw,46px)' }}>
            About the Fraternity
          </h2>
          <div className="gold-line" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="space-y-5 text-[16px] leading-[1.95]" style={{ color: 'var(--text-muted)' }}>
            <p>
              Tau Gamma Phi – Triskelion Grand Fraternity is one of the most respected and influential fraternities in the Philippines.
              Our <strong style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Asia 2 Community Chapter</strong> carries forward the same founding values of brotherhood, loyalty, and genuine service to our community.
            </p>
            <p>
              Our fraternity is built on three pillars represented by the Triskelion symbol:{' '}
              <strong style={{ color: 'var(--gold)' }}>Academic Excellence</strong>,{' '}
              <strong style={{ color: 'var(--gold)' }}>Community Service</strong>, and{' '}
              <strong style={{ color: 'var(--gold)' }}>Brotherhood</strong>.
            </p>
            <p>
              Locally, our Asia 2 chapter is dedicated to uplifting the community through meaningful programs, including our monthly{' '}
              <strong style={{ color: 'var(--gold)' }}>Community Clean-Up Drive</strong> and{' '}
              <strong style={{ color: 'var(--gold)' }}>Libreng Almusal</strong> — tangible proof that true brotherhood extends beyond our own ranks.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map(s => (
              <div key={s.label} className="stat-card">
                <div className="font-cinzel font-bold text-[42px]" style={{ color: 'var(--gold)' }}>{s.num}</div>
                <div className="text-[11px] tracking-[2px] uppercase mt-2" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
