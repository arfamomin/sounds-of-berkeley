import { useRef, useEffect } from 'react'
import React from 'react'
import { createRoot } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'

import 'mapbox-gl/dist/mapbox-gl.css'
import './map.css'

import { ConcentricCircle as ConcentricCircleMarker } from './components/ConcentricCircle.jsx'


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

function Map() {
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)

  const insetMapRef = useRef(null)
  const insetContainerRef = useRef(null)

  // 🔑 SINGLE AUDIO INSTANCE
  const activeAudioRef = useRef(null)
  const activeMarkerRef = useRef(null)

  useEffect(() => {
    mapboxgl.accessToken =
      'pk.eyJ1IjoiYXJmYW1vbWluIiwiYSI6ImNscGwwYzZlMDAxaHgyanA1cWUzY2ExN3YifQ.z5jXdp6__K-B2oj1rpNOJw'


    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/arfamomin/cmj3fgcee00b901sndoav667d',
      center: [-122.258, 37.8715],
      zoom: 15.5,
      attributionControl: false
    })


    if (!insetContainerRef.current) return

    insetMapRef.current = new mapboxgl.Map({
      container: insetContainerRef.current,
      style: 'mapbox://styles/arfamomin/cmj3fgcee00b901sndoav667d',
      center: [-122.258, 37.8500],
      zoom: 10.8,
      interactive: false,
      attributionControl: false
    })


    const getMainMapBoundsGeoJSON = () => {
      const bounds = mapRef.current?.getBounds()
      if (!bounds) return null

      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()],
            [bounds.getWest(), bounds.getNorth()],
            [bounds.getWest(), bounds.getSouth()]
          ]]
        }
      }
    }

    insetMapRef.current.on('load', () => {
      insetMapRef.current.addSource('main-extent', {
        type: 'geojson',
        data: getMainMapBoundsGeoJSON()
      })

      insetMapRef.current.addLayer({
        id: 'main-extent-fill',
        type: 'fill',
        source: 'main-extent',
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': 0.15
        }
      })

      insetMapRef.current.addLayer({
        id: 'main-extent-outline',
        type: 'line',
        source: 'main-extent',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2
        }
      })

      // ---------- INSET DATA POINTS ----------
insetMapRef.current.addSource('inset-points', {
  type: 'geojson',
  data: `${import.meta.env.BASE_URL}data/data.geojson`
})

insetMapRef.current.addLayer({
  id: 'inset-points-circle',
  type: 'circle',
  source: 'inset-points',
  paint: {
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      8, 2,
      12, 4
    ],
    // 'circle-color': "rgb(255, 107, 138)",
        'circle-color': "#ffffff",

    'circle-opacity': 0.40,
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 0.0
  }
})

    })

    const updateInsetExtent = () => {
      if (!insetMapRef.current) return
      const source = insetMapRef.current.getSource('main-extent')
      if (!source) return
      source.setData(getMainMapBoundsGeoJSON())
    }

    mapRef.current.on('move', updateInsetExtent)
    mapRef.current.on('zoom', updateInsetExtent)

    activeAudioRef.current = new Audio()
    activeAudioRef.current.loop = true
    activeAudioRef.current.volume = 0

    mapRef.current.on('load', async () => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}data/data.geojson`
        )
        const geojsonData = await response.json()

        geojsonData.features.forEach((feature) => {
          const { coordinates } = feature.geometry
          const {
            Name,
            SoundIntensity,
            Date,
            Filename
          } = feature.properties

          const markerDiv = document.createElement('div')
          markerDiv.style.cursor = 'pointer'

          const root = createRoot(markerDiv)
          root.render(
            <ConcentricCircleMarker
              soundIntensity={SoundIntensity}
              name={Name}
            />
          )

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

          markerDiv.addEventListener('mouseenter', () => {
            popup.setLngLat(coordinates).addTo(mapRef.current)

            const audio = activeAudioRef.current

            if (
              activeMarkerRef.current &&
              activeMarkerRef.current !== markerDiv
            ) {
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
      insetMapRef.current?.remove()
    }
  }, [])

  return (
    <div id="map-container" ref={mapContainerRef}>
      <div id="inset-map" ref={insetContainerRef} />
    </div>
  )
}

export default Map
