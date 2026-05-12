// src/components/Projects.jsx
import PhotoSlider from './PhotoSlider'

import c1 from '../assets/projects/cleanup1.jpg'
import c2 from '../assets/projects/cleanup2.jpg'
import c3 from '../assets/projects/cleanup3.jpg'
import c4 from '../assets/projects/cleanup4.jpg'
import c5 from '../assets/projects/cleanup5.jpg'
import b1 from '../assets/projects/freebrakfast1.jpg'
import b2 from '../assets/projects/freebrakfast2.jpg'
import b3 from '../assets/projects/freebrakfast3.jpg'
import b4 from '../assets/projects/freebrakfast4.jpg'
import b5 from '../assets/projects/freebrakfast5.jpg'

const cleanupPhotos    = [c1, c2, c3, c4, c5]
const breakfastPhotos  = [b1, b2, b3, b4, b5]

const projects = [
  {
    tag: 'Environment',
    title: 'Community Clean-Up Drive',
    desc: 'Every month, our brothers gather to clean our community\'s streets, esteros, and public spaces. We believe a clean community reflects a disciplined brotherhood. Participants also engage with residents to promote proper waste segregation and environmental responsibility.',
    freq: 'Every Month, Without Fail',
    photos: cleanupPhotos,
    interval: 4000,
  },
  {
    tag: 'Social Welfare',
    title: 'Libreng Almusal',
    desc: 'Walang magugutom sa aming pamayanan. Every month, our brothers personally prepare and serve hot, nutritious meals to underprivileged families and individuals. It is more than food — it is a message that they are not alone, and that the brotherhood cares.',
    freq: 'Every Month, With Love',
    photos: breakfastPhotos,
    interval: 4500,
  },
]

export default function Projects() {
  return (
    <section id="projects" className="py-24 px-12" style={{ background: 'var(--dark2)' }}>
      <div className="max-w-[1160px] mx-auto">
        <div className="text-center mb-16">
          <span className="section-label">Community Service</span>
          <h2 className="font-cinzel font-bold text-white" style={{ fontSize: 'clamp(28px,4vw,46px)' }}>
            Our Projects
          </h2>
          <div className="gold-line" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {projects.map(p => (
            <div key={p.title} className="project-card">
              {/* Photo Slider */}
              <div className="relative" style={{ height: '220px' }}>
                <PhotoSlider images={p.photos} interval={p.interval} />
                <span className="absolute top-4 left-4 z-10 text-[10px] tracking-widest uppercase font-bold px-4 py-1"
                  style={{ background: 'var(--gold)', color: 'var(--dark)' }}>
                  Monthly
                </span>
              </div>

              {/* Body */}
              <div className="p-8">
                <span className="inline-block text-[10px] tracking-[2.5px] uppercase px-3 py-1 mb-4"
                  style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid var(--gold-dark)', color: 'var(--gold)' }}>
                  {p.tag}
                </span>
                <h3 className="font-cinzel text-white text-[22px] mb-3">{p.title}</h3>
                <p className="text-[14px] leading-[1.85]" style={{ color: 'var(--text-muted)' }}>{p.desc}</p>
                <div className="flex items-center gap-2 mt-5 text-[12px] tracking-[1.5px]" style={{ color: 'var(--gold)' }}>
                  <span className="block w-5 h-px" style={{ background: 'var(--gold)' }} />
                  {p.freq}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
