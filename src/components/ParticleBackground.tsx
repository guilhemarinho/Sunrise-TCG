import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;
  decay: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const maxParticles = 60;

    const colors = [
      '#00ff66', // Neon green
      '#bc13fe', // Neon purple
      '#39ff14', // Electric lime
      '#a100ff', // Vivid violet
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse coordinates
    const mouse = {
      x: null as number | null,
      y: null as number | null,
      radius: 120,
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const createParticle = (x?: number, y?: number): Particle => {
      const isXGiven = x !== undefined;
      const posX = isXGiven ? x : Math.random() * canvas.width;
      const posY = y !== undefined ? y : Math.random() * canvas.height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      return {
        x: posX,
        y: posY,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -(Math.random() * 0.5 + 0.2), // upward drift
        color,
        alpha: Math.random() * 0.5 + 0.3,
        decay: Math.random() * 0.003 + 0.001,
      };
    };

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Randomly spawn small sparks
      if (particles.length < maxParticles && Math.random() < 0.1) {
        particles.push(createParticle(Math.random() * canvas.width, canvas.height + 10));
      }

      particles.forEach((p, index) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.alpha -= p.decay;

        // Interaction with mouse
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distance = Math.hypot(dx, dy);
          
          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            const forceX = Math.cos(angle) * force * 0.8;
            const forceY = Math.sin(angle) * force * 0.8;
            
            p.x += forceX;
            p.y += forceY;
          }
        }

        // Check bounds or alpha
        if (p.alpha <= 0 || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          particles[index] = createParticle(Math.random() * canvas.width, canvas.height + 10);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.shadowBlur = p.size * 3;
          ctx.shadowColor = p.color;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-1"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
