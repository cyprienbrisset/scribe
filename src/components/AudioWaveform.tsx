import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';

interface AudioWaveformProps {
  width?: number;
  height?: number;
  barCount?: number;
  barColor?: string;
  active?: boolean;
}

export function AudioWaveform({
  width = 320,
  height = 80,
  barCount = 32,
  barColor = 'var(--accent-primary)',
  active = true,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelsRef = useRef<number[]>(new Array(barCount).fill(0));
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const unlisten = listen<{ levels: number[] }>('mic-level', (event) => {
      levelsRef.current = event.payload.levels;
    });

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      const levels = levelsRef.current;
      const gap = 2;
      const barWidth = (width - gap * (barCount - 1)) / barCount;
      const minBarHeight = 2;

      for (let i = 0; i < barCount; i++) {
        const level = levels[i] || 0;
        const barHeight = Math.max(minBarHeight, level * height * 0.9);
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        ctx.fillStyle = barColor;
        ctx.globalAlpha = 0.4 + level * 0.6;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      unlisten.then((fn) => fn());
    };
  }, [active, width, height, barCount, barColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="rounded-lg"
    />
  );
}
