// src/components/Hero.jsx
import { useState, useEffect } from 'react'
import logo from '../assets/asia2logo.png'
import hero1 from '../assets/hero1.jpg'
import hero2 from '../assets/hero2.jpg'
import hero3 from '../assets/hero3.jpg'
import hero4 from '../assets/hero4.jpg'

const slides = [hero1, hero2, hero3, hero4]

export default function Hero() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden" style={{padding:'120px 48px 80px'}}>

      {/* Background Slides */}
      <div className="absolute inset-0 z-0">
        {slides.map((src, i) => (
          <div key={i} className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms]"
            style={{ backgroundImage: `url(${src})`, opacity: i === current ? 1 : 0 }} />
        ))}
        {/* Overlay */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(13,13,13,0.55) 50%, rgba(13,13,13,0.85) 100%)'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <img src={logo} alt="TGP Asia 2 Logo" className="animate-logo-pulse mb-7"
          style={{ width: '150px', height: 'auto', filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.7))' }} />

        <p className="section-label">Triskelion Grand Fraternity · Asia 2 Community Chapter</p>

        <h1 className="font-cinzel font-black text-white leading-tight"
          style={{ fontSize: 'clamp(38px, 8vw, 88px)' }}>
          TAU GAMMA <span className="text-gold">PHI</span>
        </h1>

        <p className="font-cinzel mt-3 tracking-[5px]" style={{ fontSize: 'clamp(13px,2vw,18px)', color:'var(--gold-light)' }}>
          Triskelion Grand Fraternity
        </p>
        <p className="mt-2 text-[13px] tracking-[3px] uppercase" style={{ color:'var(--text-muted)' }}>
          Asia 2 Community Chapter
        </p>

        <p className="mt-9 max-w-[560px] text-[16px] leading-[1.9]" style={{ color:'var(--text-muted)' }}>
          A brotherhood forged in honor, service, and unity — standing at the forefront of community leadership and genuine brotherly bonds.
        </p>

        <div className="mt-12 flex gap-4 flex-wrap justify-center">
          <a href="#about" className="btn-gold">Discover Our Brotherhood</a>
          <a href="#contact" className="btn-outline">Get In Touch</a>
        </div>

        <p className="mt-16 text-[11px] tracking-[4px] uppercase animate-bounce-down" style={{ color:'var(--text-muted)' }}>
          ↓ Scroll to explore
        </p>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`hero-indicator ${i === current ? 'active' : ''}`}
            aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </section>
  )
}
