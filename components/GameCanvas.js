import { useEffect, useRef, useState } from 'react';
import { getSessionId } from '../lib/session';

/* ---------- Emoji drawing helper ---------- */
const drawAlien = (ctx, x, y, radius) => {
  ctx.font = `${radius * 2}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👾', x, y);
};

export default function GameCanvas({ targetScore }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [roast, setRoast] = useState('');
  const [loadingRoast, setLoadingRoast] = useState(false);
  const [shareLink, setShareLink] = useState(null);

  /* ---------- Game state ---------- */
  const gameState = useRef({
    target: { x: 100, y: 100, radius: 24, vx: 2, vy: 2 },
    width: 0,
    height: 0
  });

  /* ---------- Canvas resize (CRITICAL FIX) ---------- */
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;

      const cssWidth = container.clientWidth;
      const cssHeight = Math.min(window.innerHeight * 0.55, 420);

      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      gameState.current.width = cssWidth;
      gameState.current.height = cssHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
    };
  }, []);

  /* ---------- Game loop ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const loop = () => {
      if (!isPlaying) return;

      const { width, height, target } = gameState.current;

      target.x += target.vx;
      target.y += target.vy;

      if (target.x < target.radius || target.x > width - target.radius) target.vx *= -1;
      if (target.y < target.radius || target.y > height - target.radius) target.vy *= -1;

      ctx.clearRect(0, 0, width, height);
      drawAlien(ctx, target.x, target.y, target.radius);

      raf = requestAnimationFrame(loop);
    };

    if (isPlaying) loop();
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  /* ---------- Timer ---------- */
  useEffect(() => {
    if (!isPlaying) return;
    if (timeLeft === 0) return endGame();

    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [isPlaying, timeLeft]);

  /* ---------- Controls ---------- */
  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setRoast('');
    setShareLink(null);
    setIsPlaying(true);
  };

  const endGame = async () => {
    setIsPlaying(false);
    setLoadingRoast(true);

    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, won: targetScore && score > targetScore })
      });
      const data = await res.json();
      setRoast(data?.roast || 'Coach Zog is confused.');
    } catch {
      setRoast('Coach Zog lost signal.');
    }

    setLoadingRoast(false);

    const sid = getSessionId();
    fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, score })
    }).catch(() => {});

    setShareLink(`${window.location.origin}/play?target=${score}&challenger=${sid}`);
  };

  const handleInput = (clientX, clientY) => {
    if (!isPlaying) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const t = gameState.current.target;

    if (Math.hypot(x - t.x, y - t.y) < t.radius) {
      setScore(s => s + 10);
      t.x = Math.random() * (gameState.current.width - 50) + 25;
      t.y = Math.random() * (gameState.current.height - 50) + 25;
      t.vx *= 1.08;
      t.vy *= 1.08;
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ color: '#0f0', fontFamily: 'monospace', fontSize: 22, marginBottom: 10 }}>
        TIME: {timeLeft}s | SCORE: {score}
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={e => handleInput(e.clientX, e.clientY)}
        onTouchStart={e => handleInput(e.touches[0].clientX, e.touches[0].clientY)}
        style={{
          display: 'block',
          width: '100%',
          background: 'radial-gradient(circle, #2a2a2a 0%, #000 100%)',
          border: '4px solid #0f0',
          borderRadius: 10,
          touchAction: 'none'
        }}
      />

      {!isPlaying && (
        <button
          onClick={startGame}
          style={{
            marginTop: 16,
            padding: '14px 30px',
            fontSize: 18,
            background: '#7928CA',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            width: '100%'
          }}
        >
          {score === 0 ? 'START GAME' : 'PLAY AGAIN'}
        </button>
      )}
    </div>
  );
}
