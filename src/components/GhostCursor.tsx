import { useEffect, useRef } from 'react';
import './GhostCursor.css';

interface GhostCursorProps {
  color?: string;
  brightness?: number;
  edgeIntensity?: number;
  trailLength?: number;
  inertia?: number;
  grainIntensity?: number;
  bloomStrength?: number;
  bloomRadius?: number;
  bloomThreshold?: number;
  fadeDelayMs?: number;
  fadeDurationMs?: number;
}

const GhostCursor = ({
  color = '#B19EEF',
  brightness = 1,
  edgeIntensity = 0,
  trailLength = 50,
  inertia = 0.5,
  grainIntensity = 0.05,
  bloomStrength = 0.1,
  bloomRadius = 1.0,
  bloomThreshold = 0.025,
  fadeDelayMs = 1000,
  fadeDurationMs = 1500,
}: GhostCursorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const trailRef = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      const now = Date.now();
      lastTimeRef.current = now;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update trail
      const currentTrail = trailRef.current;
      if (currentTrail.length > 0) {
        // Fade out old points
        const fadeStartTime = now - fadeDelayMs;
        const fadeEndTime = fadeStartTime + fadeDurationMs;

        trailRef.current = currentTrail.filter((point) => {
          const age = now - point.time;
          if (age > fadeEndTime) return false;
          return true;
        });

        // Draw trail
        if (trailRef.current.length > 1) {
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';

          // Draw trail with gradient
          for (let i = 0; i < trailRef.current.length - 1; i++) {
            const point = trailRef.current[i];
            const nextPoint = trailRef.current[i + 1];
            const age = now - point.time;

            // Calculate opacity based on fade
            let opacity = 1;
            if (age > fadeDelayMs) {
              const fadeProgress = (age - fadeDelayMs) / fadeDurationMs;
              opacity = Math.max(0, 1 - fadeProgress);
            }

            // Calculate size based on position in trail (smaller at start, larger at end)
            const progress = i / trailRef.current.length;
            const size = 4 + (1 - progress) * 8;

            // Apply brightness
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);

            ctx.globalAlpha = opacity * brightness;
            
            // Create gradient for trail
            const gradient = ctx.createLinearGradient(
              point.x, point.y,
              nextPoint.x, nextPoint.y
            );
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity * brightness})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${opacity * brightness * 0.5})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(nextPoint.x, nextPoint.y);
            ctx.stroke();

            // Draw point with glow effect
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity * brightness})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          ctx.restore();
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      if (lastMouseRef.current) {
        // Apply inertia
        const dx = x - lastMouseRef.current.x;
        const dy = y - lastMouseRef.current.y;
        const smoothedX = lastMouseRef.current.x + dx * (1 - inertia);
        const smoothedY = lastMouseRef.current.y + dy * (1 - inertia);

        trailRef.current.push({
          x: smoothedX,
          y: smoothedY,
          time: Date.now(),
        });

        // Limit trail length
        if (trailRef.current.length > trailLength) {
          trailRef.current.shift();
        }
      } else {
        trailRef.current.push({
          x,
          y,
          time: Date.now(),
        });
      }

      lastMouseRef.current = { x, y };
      lastTimeRef.current = Date.now();

      // Clear fade timeout
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };

    const handleMouseLeave = () => {
      // Start fade out after delay
      fadeTimeoutRef.current = setTimeout(() => {
        // Trail will fade naturally
      }, fadeDelayMs);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [
    color,
    brightness,
    edgeIntensity,
    trailLength,
    inertia,
    grainIntensity,
    bloomStrength,
    bloomRadius,
    bloomThreshold,
    fadeDelayMs,
    fadeDurationMs,
  ]);

  return (
    <div ref={containerRef} className="ghost-cursor">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default GhostCursor;

