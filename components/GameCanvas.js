import { useEffect, useRef, useState } from 'react';
import { getSessionId } from '../lib/session';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  
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
      
      // Draw Target
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#ff4d4d';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

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
    const sid = getSessionId();
    
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, score: score })
      });
      const data = await res.json();
      alert(`GAME OVER\nScore: ${score}\nYour Best: ${data.best}`);
    } catch (e) {
      console.error(e);
    }
  };
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
      {/* HUD ... */}
      <div style={{ marginBottom: '10px', fontSize: '24px', fontFamily: 'monospace' }}>
        TIME: {timeLeft}s | SCORE: {score}
      </div>
      
      <canvas
        ref={canvasRef}
        width={350}
        height={400}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart} // ADDED THIS
        style={{ 
          background: '#222', 
          border: '4px solid #444', 
          borderRadius: '10px',
          cursor: 'crosshair',
          touchAction: 'none' // CRITICAL
        }}
      />
      {/* Buttons ... */}
      {!isPlaying && (
         // ... existing button code
         <div style={{ marginTop: '20px' }}>
             <button onClick={startGame} /* ... existing styles */ >
               {timeLeft === 0 ? 'PLAY AGAIN' : 'START GAME'}
             </button>
         </div>
      )}
    </div>
  );