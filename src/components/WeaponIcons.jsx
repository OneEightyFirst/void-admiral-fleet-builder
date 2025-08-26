import React from 'react';

// Prow weapons - double chevron pointing up
export const ProwIcon = ({ size = 16, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 12.78 15.63" 
      className={className}
      style={{ display: 'inline-block' }}
    >
      <g>
        <polygon 
          fill="currentColor" 
          points="12.77 3.86 12.77 8.22 6.39 4.36 0 8.23 0 3.87 6.38 0 12.77 3.86"
        />
        <polygon 
          fill="currentColor" 
          points="12.78 11.26 12.78 15.62 6.39 11.77 0 15.63 0 11.27 6.39 7.4 12.78 11.26"
        />
      </g>
    </svg>
  );
};

// Hull weapons - double chevron pointing sideways
export const HullIcon = ({ size = 16, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 15.63 12.77" 
      className={className}
      style={{ display: 'inline-block' }}
    >
      <g>
        <polygon 
          fill="currentColor" 
          points="11.77 12.77 7.4 12.77 11.26 6.39 7.4 0 11.77 0 15.63 6.39 11.77 12.77"
        />
        <polygon 
          fill="currentColor" 
          points="4.36 12.77 0 12.77 3.86 6.39 0 0 4.36 0 8.23 6.39 4.36 12.77"
        />
      </g>
    </svg>
  );
};

export default { ProwIcon, HullIcon };
