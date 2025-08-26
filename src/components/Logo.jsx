import React from 'react';

const Logo = ({ height = 32, className = '' }) => {
  return (
    <svg 
      id="Layer_2" 
      data-name="Layer 2" 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 127.11 33.09"
      height={height}
      className={className}
      style={{ width: 'auto' }}
    >
      <defs>
        <style>
          {`.logo-fill {
            fill: currentColor;
          }`}
        </style>
      </defs>
      <g id="Layer_1-2" data-name="Layer 1">
        <path className="logo-fill" d="M31.44.2l-15.7,32.89L0,.2h7.12l8.62,18.89L24.36.2h7.08Z"/>
        <path className="logo-fill" d="M35.51.2l-15.7,32.89h7.08l4.15-9.33,13.08,9.31v.02h7.13L35.51.2ZM32.91,19.58l2.61-5.86,5.02,11.29-7.63-5.43Z"/>
        <g>
          <path className="logo-fill" d="M59.27,6.46h4.41v2.75h-4.41v5.77h-3V.19h8.05l.42,2.72h-5.47v3.55Z"/>
          <path className="logo-fill" d="M74.22,12.1l-.44,2.87h-8.19V.36l3-.36v12.1h5.64Z"/>
          <path className="logo-fill" d="M84.09,12.29l-.4,2.68h-8.57V.19h8.32l.42,2.66h-5.79v3.23h4.73v2.68h-4.73v3.53h6.02Z"/>
          <path className="logo-fill" d="M94.23,12.29l-.4,2.68h-8.57V.19h8.32l.42,2.66h-5.79v3.23h4.73v2.68h-4.73v3.53h6.02Z"/>
          <path className="logo-fill" d="M102.07,3v11.97h-3V3h-3.89l.44-2.81h9.88l.42,2.81h-3.87Z"/>
          <path className="logo-fill" d="M66.24,28.47c0,2.43-1.96,4.1-4.9,4.1h-5.07v-14.78h4.96c2.75,0,4.58,1.58,4.58,3.86,0,1.46-.82,2.62-2.2,3.27,1.63.61,2.62,1.9,2.62,3.55ZM59.25,20.17v3.76h1.54c1.22,0,2.09-.78,2.09-1.92s-.87-1.84-2.09-1.84h-1.54ZM63.17,28.24c0-1.16-.91-1.94-2.2-1.94h-1.73v3.89h1.73c1.29,0,2.2-.8,2.2-1.94Z"/>
          <path className="logo-fill" d="M67.03,26.86v-8.91l3-.36v9.1c0,2.01,1.14,3.29,2.89,3.29s2.91-1.29,2.91-3.29v-8.74l3-.36v9.29c0,3.55-2.34,5.96-5.91,5.96s-5.89-2.41-5.89-5.98Z"/>
          <path className="logo-fill" d="M79.93,17.97l3-.38v14.97h-3v-14.59Z"/>
          <path className="logo-fill" d="M92.72,29.69l-.44,2.87h-8.19v-14.61l3-.36v12.1h5.64Z"/>
          <path className="logo-fill" d="M93.68,17.78h4.2c4.39,0,7.69,3.17,7.69,7.39s-3.29,7.39-7.69,7.39h-4.2v-14.78ZM97.78,29.76c2.77,0,4.71-1.92,4.71-4.58s-1.94-4.58-4.71-4.58h-1.1v9.17h1.1Z"/>
          <path className="logo-fill" d="M115.8,29.88l-.4,2.68h-8.57v-14.78h8.32l.42,2.66h-5.79v3.23h4.73v2.68h-4.73v3.53h6.02Z"/>
          <path className="logo-fill" d="M123.54,32.56l-3.8-6.06v6.06h-2.98v-14.78h4.25c3.42,0,5.41,1.96,5.41,4.65,0,2.07-1.27,3.67-3.29,4.29l3.99,5.85h-3.57ZM119.74,25.03h.91c1.71,0,2.72-.99,2.72-2.41s-1.01-2.34-2.72-2.34h-.91v4.75Z"/>
        </g>
      </g>
    </svg>
  );
};

export default Logo;
