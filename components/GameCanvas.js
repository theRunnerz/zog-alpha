import { useEffect, useRef, useState } from 'react';
import { getSessionId } from '../lib/session';

// --- Emoji drawing helper ---
const drawAlien = (ctx, x, y, radius) => {
  ctx.font = `${radius * 2}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👾', x, y);
};

export default function GameCanvas({ targetScore }) {
  const canvasRef = useRef(null);
  const endedRef = useRef(false); // 🔒 prevent double endGame

  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [roast, setRoast] = useState('');
  const [loadingRoast, setLoadingRoast] = useState(false);
  const [shareLink, setShareLink] = useState(null);

  // Game state
  const gameState = useRef({
    target: { x: 150, y: 150, radius: 25, vx: 2, vy: 2 },
    width: 0,
    height: 0
  });

  // 1. Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    gameState.current.width = canvas.width;
    gameState.current.height = canvas.height;

    const render = () => {
      if (!isPlaying) return;

      const { width, height, target } = gameState.current;

      target.x += target.vx;
      target.y += target.vy;

      if (target.x + target.radius > width || target.x - target.radius < 0) target.vx *= -1;
      if (target.y + target.radius > height || target.y - target.radius < 0) target.vy *= -1;

      ctx.clearRect(0, 0, width, height);
      drawAlien(ctx, target.x, target.y, target.radius);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // 2. Timer
  useEffect(() => {
    if (!isPlaying) return;

    if (timeLeft <= 0) {
      endGame();
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [isPlaying, timeLeft]);

  // 3. Start game
  const startGame = () => {
    endedRef.current = false;
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(true);
    setShareLink(null);
    setRoast('');
  };

  // 4. End game (AI roast)
  const endGame = async () => {
    if (endedRef.current) return;
    endedRef.current = true;

    setIsPlaying(false);
    setLoadingRoast(true);

    const controller = new AbortController();
    const sid = getSessionId();

    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          score,
          won: targetScore && score > targetScore
        })
      });

      if (!res.ok) {
        throw new Error(`AI error ${res.status}`);
      }

      const data = await res.json();
      setRoast(data?.roast || 'Coach Zog is unimpressed.');
    } catch (err) {
      console.error('AI roast failed:', err);
      setRoast('Coach Zog lost the transmission.');
    } finally {
      setLoadingRoast(false);
      controller.abort();
    }

    // Save score (non-blocking)
    fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, score })
    }).catch(() => {});

    const shareUrl = `${window.location.origin}/play?target=${score}&challenger=${sid}`;
    setShareLink(shareUrl);
  };

  // 5. Input
  const handleInput = (clientX, clientY) => {
    if (!isPlaying) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const { x: tx, y: ty, radius } = gameState.current.target;
    const dist = Math.hypot(x - tx, y - ty);

    if (dist < radius) {
      setScore(s => s + 10);

      gameState.current.target.x = Math.random() * (gameState.current.width - 50) + 25;
      gameState.current.target.y = Math.random() * (gameState.current.height - 50) + 25;

      gameState.current.target.vx *= 1.1;
      gameState.current.target.vy *= 1.1;
    }
  };

  const onMouseDown = e => handleInput(e.clientX, e.clientY);
  const onTouchStart = e => {
    e.preventDefault();
    const touch = e.touches[0];
    handleInput(touch.clientX, touch.clientY);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: 20 }}>
      <div style={{ marginBottom: 10, fontSize: 24, fontFamily: 'monospace', color: '#0f0' }}>
        TIME: {timeLeft}s | SCORE: {score}
      </div>

      <canvas
        ref={canvasRef}
        width={350}
        height={400}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{
          background: 'radial-gradient(circle, #2a2a2a 0%, #000 100%)',
          border: '4px solid #0f0',
          borderRadius: 10,
          cursor: 'crosshair',
          touchAction: 'none'
        }}
      />

      {!isPlaying && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          {(score > 0 || roast) && (
            <div style={{ padding: 15, border: '1px dashed #0f0', maxWidth: 350, background: '#111' }}>
              <h3 style={{ color: '#0f0', marginBottom: 10 }}>👽 COACH ZOG SAYS:</h3>
              {loadingRoast ? (
                <p style={{ color: '#888', fontStyle: 'italic' }}>Transmitting insult…</p>
              ) : (
                <p style={{ color: '#fff', fontWeight: 'bold' }}>"{roast}"</p>
              )}
            </div>
          )}

          <button
            onClick={startGame}
            style={{
              padding: '15px 40px',
              fontSize: 20,
              background: '#7928CA',
              color: '#fff',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
              width: '100%',
              maxWidth: 300
            }}
          >
            {score === 0 ? 'START GAME' : 'PLAY AGAIN'}
          </button>

          {shareLink && (
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Beat my Zog score!',
                    text: `I scored ${score}. Coach Zog roasted me.`,
                    url: shareLink
                  }).catch(() => {});
                } else {
                  alert(`Copy this link:\n${shareLink}`);
                }
              }}
              style={{
                padding: '15px 40px',
                fontSize: 20,
                background: '#0f0',
                color: '#000',
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer',
                width: '100%',
                maxWidth: 300
              }}
            >
              SHARE SCORE
            </button>
          )}
        </div>
      )}
    </div>
  );
}
