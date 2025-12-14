import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Map from './map.jsx'
import Title from './title.jsx'
import MuteButton from './mute.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <Title />
      <Map />
      {/* <MuteButton /> */}
  </StrictMode>
)
