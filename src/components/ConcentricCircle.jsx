import React from 'react';

export const ConcentricCircle = ({ soundIntensity, name }) => {
  const getRingCount = (intensity) => {
    if (intensity < 42) return 4;
    if (intensity < 54) return 7;
    if (intensity < 66) return 10;
    if (intensity < 78) return 13;
    return 16;
  };

  const numRings = getRingCount(soundIntensity);
  const ringSpacing = 3;
  const centerRadius = 3;

  const maxRadius = centerRadius + (numRings * ringSpacing);
  const width = maxRadius * 2 + 20;
  const cx = width / 2;
  const cy = width / 2;

  return (
    <div style={{ cursor: 'pointer' }} title={name}>
      <svg
        width={width}
        height={width}
        viewBox={`0 0 ${width} ${width}`}
        style={{
          filter: 'drop-shadow(0 2px 8px rgba(255, 107, 138, 0.4))',
          display: 'block'
        }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={centerRadius}
          fill="transparent"
          stroke="#ff6b8a"
          strokeWidth="2"
        />

        {Array.from({ length: numRings }, (_, i) => {
          const ringRadius = centerRadius + (ringSpacing * (i + 1));
          const opacity = 1 - ((i + 1) / numRings) * 0.7;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={ringRadius}
              fill="none"
              stroke="rgb(255, 107, 138)"
              strokeOpacity={opacity}
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
};
