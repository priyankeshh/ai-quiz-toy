import React, { useEffect, useState } from 'react';

interface FireworksProps {
  show: boolean;
  duration?: number;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

const Fireworks: React.FC<FireworksProps> = ({ show, duration = 3000, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isActive, setIsActive] = useState(false);

  const colors = [
    'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 
    'bg-purple-400', 'bg-pink-400', 'bg-orange-400', 'bg-cyan-400'
  ];

  const createFirework = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    const particleCount = 15 + Math.random() * 10;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 2 + Math.random() * 3;
      
      newParticles.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        life: 1,
        maxLife: 1
      });
    }

    return newParticles;
  };

  useEffect(() => {
    if (!show) {
      setIsActive(false);
      setParticles([]);
      return;
    }

    setIsActive(true);
    let animationFrame: number;
    let fireworkInterval: NodeJS.Timeout;

    // Create initial fireworks
    const initialFireworks = [
      createFirework(20, 30),
      createFirework(80, 25),
      createFirework(50, 40),
      createFirework(30, 60),
      createFirework(70, 55)
    ].flat();

    setParticles(initialFireworks);

    // Create periodic fireworks
    fireworkInterval = setInterval(() => {
      const x = 20 + Math.random() * 60;
      const y = 20 + Math.random() * 40;
      const newFirework = createFirework(x, y);
      
      setParticles(prev => [...prev, ...newFirework]);
    }, 500);

    // Animation loop
    const animate = () => {
      setParticles(prev => 
        prev
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.1, // gravity
            life: particle.life - 0.02
          }))
          .filter(particle => particle.life > 0)
      );

      if (isActive) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animate();

    // Clean up after duration
    const timeout = setTimeout(() => {
      setIsActive(false);
      clearInterval(fireworkInterval);
      cancelAnimationFrame(animationFrame);
      setParticles([]);
      onComplete?.();
    }, duration);

    return () => {
      clearInterval(fireworkInterval);
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrame);
    };
  }, [show, duration, onComplete, isActive]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className={`absolute w-2 h-2 ${particle.color} rounded-full`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.life,
            transform: `scale(${particle.size / 4})`,
            transition: 'opacity 0.1s ease-out'
          }}
        />
      ))}
      
      {/* Sparkle effects */}
      <div className="absolute top-1/4 left-1/4 text-6xl star-sparkle opacity-80">✨</div>
      <div className="absolute top-1/3 right-1/4 text-5xl star-sparkle opacity-70" style={{animationDelay: '0.5s'}}>🌟</div>
      <div className="absolute bottom-1/3 left-1/3 text-7xl star-sparkle opacity-60" style={{animationDelay: '1s'}}>⭐</div>
      <div className="absolute bottom-1/4 right-1/3 text-4xl star-sparkle opacity-75" style={{animationDelay: '1.5s'}}>💫</div>
      <div className="absolute top-1/2 left-1/2 text-8xl star-sparkle opacity-50" style={{animationDelay: '2s'}}>🎆</div>
    </div>
  );
};

export default Fireworks;
