import { useEffect, useRef, useState } from 'react';
import { getSessionId } from '../lib/session';

// --- NEW VISUALS ---
// Simple emoji drawing helper instead of red ball
const drawAlien = (ctx, x, y, radius) => {
  ctx.font = `${radius * 2}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👾', x, y); 
};
// -------------------

export default function GameCanvas({ targetScore }) { // Receives target from URL
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [roast, setRoast] = useState(''); // NEW: Store AI response
  const [loadingRoast, setLoadingRoast] = useState(false);
  
  // ... existing code ...
  // Game State Refs
  const gameState = useRef({
    target: { x: 150, y: 150, radius: 25, vx: 2, vy: 2 },
    width: 0,
    height: 0
  });

  // 1. Game Loop
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

      // Bounce Logic
      if (target.x + target.radius > width || target.x - target.radius < 0) target.vx *= -1;
      if (target.y + target.radius > height || target.y - target.radius < 0) target.vy *= -1;

      // Draw
      ctx.clearRect(0, 0, width, height);
      
      // Draw Target (REPLACED RED BALL WITH ALIEN)
      drawAlien(ctx, target.x, target.y, target.radius);
      // Optional: draw debug circle behind it if hitboxes feel weird
      // ctx.beginPath(); ctx.arc(target.x, target.y, target.radius, 0, 2 * Math.PI); ctx.stroke();

      animationFrameId = window.requestAnimationFrame(render);
    };

    if (isPlaying) {
      gameState.current.width = canvas.width;
      gameState.current.height = canvas.height;
      render();
    }

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // 2. Timer
  useEffect(() => {
    let timerId;
    if (isPlaying && timeLeft > 0) {
      timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      endGame();
    }
    return () => clearInterval(timerId);
  }, [isPlaying, timeLeft]);

  // 3. Logic
  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(true);
  };

const endGame = async () => {
  setIsPlaying(false);
  setLoadingRoast(true);
  const sid = getSessionId();

  // 1. Get AI Roast
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
    setRoast(aiData.roast);
  } catch(e) {
    setRoast("Connection error. Coach Zog is silent.");
  }
  setLoadingRoast(false);

  // 2. Background Save
  try {
    await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, score: score })
    });
  } catch(e) {}

  // 3. Prepare share URL (but DON'T call navigator.share yet)
  const shareUrl = `${window.location.origin}/play?target=${score}&challenger=${sid}`;
  // Save share URL in state so we can use it in the button
  setShareLink(shareUrl);
};

  // ... rest of component
// ... inside GameCanvas component

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

  const onMouseDown = (e) => handleInput(e.clientX, e.clientY);
  const onTouchStart = (e) => {
    // Prevent scrolling when tapping
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
          background: 'radial-gradient(circle, #2a2a2a 0%, #000 100%)', // UPGRADE BG
          border: '4px solid #0f0', 
          borderRadius: '10px',
          cursor: 'crosshair',
          touchAction: 'none'
        }}
      />
      
      {/* --- NEW: AI FEEDBACK SECTION --- */}
      {!isPlaying && score > 0 && (
        <div style={{ margin: '20px auto', padding: '15px', border: '1px dashed #0f0', maxWidth: '350px' }}>
          <h3 style={{ margin: 0, color: '#0f0' }}>👽 COACH ZOG SAYS:</h3>
          {loadingRoast ? (
            <p style={{ fontStyle: 'italic', color: '#888' }}>Analyzing tape...</p>
          ) : (
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>"{roast}"</p>
          )}
          <button onClick={startGame} style={btnStyle}>PLAY AGAIN</button>
        </div>
      )}

      {!isPlaying && score === 0 && (
         <div style={{ marginTop: '20px' }}>
            <button onClick={startGame} style={btnStyle}>START GAME</button>
         </div>
      )}
    </div>
  );
}

const btnStyle = {
  padding: '15px 40px', fontSize: '20px', 
  background: '#7928CA', color: 'white', 
  border: 'none', borderRadius: '5px', cursor: 'pointer',
  marginTop: '10px'
};