import { useEffect, useRef, useState } from 'react';
import { CHARACTERS } from '../data/characters'; // Importing data to get images

export default function GameCanvas() {
  const canvasRef = useRef(null);
  
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [roast, setRoast] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [loadingRoast, setLoadingRoast] = useState(false);
  
  // Active Character State
  const [myCharId, setMyCharId] = useState(null);
  const [playerImage, setPlayerImage] = useState(null); // To store the loaded image

  // Entities
  const player = useRef({ x: 175, y: 400, size: 50 }); // Centerish
  const target = useRef({ x: 100, y: 100, size: 40, dx: 3, dy: 3 });

  // 1. SETUP: Load Equipped Character
  useEffect(() => {
    const equipped = localStorage.getItem('zogs_active_char');
    if (equipped && CHARACTERS[equipped]) {
      setMyCharId(equipped);
      // Preload the image so it draws smoothly on canvas
      const img = new Image();
      img.src = CHARACTERS[equipped].img;
      img.onload = () => setPlayerImage(img);
    }
  }, []);

  // 2. RENDER LOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- DRAW PLAYER (Your NFT or Default Emoji) ---
      if (playerImage) {
        // Draw the specialized NFT Image
        ctx.save();
        ctx.beginPath();
        // Circular mask for the image
        ctx.arc(player.current.x, player.current.y, player.current.size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(playerImage, player.current.x - 25, player.current.y - 25, 50, 50);
        ctx.restore();
        // Add a glow ring
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Fallback Emoji
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👽', player.current.x, player.current.y);
      }

      // --- DRAW TARGET (Emoji) ---
      if (isPlaying) {
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎯', target.current.x, target.current.y);
        
        // Move Target
        target.current.x += target.current.dx;
        target.current.y += target.current.dy;

        // Bounce off walls
        if (target.current.x < 20 || target.current.x > canvas.width - 20) target.current.dx *= -1;
        if (target.current.y < 20 || target.current.y > canvas.height - 20) target.current.dy *= -1;
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isPlaying, playerImage]);

  // Timer Logic
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame(false); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(60);
    setGameOver(false);
    setRoast(null);
  };

  const handleInput = (e) => {
    if (!isPlaying) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    
    const touchX = clientX - rect.left;
    const touchY = clientY - rect.top;

    // Check hit (simple distance check)
    const dist = Math.sqrt(
      Math.pow(touchX - target.current.x, 2) + Math.pow(touchY - target.current.y, 2)
    );

    // Hit Box Size (Generous)
    if (dist < 50) {
      setScore(s => s + 10);
      // Move target randomly
      target.current.x = Math.random() * (350 - 40) + 20;
      target.current.y = Math.random() * (500 - 40) + 20;
      // Increase speed slightly
      target.current.dx *= 1.1;
      target.current.dy *= 1.1;
    }
  };

  const endGame = async (won) => {
    setIsPlaying(false);
    setGameOver(true);
    setLoadingRoast(true);

    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          score, 
          won,
          characterId: myCharId 
        }), 
      });
      const data = await res.json();
      setRoast(data.roast); 
    } catch (e) {
      console.error(e);
      setRoast("Game Over. (Alien connection failed).");
    }
    setLoadingRoast(false);
  };

  return (
    <div style={{ position: 'relative', width: '350px', height: '500px', margin: '0 auto' }}>
      
      {/* HUD (Top) */}
      <div style={{ 
        position: 'absolute', top: '-40px', left: 0, width: '100%', 
        display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'18px'
      }}>
        <div style={{ color: '#0f0' }}>SCORE: {score}</div>
        <div style={{ color: timeLeft < 10 ? 'red' : '#fff' }}>TIME: {timeLeft}</div>
      </div>

      {/* CANVAS */}
      <canvas
        ref={canvasRef}
        width={350}
        height={500}
        style={{ background: '#222', borderRadius: '15px', border: '2px solid #555', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
        onMouseDown={handleInput}
        onTouchStart={handleInput}
      />

      {/* START SCREEN OVERLAY */}
      {!isPlaying && !gameOver && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', borderRadius: '15px'
        }}>
          <h1 style={{ fontSize: '40px', margin: 0, textShadow: '0 0 10px #7928CA' }}>ZOGS</h1>
          <p style={{ color: '#ccc' }}>Tap the targets!</p>
          <button 
            onClick={startGame}
            style={{ 
              padding: '15px 40px', fontSize: '20px', 
              background: '#7928CA', border: 'none', borderRadius: '50px', 
              cursor: 'pointer', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 0 #4a157d'
            }}
          >
            PLAY
          </button>
        </div>
      )}

      {/* GAME OVER OVERLAY (Fixes the scrolling issue!) */}
      {gameOver && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.9)', borderRadius: '15px', padding: '20px', textAlign: 'center'
        }}>
          <h2 style={{ color: 'red', fontSize: '30px', margin: '0 0 10px 0' }}>GAME OVER</h2>
          
          {loadingRoast ? (
            <div style={{ color: '#0f0' }}>👾 Incoming Transmission...</div>
          ) : (
            <div style={{ background: '#111', border: '1px solid #7928CA', padding: '15px', borderRadius: '10px', width: '100%' }}>
              {/* Show who is talking */}
              <div style={{ fontSize: '12px', color: '#0f0', marginBottom: '5px', textTransform:'uppercase' }}>
                {myCharId ? `FROM: ${myCharId}` : 'FROM: COACH ZOG'}
              </div>
              <p style={{ fontSize: '16px', fontStyle: 'italic', margin: 0, lineHeight: '1.4' }}>
                "{roast}"
              </p>
            </div>
          )}

          <button 
            onClick={startGame}
            style={{ 
              marginTop: '20px', padding: '12px 30px', fontSize: '18px', 
              background: '#0f0', border: 'none', borderRadius: '50px', 
              fontWeight: 'bold', cursor: 'pointer', color: '#000' 
            }}
          >
            RETRY
          </button>
          
          <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
            Score: {score}
          </div>
        </div>
      )}
    </div>
  );
}