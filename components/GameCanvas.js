import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router'; // ✅ Added Router
import { CHARACTERS } from '../data/characters';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const router = useRouter(); // ✅ To read URL params
  
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [aiCommentary, setAiCommentary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Identity State
  const [myCharId, setMyCharId] = useState(null);
  const [playerImage, setPlayerImage] = useState(null);

  // PvP State
  const [opponent, setOpponent] = useState(null); // { name, score, id }

  // Entities
  const player = useRef({ x: 175, y: 400, size: 50 });
  const target = useRef({ x: 100, y: 100, size: 40, dx: 3, dy: 3 });

  // 1. SETUP: Load Identity AND Check URL for Challenge
  useEffect(() => {
    // A. Load My Identity
    const equipped = localStorage.getItem('zogs_active_char');
    if (equipped && CHARACTERS[equipped]) {
      setMyCharId(equipped);
      const img = new Image();
      img.src = CHARACTERS[equipped].img;
      img.onload = () => setPlayerImage(img);
    }

    // B. Check URL for Challenge (?challenger=333&target=500)
    if (router.isReady) {
      const { challenger, target } = router.query;
      if (challenger && target) {
        setOpponent({
          id: challenger,
          score: parseInt(target),
          name: CHARACTERS[challenger]?.name || "Unknown Alien"
        });
      }
    }
  }, [router.isReady, router.query]);

  // 2. RENDER LOOP (Unchanged logic, just keeping it here)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (playerImage) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(player.current.x, player.current.y, player.current.size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(playerImage, player.current.x - 25, player.current.y - 25, 50, 50);
        ctx.restore();
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👽', player.current.x, player.current.y);
      }

      if (isPlaying) {
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎯', target.current.x, target.current.y);
        
        target.current.x += target.current.dx;
        target.current.y += target.current.dy;
        if (target.current.x < 20 || target.current.x > canvas.width - 20) target.current.dx *= -1;
        if (target.current.y < 20 || target.current.y > canvas.height - 20) target.current.dy *= -1;
      }

      animationFrameId = window.requestAnimationFrame(render);
    };
    render();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isPlaying, playerImage]);

  // Timer
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame(); 
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
    setAiCommentary(null);
  };

  const handleInput = (e) => {
    if (!isPlaying) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touchX = (e.clientX || e.touches[0].clientX) - rect.left;
    const touchY = (e.clientY || e.touches[0].clientY) - rect.top;
    const dist = Math.sqrt(Math.pow(touchX - target.current.x, 2) + Math.pow(touchY - target.current.y, 2));

    if (dist < 50) {
      setScore(s => s + 10);
      target.current.x = Math.random() * (350 - 40) + 20;
      target.current.y = Math.random() * (500 - 40) + 20;
      target.current.dx *= 1.1;
      target.current.dy *= 1.1;
    }
  };

  // ✅ NEW END GAME LOGIC
  const endGame = async () => {
    setIsPlaying(false);
    setGameOver(true);
    setLoadingAi(true);

    const isWin = opponent ? score > opponent.score : true;
    
    // Determine API Endpoint: PvP (Referee) or Solo (Roast)
    const endpoint = opponent ? '/api/referee' : '/api/roast';
    const payload = opponent 
      ? { playerScore: score, opponentScore: opponent.score, playerCharId: myCharId, opponentCharId: opponent.id, won: isWin }
      : { score, won: true, characterId: myCharId };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), 
      });
      const data = await res.json();
      setAiCommentary(data.commentary || data.roast); 
    } catch (e) {
      setAiCommentary("Connection Error.");
    }
    setLoadingAi(false);
  };

  // ✅ SHARE FUNCTION
  const shareChallenge = () => {
    // Base URL + Params
    const url = `${window.location.origin}/play?challenger=${myCharId || 'guest'}&target=${score}`;
    navigator.clipboard.writeText(url);
    alert("PvP Link Copied! Send it to a friend.");
  };

  return (
    <div style={{ position: 'relative', width: '350px', height: '500px', margin: '0 auto' }}>
      
      {/* HUD */}
      <div style={{ position: 'absolute', top: '-40px', left: 0, width: '100%', display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'18px' }}>
        <div style={{ color: '#0f0' }}>SCORE: {score}</div>
        {/* PvP Indicator */}
        {opponent && <div style={{ color: '#f00' }}>BEAT: {opponent.score}</div>}
        <div style={{ color: timeLeft < 10 ? 'red' : '#fff' }}>TIME: {timeLeft}</div>
      </div>

      <canvas ref={canvasRef} width={350} height={500} style={{ background: '#222', borderRadius: '15px', border: '2px solid #555' }} onMouseDown={handleInput} onTouchStart={handleInput} />

      {/* START OVERLAY */}
      {!isPlaying && !gameOver && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', borderRadius: '15px' }}>
          
          {/* PvP Banner */}
          {opponent ? (
            <div style={{textAlign:'center', marginBottom:'20px'}}>
               <h2 style={{color:'red', margin:0}}>⚠️ CHALLENGE ⚠️</h2>
               <div style={{color:'#fff'}}>Beat {opponent.name}'s Score</div>
               <div style={{fontSize:'40px', fontWeight:'bold', color:'#0f0'}}>{opponent.score}</div>
            </div>
          ) : (
            <h1 style={{ fontSize: '40px', margin: '0 0 20px 0', textShadow: '0 0 10px #7928CA' }}>ZOGS</h1>
          )}

          <button onClick={startGame} style={{ padding: '15px 40px', fontSize: '20px', background: '#7928CA', border: 'none', borderRadius: '50px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>
            {opponent ? 'ACCEPT MATCH' : 'PLAY'}
          </button>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameOver && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)', borderRadius: '15px', padding: '20px', textAlign: 'center' }}>
          
          {loadingAi ? (
            <div style={{ color: '#0f0' }}>📡 AI Referee Judging...</div>
          ) : (
            <>
              <h2 style={{ color: '#fff', fontSize: '24px', margin: '0 0 10px 0' }}>MATCH REPORT</h2>
              <div style={{ background: '#111', border: '1px solid #7928CA', padding: '10px', borderRadius: '10px', width: '100%', fontSize: '14px', fontStyle: 'italic', marginBottom:'20px' }}>
                "{aiCommentary}"
              </div>
              
              <div style={{ display:'flex', gap:'10px'}}>
                <button onClick={startGame} style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer' }}>RETRY</button>
                
                {/* SHARE BUTTON */}
                <button onClick={shareChallenge} style={{ padding: '10px 20px', background: '#0f0', color: '#000', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight:'bold' }}>
                   COPY PvP LINK 🔗
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}