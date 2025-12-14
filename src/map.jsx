import { useRef, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'

import 'mapbox-gl/dist/mapbox-gl.css'
import './map.css'

import { ConcentricCircle as ConcentricCircleMarker } from './components/ConcentricCircle.jsx'

/* -----------------------------
   Helpers
----------------------------- */

function formatDate(date) {
  if (!date) return ''

  const d =
    date instanceof Date
      ? date
      : new Date(`${date}T12:00:00`)

  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function fadeAudio(audio, targetVolume, duration = 600) {
  if (!audio) return

  const startVolume = audio.volume
  const startTime = performance.now()

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1)
    audio.volume =
      startVolume + (targetVolume - startVolume) * progress

    if (progress < 1) {
      requestAnimationFrame(step)
    } else if (targetVolume === 0) {
      audio.pause()
      audio.currentTime = 0
    }
  }

  requestAnimationFrame(step)
}

/* -----------------------------
   Map Component
----------------------------- */

function Map() {
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)

  // 🔑 SINGLE AUDIO INSTANCE
  const activeAudioRef = useRef(null)
  const activeMarkerRef = useRef(null)

  useEffect(() => {
    mapboxgl.accessToken =
      'pk.eyJ1IjoiYXJmYW1vbWluIiwiYSI6ImNscGwwYzZlMDAxaHgyanA1cWUzY2ExN3YifQ.z5jXdp6__K-B2oj1rpNOJw'

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/arfamomin/cmj3fgcee00b901sndoav667d',
      center: [-122.26, 37.8715],
      zoom: 14.5,
      attributionControl: false
    })

    // create shared audio once
    activeAudioRef.current = new Audio()
    activeAudioRef.current.loop = true
    activeAudioRef.current.volume = 0

    mapRef.current.on('load', async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/data.geojson`)
        const geojsonData = await response.json()

        geojsonData.features.forEach((feature) => {
          const { coordinates } = feature.geometry
          const {
            Name,
            SoundIntensity,
            Date,
            Filename
          } = feature.properties

          /* ---------- Marker DOM ---------- */
          const markerDiv = document.createElement('div')
          markerDiv.style.cursor = 'pointer'

          const root = createRoot(markerDiv)
          root.render(
            <ConcentricCircleMarker
              soundIntensity={SoundIntensity}
              name={Name}
            />
          )

          /* ---------- Popup ---------- */
          const popup = new mapboxgl.Popup({
            offset: 50,
            closeButton: false,
            closeOnClick: false,
            className: 'info-tooltip'
          }).setHTML(`
            <div class="info-tooltip-content">
              <div class="info-tooltip-title">${Name}</div>
              <div class="info-tooltip-subtitle">${formatDate(Date)}</div>
            </div>
          `)

          new mapboxgl.Marker({
            element: markerDiv,
            anchor: 'center'
          })
            .setLngLat(coordinates)
            .addTo(mapRef.current)

          /* ---------- Interactions ---------- */

          markerDiv.addEventListener('mouseenter', () => {
            popup.setLngLat(coordinates).addTo(mapRef.current)

            const audio = activeAudioRef.current

            // stop previous marker’s audio
            if (activeMarkerRef.current && activeMarkerRef.current !== markerDiv) {
              fadeAudio(audio, 0)
            }

            activeMarkerRef.current = markerDiv

            audio.src = `${import.meta.env.BASE_URL}data/audio/${Filename}`
            audio.currentTime = 0

            audio
              .play()
              .then(() => fadeAudio(audio, 1))
              .catch(() => {})
          })

          markerDiv.addEventListener('mouseleave', () => {
            popup.remove()

            // only stop if THIS marker owns the audio
            if (activeMarkerRef.current === markerDiv) {
              fadeAudio(activeAudioRef.current, 0)
              activeMarkerRef.current = null
            }
          })
        })
      } catch (err) {
        console.error('Error loading GeoJSON:', err)
      }
    })

    return () => {
      activeAudioRef.current?.pause()
      mapRef.current?.remove()
    }
  }, [])

  return <div id="map-container" ref={mapContainerRef} />
}

export default Map
