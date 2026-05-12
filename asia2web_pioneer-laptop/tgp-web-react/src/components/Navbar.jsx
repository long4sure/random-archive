// src/components/Navbar.jsx
import { useState, useEffect } from 'react'
import logo from '../assets/asia2logo.png'

const links = [
  { href: '#hero',     label: 'Home' },
  { href: '#about',    label: 'About' },
  { href: '#history',  label: 'History' },
  { href: '#projects', label: 'Projects' },
  { href: '#orgchart', label: 'Leadership' },
  { href: '#members',  label: 'Members' },
  { href: '#contact',  label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [active, setActive]       = useState('hero')
  const [drawerOpen, setDrawer]   = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
      const sections = document.querySelectorAll('section[id]')
      sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 100) setActive(sec.id)
      })
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
        <div className="flex items-center justify-between h-[66px] px-10 max-w-[1400px] mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="TGP Logo" className="w-10 h-auto" />
            <div>
              <span className="font-cinzel text-gold text-base tracking-widest block">TAU GAMMA PHI</span>
              <span className="text-[10px] tracking-widest" style={{color:'var(--text-muted)'}}>Asia 2 Community Chapter</span>
            </div>
          </div>

          {/* Desktop Links */}
          <ul className="hidden md:flex gap-8 list-none">
            {links.map(l => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-[12px] tracking-widest uppercase transition-colors duration-300"
                  style={{ color: active === l.href.slice(1) ? 'var(--gold)' : 'var(--text-muted)',
                           borderBottom: active === l.href.slice(1) ? '1px solid var(--gold)' : '1px solid transparent',
                           paddingBottom: '4px' }}
                  onClick={() => setDrawer(false)}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col gap-[5px] p-2 cursor-pointer bg-transparent border-none"
            onClick={() => setDrawer(o => !o)}
            aria-label="Toggle menu"
          >
            <span className="block w-6 h-[1.5px] transition-all duration-300"
              style={{ background:'var(--gold)', transform: drawerOpen ? 'rotate(45deg) translate(4.5px,4.5px)' : '' }} />
            <span className="block w-6 h-[1.5px] transition-all duration-300"
              style={{ background:'var(--gold)', opacity: drawerOpen ? 0 : 1 }} />
            <span className="block w-6 h-[1.5px] transition-all duration-300"
              style={{ background:'var(--gold)', transform: drawerOpen ? 'rotate(-45deg) translate(4.5px,-4.5px)' : '' }} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed top-[66px] inset-x-0 bottom-0 z-[999] flex flex-col items-center justify-center gap-8"
          style={{ background: 'rgba(13,13,13,0.98)' }}>
          {links.map(l => (
            <a key={l.href} href={l.href}
              className="font-cinzel text-xl tracking-widest transition-colors duration-300"
              style={{ color: active === l.href.slice(1) ? 'var(--gold)' : 'var(--text-muted)' }}
              onClick={() => setDrawer(false)}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </>
  )
}
