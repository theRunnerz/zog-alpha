import { useEffect, useRef, useState } from 'react';
import { getSessionId } from '../lib/session';

// --- Emoji drawing helper ---
const drawAlien = (ctx, x, y, radius) => {
  // FIXED: Added backticks for template literal
  ctx.font = `${radius * 2}px Arial`; 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👾', x, y); 
};

export default function GameCanvas({ targetScore }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [roast, setRoast] = useState('');
  const [loadingRoast, setLoadingRoast] = useState(false);
  const [shareLink, setShareLink] = useState(null);

  // Game state (Refs are mutable without re-render)
  const gameState = useRef({
    target: { x: 150, y: 150, radius: 25, vx: 2, vy: 2 },
    width: 0,
    height: 0
  });

  // 1. Game looping
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      if (!isPlaying) return;

      const { width, height, target } = gameState.current;

      // Update Physics
      target.x += target.vx;
      target.y += target.vy;

      // Bounce
      if (target.x + target.radius > width || target.x - target.radius < 0) target.vx *= -1;
      if (target.y + target.radius > height || target.y - target.radius < 0) target.vy *= -1;

      // Draw
      ctx.clearRect(0, 0, width, height);
      drawAlien(ctx, target.x, target.y, target.radius);

      animationFrameId = window.requestAnimationFrame(render);
    };

    if (isPlaying) {
      gameState.current.width = canvas.width;
      gameState.current.height = canvas.height;
      render();
    }

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // 2. Timer logic
  useEffect(() => {
    let timerId;
    if (isPlaying && timeLeft > 0) {
      timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      endGame();
    }
    return () => clearInterval(timerId);
  }, [isPlaying, timeLeft]);

  // 3. Start & End Helpers
  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(true);
    setShareLink(null);
    setRoast('');
  };

  const endGame = async () => {
    setIsPlaying(false);
    setLoadingRoast(true);
    const sid = getSessionId();

    // CALL AI ROAST
    try {
      const aiRes = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          score, 
          won: targetScore && score > targetScore 
        })
      });
      const aiData = await aiRes.json();
      
      if (aiData?.roast) {
        setRoast(aiData.roast);
      } else {
        setRoast("Coach Zog is speechless.");
      }
    } catch (err) {
      console.error(err);
      setRoast("Coach Zog lost signal.");
    }
    setLoadingRoast(false);

    // Save score in background
    try {
      await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, score })
      });
    } catch {}

    // Generate Share Link
    const shareUrl = `${window.location.origin}/play?target=${score}&challenger=${sid}`;
    setShareLink(shareUrl);
  };

  // 4. Input Handlers
  const handleInput = (clientX, clientY) => {
    if (!isPlaying) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const { x: tx, y: ty, radius } = gameState.current.target;

    const dist = Math.hypot(x - tx, y - ty);

    if (dist < radius) {
      setScore(s => s + 10);
      // Teleport
      gameState.current.target.x = Math.random() * (gameState.current.width - 50) + 25;
      gameState.current.target.y = Math.random() * (gameState.current.height - 50) + 25;
      // Speed up
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
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <div style={{ marginBottom: '10px', fontSize: '24px', fontFamily: 'monospace', color: '#0f0' }}>
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
          borderRadius: '10px',
          cursor: 'crosshair',
          touchAction: 'none'
        }}
      />

      {/* GAME OVER UI */}
      {!isPlaying && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          
          {/* AI MESSAGE BOX */}
          {(score > 0 || roast) && (
            <div style={{ padding: '15px', border: '1px dashed #0f0', maxWidth: '350px', background: '#111' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#0f0' }}>👽 COACH ZOG SAYS:</h3>
              {loadingRoast ? (
                <p style={{ fontStyle: 'italic', color: '#888' }}>Transmitting insult...</p>
              ) : (
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>"{roast}"</p>
              )}
            </div>
          )}

          <button 
            onClick={startGame} 
            style={{ 
              padding: '15px 40px', fontSize: '20px', 
              background: '#7928CA', color: 'white', 
              border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', maxWidth: '300px'
            }}
          >
            {score === 0 ? "START GAME" : "PLAY AGAIN"}
          </button>

          {shareLink && (
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Beat my Zog Score!',
                    text: `I scored ${score}. Coach Zog roasted me: "${roast}"`,
                    url: shareLink
                  }).catch(() => {});
                } else {
                  alert(`Copy this link: ${shareLink}`);
                }
              }}
              style={{
                 padding: '15px 40px', fontSize: '20px', 
                 background: '#0f0', color: '#000', 
                 border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', maxWidth: '300px'
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