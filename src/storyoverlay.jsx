import { useEffect, useRef, useState } from 'react'

const chapters = [
  {
    id: 'plum',
    center: [-122.2595, 37.8723],
    zoom: 12,
    bearing: 0,
    pitch: 0,
    sound: 'Plum deep Convo.m4a',
    text: 'The city opens here, where the wind is louder than traffic.'
  },
  {
    id: 'elis',
    center: [-122.2566, 37.8679],
    zoom: 15,
    bearing: 30,
    pitch: 45,
    sound: 'Eli’s Mile High Club.m4a',
    text: 'Beneath the city, movement never stops.'
  }
]

export default function StoryOverlay({ mapRef, onFinish }) {
  const containerRef = useRef(null)
  const audioRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.loop = true
    audioRef.current.volume = 0
  }, [])

  useEffect(() => {
    const sections = containerRef.current.querySelectorAll('.story-step')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const index = Number(entry.target.dataset.index)
          setActiveIndex(index)
        })
      },
      { threshold: 0.6 }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (activeIndex < 0) return
    const chapter = chapters[activeIndex]
    const map = mapRef.current
    const audio = audioRef.current

    map.flyTo({
      center: chapter.center,
      zoom: chapter.zoom,
      bearing: chapter.bearing,
      pitch: chapter.pitch,
      speed: 0.7,
      curve: 1.4
    })

    audio.pause()
    audio.currentTime = 0
    // audio.src = `/data/audio/${chapter.sound}`
    audio.volume = 0
    audio.play().catch(() => {})

    let v = 0
    const fade = setInterval(() => {
      v += 0.05
      audio.volume = Math.min(v, 1)
      if (v >= 1) clearInterval(fade)
    }, 30)

    return () => clearInterval(fade)
  }, [activeIndex, mapRef])

  useEffect(() => {
    const onScrollEnd = () => {
      const rect = containerRef.current.getBoundingClientRect()
      if (rect.bottom < window.innerHeight / 2) {
        audioRef.current?.pause()
        audioRef.current.src = ''
        onFinish()
      }
    }

    window.addEventListener('scroll', onScrollEnd)
    return () => window.removeEventListener('scroll', onScrollEnd)
  }, [onFinish])

  return (
    <div ref={containerRef} className="story-container">
      {chapters.map((_, i) => (
        <div key={i} className="story-step" data-index={i} />
      ))}

      {activeIndex >= 0 && (
        <div className="story-box">
          {chapters[activeIndex].text}
        </div>
      )}
    </div>
  )
}
