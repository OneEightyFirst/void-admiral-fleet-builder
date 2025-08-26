import React from 'react';

function DiceFace({ value, size = 24 }) {
  const dotPositions = {
    1: [{ x: 12, y: 12 }],
    2: [{ x: 6, y: 6 }, { x: 18, y: 18 }],
    3: [{ x: 6, y: 6 }, { x: 12, y: 12 }, { x: 18, y: 18 }],
    4: [{ x: 6, y: 6 }, { x: 18, y: 6 }, { x: 6, y: 18 }, { x: 18, y: 18 }],
    5: [{ x: 6, y: 6 }, { x: 18, y: 6 }, { x: 12, y: 12 }, { x: 6, y: 18 }, { x: 18, y: 18 }],
    6: [{ x: 6, y: 6 }, { x: 18, y: 6 }, { x: 6, y: 12 }, { x: 18, y: 12 }, { x: 6, y: 18 }, { x: 18, y: 18 }]
  };

  const dots = dotPositions[value] || [];

  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect 
        x="1" 
        y="1" 
        width="22" 
        height="22" 
        rx="3" 
        ry="3" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      {dots.map((dot, index) => (
        <circle
          key={index}
          cx={dot.x}
          cy={dot.y}
          r="2"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

export default DiceFace;
