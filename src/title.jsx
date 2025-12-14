import './title.css'
import { useEffect, useState, useRef } from 'react'
import { ConcentricCircle } from './components/ConcentricCircle.jsx'

const MIN_DISTANCE = 125

const FADE_STEP = 30
const FADE_OUT_DURATION = 450
const FADE_IN_DURATION = 350

export default function TitlePage() {

  const [hasStarted, setHasStarted] = useState(false)
  const [cursorEnabled, setCursorEnabled] = useState(true)

  const triggered = useRef(false)
  const audioUnlockedRef = useRef(false)

  const audioRef = useRef(null)
  const fadeIntervalRef = useRef(null)
  const lastPointRef = useRef(null)

  const [features, setFeatures] = useState([])
  const [circles, setCircles] = useState([])

// click to start
  useEffect(() => {
    if (hasStarted) return

    const startExperience = () => {
      // unlock browser audio permission
      const unlock = new Audio()
      unlock.volume = 0
      unlock.play().catch(() => {})
      audioUnlockedRef.current = true

      // initialize shared audio
      audioRef.current = new Audio()
      audioRef.current.volume = 1

      setHasStarted(true)
      window.removeEventListener('click', startExperience)
    }

    window.addEventListener('click', startExperience)
    return () => window.removeEventListener('click', startExperience)
  }, [hasStarted])

  // load data
  useEffect(() => {
    if (!hasStarted) return

    fetch(`${import.meta.env.BASE_URL}data/data.geojson`)
      .then((res) => res.json())
      .then((data) => setFeatures(data.features || []))
      .catch(console.error)
  }, [hasStarted])

  // aidio controls
  const clearFade = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }
  }

  const hardStopAudio = () => {
    clearFade()
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    audioRef.current.src = ''
  }

  const fadeIn = (src) => {
    if (!audioRef.current) return

    const audio = audioRef.current
    audio.src = src
    audio.volume = 0
    audio.play().catch(() => {})

    const steps = FADE_IN_DURATION / FADE_STEP
    const volumeStep = 1 / steps
    let step = 0

    fadeIntervalRef.current = setInterval(() => {
      step++
      audio.volume = Math.min(1, audio.volume + volumeStep)

      if (step >= steps || audio.volume >= 1) {
        clearFade()
      }
    }, FADE_STEP)
  }

  const fadeOutThenPlay = (src) => {
    if (!audioRef.current) return

    clearFade()
    const audio = audioRef.current

    // If nothing is playing, skip fade-out
    if (!audio.src || audio.paused) {
      fadeIn(src)
      return
    }

    const steps = FADE_OUT_DURATION / FADE_STEP
    const volumeStep = audio.volume / steps
    let step = 0

    fadeIntervalRef.current = setInterval(() => {
      step++
      audio.volume = Math.max(0, audio.volume - volumeStep)

      if (step >= steps || audio.volume <= 0) {
        audio.pause()
        audio.currentTime = 0
        clearFade()
        fadeIn(src)
      }
    }, FADE_STEP)
  }

  const playAudio = (filename) => {
    if (
      !filename ||
      !audioUnlockedRef.current ||
      triggered.current ||
      !audioRef.current
    )
      return

    fadeOutThenPlay(`${import.meta.env.BASE_URL}data/audio/${filename}`)
  }

  // scroll to map
  useEffect(() => {
    if (!hasStarted) return

    document.documentElement.classList.add('locked')
    document.body.classList.add('locked')

    const onWheel = () => {
      if (triggered.current) return
      triggered.current = true

      // 🔇 HARD CUT on mode change
      hardStopAudio()

      window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth',
      })

      setTimeout(() => {
        document.documentElement.classList.remove('locked')
        document.body.classList.remove('locked')
        setCursorEnabled(true)
      }, 800)
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [hasStarted])

  // mouse tracking
  useEffect(() => {
    if (
      !hasStarted ||
      !cursorEnabled ||
      features.length === 0 ||
      triggered.current
    )
      return

    const addCircle = (point) => {
      const feature =
        features[Math.floor(Math.random() * features.length)]

      playAudio(feature.properties.Filename)

      setCircles((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          x: point.x,
          y: point.y,
          soundIntensity: feature.properties.SoundIntensity,
          name: feature.properties.Name,
          filename: feature.properties.Filename,
        },
      ])
    }

    const handleMouseMove = (e) => {
      const point = { x: e.clientX, y: e.clientY }

      if (!lastPointRef.current) {
        lastPointRef.current = point
        addCircle(point)
        return
      }

      const dx = point.x - lastPointRef.current.x
      const dy = point.y - lastPointRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance >= MIN_DISTANCE) {
        lastPointRef.current = point
        addCircle(point)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [hasStarted, cursorEnabled, features])


  if (!hasStarted) {
    return (
      <div className="title-page gate">
        <div className="title-content">
          <h1>Sounds of Berkeley</h1>
          <p className="instruction">Click anywhere to begin listening.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="title-page">
      <div className="circle-layer">
        {circles.map((c) => (
          <div
            key={c.id}
            className="circle-wrapper"
            style={{ left: c.x, top: c.y }}
          >
            <ConcentricCircle
              soundIntensity={c.soundIntensity}
              name={c.name}
              filename={c.filename}
            />
          </div>
        ))}
      </div>

      <div className="title-content">
        <h1>Sounds of Berkeley</h1>
        <p className="instruction">Scroll to explore the map</p>
      </div>
    </div>
  )
}
