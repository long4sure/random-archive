// src/components/Footer.jsx
import logo from '../assets/asia2logo.png'

const links = ['Home','About','History','Projects','Leadership','Members','Contact']
const ids   = ['hero','about','history','projects','orgchart','members','contact']

export default function Footer() {
  return (
    <footer className="py-14 px-12 text-center" style={{ background: 'var(--dark2)', borderTop: '1px solid var(--gold-dark)' }}>
      <img src={logo} alt="TGP Logo" className="w-14 h-auto mx-auto mb-5 opacity-70" />
      <div className="font-cinzel text-[24px] mb-1" style={{ color: 'var(--gold)' }}>TAU GAMMA PHI</div>
      <div className="text-[11px] tracking-[3px] mb-1" style={{ color: 'var(--text-muted)' }}>Triskelion Grand Fraternity</div>
      <div className="text-[11px] tracking-[3px] mb-8" style={{ color: 'var(--gold-dark)' }}>Asia 2 Community Chapter</div>

      <nav className="flex gap-7 justify-center flex-wrap mb-8">
        {links.map((l, i) => (
          <a key={l} href={`#${ids[i]}`}
            className="text-[12px] tracking-[1.5px] uppercase transition-colors duration-300 hover:text-gold"
            style={{ color: 'var(--text-muted)' }}>
            {l}
          </a>
        ))}
      </nav>

      <p className="text-[12px] italic mb-5" style={{ color: 'var(--gold-dark)' }}>
        "Fortis Voluntas Fraternitas" · "Once a Triskelion, Always a Triskelion"
      </p>
      <p className="text-[11px]" style={{ color: '#2a2a2a' }}>
        © 2025 Tau Gamma Phi – Triskelion Grand Fraternity, Asia 2 Community Chapter. All rights reserved.
      </p>
    </footer>
  )
}
