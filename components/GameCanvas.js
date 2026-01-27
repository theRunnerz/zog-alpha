import { useEffect, useRef, useState } from 'react';

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

  // Entities
  const player = useRef({ x: 150, y: 300, size: 40 });
  const target = useRef({ x: 100, y: 100, size: 30, dx: 2, dy: 2 });

  useEffect(() => {
    // 1. CHECK WHO IS EQUIPPED
    const equipped = localStorage.getItem('zogs_active_char');
    if (equipped) setMyCharId(equipped);
  }, []);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Player (Simple Circle for now)
      ctx.fillStyle = '#0f0'; // Alien Green
      ctx.beginPath();
      ctx.arc(player.current.x, player.current.y, player.current.size, 0, 2 * Math.PI);
      ctx.fill();

      // Draw Target (Red)
      if (isPlaying) {
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(target.current.x, target.current.y, target.current.size, 0, 2 * Math.PI);
        ctx.fill();
        
        // Move Target
        target.current.x += target.current.dx;
        target.current.y += target.current.dy;

        // Bounce
        if (target.current.x < 0 || target.current.x > canvas.width) target.current.dx *= -1;
        if (target.current.y < 0 || target.current.y > canvas.height) target.current.dy *= -1;
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // Timer
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame(false); // Time run out = Loss
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

  const handleTap = (e) => {
    if (!isPlaying) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const touchX = (e.clientX || e.touches[0].clientX) - rect.left;
    const touchY = (e.clientY || e.touches[0].clientY) - rect.top;

    // Check hit
    const dist = Math.sqrt(
      Math.pow(touchX - target.current.x, 2) + Math.pow(touchY - target.current.y, 2)
    );

    if (dist < target.current.size + 10) {
      setScore(s => s + 10);
      // Move target randomly
      target.current.x = Math.random() * 300;
      target.current.y = Math.random() * 500;
      // Increase difficulty speed
      target.current.dx *= 1.1;
      target.current.dy *= 1.1;
    }
  };

  const endGame = async (won) => {
    setIsPlaying(false);
    setGameOver(true);
    setLoadingRoast(true);

    try {
      // 2. SEND SCORE + EQUIPPED CHARACTER ID
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          score, 
          won,
          characterId: myCharId // <--- Sending the ID
        }), 
      });
      const data = await res.json();
      setRoast(data.roast); 
    } catch (e) {
      console.error(e);
      setRoast("Alien connection failed.");
    }
    setLoadingRoast(false);
  };

  return (
    <div style={{ textAlign: 'center', touchAction: 'none' }}>
      
      {/* HUD */}
      <div style={{ display:'flex', justifyContent:'space-between', padding:'10px', maxWidth:'400px', margin:'0 auto' }}>
        <h2 style={{ color: '#fff' }}>Score: {score}</h2>
        <h2 style={{ color: timeLeft < 10 ? 'red' : '#fff' }}>Time: {timeLeft}s</h2>
      </div>

      <canvas
        ref={canvasRef}
        width={350}
        height={500}
        style={{ background: '#222', borderRadius: '10px', border: '2px solid #555' }}
        onMouseDown={handleTap}
        onTouchStart={handleTap}
      />

      {/* GAME OVER MODAL */}
      {gameOver && (
        <div style={{ padding: '20px', color: '#fff' }}>
          <h1>GAME OVER</h1>
          
          {loadingRoast ? (
            <p>Waiting for Alien Analysis...</p>
          ) : (
            <div style={{ background: '#333', padding: '15px', borderRadius: '10px', border:'1px solid #7928CA', margin:'10px' }}>
              {/* If character is equipped, maybe show their name? */}
              {myCharId && <p style={{color:'#0f0', fontSize:'12px', marginBottom:'5px'}}>MESSAGE FROM {myCharId.toUpperCase()}:</p>}
              <p style={{ fontSize: '18px', fontStyle: 'italic' }}>"{roast}"</p>
            </div>
          )}

          <button 
            onClick={startGame}
            style={{ 
              marginTop: '20px', padding: '15px 30px', fontSize: '20px', 
              background: '#0f0', border: 'none', borderRadius: '50px', 
              fontWeight: 'bold', cursor: 'pointer', color: '#000' 
            }}
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {!isPlaying && !gameOver && (
        <button 
          onClick={startGame}
          style={{ 
            marginTop: '20px', padding: '20px 40px', fontSize: '24px', 
            background: '#7928CA', border: 'none', borderRadius: '50px', 
            cursor: 'pointer', color: 'white' 
          }}
        >
          START GAME
        </button>
      )}
    </div>
  );
}