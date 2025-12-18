import React from 'react';

interface SantaHatProps {
  className?: string;
}

const SantaHat: React.FC<SantaHatProps> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      {/* Outer Glow/Border to make it stand out against any background */}
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.2"/>
      </filter>

      <g filter="url(#shadow)">
        {/* Red Hat Body - curving sharply down to the left */}
        <path 
          d="M75 35C75 15 50 10 35 15C15 22 15 45 20 60L40 60C40 45 55 50 75 45L75 35Z" 
          fill="#D10000" 
          stroke="#000" 
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        
        {/* Highlight on Red Body */}
        <path 
          d="M65 25C65 20 55 18 45 20" 
          stroke="white" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          opacity="0.3"
        />

        {/* Fluffy White Trim (Bottom) - very cloud-like with many bumps */}
        <path 
          d="M38 38C35 35 30 35 28 38C25 36 20 38 20 42C18 45 20 50 24 52C22 55 25 60 30 60C35 62 40 60 42 58C45 62 52 62 58 60C62 62 68 62 72 58C76 60 82 58 84 52C86 48 84 42 80 40C82 36 78 32 72 34C70 30 64 30 60 34C56 30 48 30 44 34C42 32 38 35 38 38Z" 
          fill="white" 
          stroke="#000" 
          strokeWidth="1.5" 
          strokeLinejoin="round"
        />

        {/* Fluffy White Pompom (at the tip, bottom-left) */}
        <path 
          d="M15 58C12 55 8 55 5 58C2 62 5 68 10 70C8 75 12 80 18 80C24 80 28 75 30 70C35 72 40 68 40 62C40 58 35 55 30 55C28 50 22 50 18 52C15 50 12 52 10 55C12 58 15 58 15 58Z" 
          fill="white" 
          stroke="#000" 
          strokeWidth="1.5" 
          strokeLinejoin="round"
        />
        
        {/* Inner fluff detail lines */}
        <path d="M25 45C27 43 30 43 32 45" stroke="#ccc" strokeWidth="1" strokeLinecap="round" />
        <path d="M50 45C52 43 55 43 57 45" stroke="#ccc" strokeWidth="1" strokeLinecap="round" />
        <path d="M15 65C17 63 20 63 22 65" stroke="#ccc" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  );
};

export default SantaHat;