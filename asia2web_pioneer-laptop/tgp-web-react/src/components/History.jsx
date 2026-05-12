// src/components/History.jsx

const events = [
  { year: '2008',    title: 'Asia 2 Chapter Founded',         body: 'Our chapter was officially established, bringing the Triskelion spirit to our community. Charter members pledged to serve with honor and integrity under the motto Fortis Voluntas Fraternitas.' },
  { year: 'Early Years', title: 'Building the Brotherhood',   body: 'The chapter steadily grew as more brothers joined the cause. Strong bonds were forged through shared experiences, community activities, and a common commitment to the fraternity\'s core values.' },
  { year: 'Milestone',   title: 'First Community Outreach',   body: 'The chapter launched its first formal community outreach efforts, establishing the foundation for the service programs that continue to this day. Brothers united to make a tangible difference.' },
  { year: 'Monthly',     title: 'Clean-Up Drive Launched',    body: 'The Asia 2 chapter formalized its monthly Community Clean-Up Drive, rallying brothers and residents to maintain the cleanliness of our streets, parks, and waterways.' },
  { year: 'Monthly',     title: 'Libreng Almusal Program',    body: 'Driven by compassion, the chapter launched its monthly Libreng Almusal (Free Breakfast), providing hot and nutritious meals to underprivileged families. Brothers personally prepare and serve every meal.' },
  { year: 'Present',     title: 'Growing Stronger',           body: 'With 52 active brothers and counting, the Asia 2 Community Chapter continues to deepen its roots in service, uphold the dignity of the brotherhood, and inspire future Triskelions.' },
]

export default function History() {
  return (
    <section id="history" className="py-24 px-12" style={{ background: 'var(--dark)' }}>
      <div className="max-w-[1160px] mx-auto">
        <div className="text-center mb-16">
          <span className="section-label">Our Legacy</span>
          <h2 className="font-cinzel font-bold text-white" style={{ fontSize: 'clamp(28px,4vw,46px)' }}>
            Chapter History
          </h2>
          <div className="gold-line" />
        </div>

        <div className="max-w-[820px] mx-auto relative">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden md:block"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--gold-dark) 15%, var(--gold-dark) 85%, transparent)' }} />

          {events.map((e, i) => (
            <div key={i} className={`relative mb-12 flex ${i % 2 === 0 ? 'md:justify-end md:pr-[calc(50%+44px)]' : 'md:justify-start md:pl-[calc(50%+44px)]'}`}>
              {/* Dot */}
              <div className="absolute left-[18px] md:left-1/2 top-[18px] w-3 h-3 rounded-full -translate-x-1/2 hidden md:block"
                style={{ background: 'var(--gold)', border: '3px solid var(--dark)', boxShadow: '0 0 14px rgba(201,168,76,0.6)' }} />

              <div className="tl-content max-w-[350px] w-full">
                <div className="font-cinzel font-bold text-[22px] mb-2" style={{ color: 'var(--gold)' }}>{e.year}</div>
                <h3 className="font-bold text-[15px] text-white mb-2">{e.title}</h3>
                <p className="text-[14px] leading-[1.75]" style={{ color: 'var(--text-muted)' }}>{e.body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center mt-12 text-[13px] italic" style={{ color: 'var(--text-muted)' }}>
          * Detailed dates will be updated once chapter records are finalized.
        </p>
      </div>
    </section>
  )
}
