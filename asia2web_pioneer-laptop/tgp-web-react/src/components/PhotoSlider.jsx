// src/components/PhotoSlider.jsx
import { useState, useEffect } from 'react'

export default function PhotoSlider({ images, interval = 4000 }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % images.length), interval)
    return () => clearInterval(t)
  }, [images.length, interval])

  const prev = () => setCurrent(c => (c - 1 + images.length) % images.length)
  const next = () => setCurrent(c => (c + 1) % images.length)

  return (
    <div className="slider-wrap">
      <div className="slider-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {images.map((src, i) => (
          <img key={i} src={src} alt={`Slide ${i + 1}`} loading="lazy" />
        ))}
      </div>
      <button className="slider-btn" style={{ left: '10px' }} onClick={prev}>&#8592;</button>
      <button className="slider-btn" style={{ right: '10px' }} onClick={next}>&#8594;</button>
      <div className="slider-dots">
        {images.map((_, i) => (
          <span key={i} className={`slider-dot ${i === current ? 'active' : ''}`}
            onClick={() => setCurrent(i)} />
        ))}
      </div>
    </div>
  )
}
