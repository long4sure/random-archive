// src/components/Contact.jsx
import { useState } from 'react'

const subjects = [
  'Membership Inquiry',
  'Community Partnership',
  'Sponsorship / Donation',
  'Event Collaboration',
  'General Inquiry',
]

export default function Contact() {
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' })
  const [success, setSuccess] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const send = e => {
    e.preventDefault()
    if (!form.name || !form.email || !form.subject || !form.message) {
      alert('Please fill in all fields.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      alert('Please enter a valid email.')
      return
    }
    const to      = 'jemisa@sscrcan.edu.ph'
    const subject = encodeURIComponent(`[TGP Asia 2] ${form.subject} — from ${form.name}`)
    const body    = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject}\n\nMessage:\n${form.message}\n\n---\nSent via TGP Asia 2 Chapter Website`
    )
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`, '_blank')
    setSuccess(true)
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <section id="contact" className="py-24 px-12" style={{ background: 'var(--dark)' }}>
      <div className="max-w-[1160px] mx-auto">
        <div className="text-center mb-16">
          <span className="section-label">Reach Out</span>
          <h2 className="font-cinzel font-bold text-white" style={{ fontSize: 'clamp(28px,4vw,46px)' }}>
            Send Us a Message
          </h2>
          <div className="gold-line" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-16 items-start">

          {/* Info */}
          <div>
            <h3 className="font-cinzel text-white text-[22px] mb-5">Get In Touch</h3>
            <p className="text-[15px] leading-[1.85] mb-8" style={{ color: 'var(--text-muted)' }}>
              Whether you're interested in the brotherhood, want to partner on a community project, or simply want to know more — we'd love to hear from you.
            </p>
            {[
              { icon: '✉', label: 'Email',   value: 'jemisa@sscrcan.edu.ph' },
              { icon: '◈', label: 'Chapter', value: 'Asia 2 Community Chapter' },
              { icon: '⬡', label: 'Projects',value: 'Monthly Clean-Up & Libreng Almusal' },
            ].map(d => (
              <div key={d.label} className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-10 h-10 shrink-0 text-[18px]"
                  style={{ border: '1px solid var(--gold-dark)', color: 'var(--gold)' }}>
                  {d.icon}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[1.5px] mb-1" style={{ color: 'var(--text-muted)' }}>{d.label}</div>
                  <div className="text-white text-[13px]">{d.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="p-11" style={{ background: 'var(--dark2)', border: '1px solid var(--dark4)' }}>
            <form onSubmit={send}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                {[
                  { name: 'name',  label: 'Your Name',  type: 'text',  ph: 'Juan dela Cruz' },
                  { name: 'email', label: 'Your Email', type: 'email', ph: 'your@email.com' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-[10px] tracking-[2.5px] uppercase mb-2" style={{ color: 'var(--gold)' }}>{f.label}</label>
                    <input name={f.name} type={f.type} placeholder={f.ph}
                      value={form[f.name]} onChange={handle}
                      className="form-input" />
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <label className="block text-[10px] tracking-[2.5px] uppercase mb-2" style={{ color: 'var(--gold)' }}>Subject</label>
                <select name="subject" value={form.subject} onChange={handle} className="form-input">
                  <option value="">Select a topic...</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="mb-5">
                <label className="block text-[10px] tracking-[2.5px] uppercase mb-2" style={{ color: 'var(--gold)' }}>Message</label>
                <textarea name="message" rows={5} placeholder="Write your message here..."
                  value={form.message} onChange={handle}
                  className="form-input resize-y" style={{ minHeight: '140px' }} />
              </div>

              <button type="submit" className="btn-gold w-full text-center" style={{ clipPath: 'none' }}>
                Send Message →
              </button>
              <p className="text-center mt-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Message will open Gmail compose directly.
              </p>

              {success && (
                <div className="mt-5 p-5 text-center font-cinzel text-[14px] tracking-wide"
                  style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid var(--gold-dark)', color: 'var(--gold)' }}>
                  ✦ &nbsp; Gmail compose opened. Thank you, Brother! &nbsp; ✦
                </div>
              )}
            </form>
          </div>

        </div>
      </div>
    </section>
  )
}
