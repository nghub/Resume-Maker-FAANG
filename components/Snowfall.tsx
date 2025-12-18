import React, { useEffect, useState } from 'react';

const Snowfall: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<{ id: number; left: string; delay: string; duration: string; size: string; opacity: number }[]>([]);

  useEffect(() => {
    const count = 50;
    const initialSnowflakes = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 10 + 5}s`,
      size: `${Math.random() * 5 + 2}px`,
      opacity: Math.random() * 0.7 + 0.3
    }));
    setSnowflakes(initialSnowflakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="absolute bg-white rounded-full animate-snow-fall"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            animationDelay: flake.delay,
            animationDuration: flake.duration,
            top: '-20px'
          }}
        />
      ))}
      <style>{`
        @keyframes snow-fall {
          0% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(25vh) translateX(20px);
          }
          50% {
            transform: translateY(50vh) translateX(-20px);
          }
          75% {
            transform: translateY(75vh) translateX(20px);
          }
          100% {
            transform: translateY(105vh) translateX(0);
          }
        }
        .animate-snow-fall {
          animation-name: snow-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
};

export default Snowfall;
