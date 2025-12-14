import { useState } from 'react';

export default function MuteButton() {
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <button
      onClick={toggleMute}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        padding: '10px 15px',
        border: '2px solid white',
        backgroundColor: 'transparent',
        color: 'white',
        fontSize: '13px',
        fontWeight: 'bold',
        opacity: 0.75,
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
    >
    <div style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', display: 'flex', gap: '10px' }}>
      {isMuted ? (
        <img src="/assets/mute.svg" style={{ width: '20px', height: '20px' }} />
      ) : (
        <img src="/assets/unmute.svg" style={{ width: '20px', height: '20px' }} />
      )}
      {isMuted ? 'mute' : 'unmute'}

      </div>
    </button>
  );
}
