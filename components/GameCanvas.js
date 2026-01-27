import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { CHARACTERS } from '../data/characters';

// Justin Sun's Address (acting as the Game Treasury for this Demo)
// In production, this is your Smart Contract
const GAME_TREASURY = "TY691Xr2EWgKJmHfm7NWKMRJjojLmS2cma"; 

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const router = useRouter();
  
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [aiCommentary, setAiCommentary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Players
  const [myCharId, setMyCharId] = useState(null);
  const [playerImage, setPlayerImage] = useState(null);
  
  // PvP & Betting State
  const [opponent, setOpponent] = useState(null);
  const [myWager, setMyWager] = useState("0");      
  const [wallet, setWallet] = useState(null);
  const [txHash, setTxHash] = useState(null); // Proof of payment
  const [paying, setPaying] = useState(false);

  // Entities
  const player = useRef({ x: 175, y: 400, size: 50 });
  const target = useRef({ x: 100, y: 100, size: 40, dx: 3, dy: 3 });

  // 1. SETUP
  useEffect(() => {
    const equipped = localStorage.getItem('zogs_active_char');
    if (equipped && CHARACTERS[equipped]) {
      setMyCharId(equipped);
      const img = new Image();
      img.src = CHARACTERS[equipped].img;
      img.onload = () => setPlayerImage(img);
    }

    if (router.isReady) {
      const { challenger, target, wager } = router.query;
      if (challenger && target) {
        setOpponent({
          id: challenger,
          score: parseInt(target),
          name: CHARACTERS[challenger]?.name || "Unknown Alien",
          wager: wager ? parseFloat(wager) : 0
        });
      }
    }
    
    // Attempt to detect wallet immediately
    if(window.tronWeb && window.tronWeb.defaultAddress.base58) {
      setWallet(window.tronWeb.defaultAddress.base58);
    }
  }, [router.isReady, router.query]);

  // --- TRON LOGIC ---

  const connectWallet = async () => {
    if (window.tronWeb) {
      try {
        await window.tronWeb.request({ method: 'tron_requestAccounts' });
        setWallet(window.tronWeb.defaultAddress.base58);
      } catch(e) { console.error(e); }
    } else {
      alert("Please install TronLink!");
    }
  };

  const handleTransaction = async (amountTRX) => {
    if (!amountTRX || parseFloat(amountTRX) <= 0) return true; // No wager = free pass

    if (!window.tronWeb || !window.tronWeb.ready) {
      alert("TronLink is not ready. Log in to your extension.");
      connectWallet();
      return false;
    }

    setPaying(true);
    try {
      const amountSun = parseFloat(amountTRX) * 1_000_000;
      
      // SEND TRANSACTION
      const tx = await window.tronWeb.trx.sendTransaction(
        GAME_TREASURY,
        amountSun
      );
      
      console.log("PAYMENT SUCCESS:", tx);
      setTxHash(tx.transaction ? tx.transaction.txID : "demo_tx_id"); // Store hash
      setPaying(false);
      return true;

    } catch (error) {
      console.error("PAYMENT FAILED:", error);
      alert(`Transaction Failed: ${error.message || "User rejected"}`);
      setPaying(false);
      return false;
    }
  };

  // 1. CREATOR STRATEGY: Pay -> Link
  const createChallenge = async () => {
    if (!wallet) return connectWallet();

    const amount = parseFloat(myWager);
    if (amount > 0) {
      const success = await handleTransaction(amount);
      if (!success) return;
    }

    // If payment worked (or was 0), generate link
    const url = `${window.location.origin}/play?challenger=${myCharId || 'guest'}&target=${score}&wager=${amount}`;
    navigator.clipboard.writeText(url);
    alert(`💰 Wager Placed! Link Copied.`);
  };

  // 2. JOINER STRATEGY: Pay -> Play
  const acceptChallenge = async () => {
    const success = await handleTransaction(opponent.wager);
    if (success) {
      startGame();
    }
  };

  // --- GAME LOGIC (Unchanged) ---
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
        ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.font = '40px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('👽', player.current.x, player.current.y);
      }
      if (isPlaying) {
        ctx.font = '30px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(opponent ? '💰' : '👽', target.current.x, target.current.y);
        target.current.x += target.current.dx; target.current.y += target.current.dy;
        if (target.current.x < 20 || target.current.x > canvas.width - 20) target.current.dx *= -1;
        if (target.current.y < 20 || target.current.y > canvas.height - 20) target.current.dy *= -1;
      }
      animationFrameId = window.requestAnimationFrame(render);
    };
    render();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isPlaying, playerImage, opponent]);

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { endGame(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const startGame = () => {
    setIsPlaying(true); setScore(0); setTimeLeft(60); setGameOver(false); setAiCommentary(null);
  };

  const handleInput = (e) => {
    if (!isPlaying) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touchX = (e.clientX || e.touches[0].clientX) - rect.left;
    const touchY = (e.clientY || e.touches[0].clientY) - rect.top;
    const dist = Math.sqrt(Math.pow(touchX - target.current.x, 2) + Math.pow(touchY - target.current.y, 2));

    if (dist < 60) {
      setScore(s => s + 10);
      target.current.x = Math.random() * (350 - 40) + 20;
      target.current.y = Math.random() * (500 - 40) + 20;
      target.current.dx *= 1.1; target.current.dy *= 1.1;
    }
  };

  const endGame = async () => {
    setIsPlaying(false); setGameOver(true); setLoadingAi(true);
    const isWin = opponent ? score > opponent.score : true;
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

  // --- RENDER ---
  return (
    <div style={{ position: 'relative', width: '350px', height: '500px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ position: 'absolute', top: '-40px', left: 0, width: '100%', display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'18px' }}>
        <div style={{ color: '#0f0' }}>SCORE: {score}</div>
        {opponent && <div style={{ color: 'yellow' }}>POT: {opponent.wager * 2} TRX</div>}
        <div style={{ color: timeLeft < 10 ? 'red' : '#fff' }}>TIME: {timeLeft}</div>
      </div>

      <canvas ref={canvasRef} width={350} height={500} style={{ background: '#111', borderRadius: '15px', border: '2px solid #555' }} onMouseDown={handleInput} onTouchStart={handleInput} />

      {/* OVERLAY: START / ACCEPT */}
      {!isPlaying && !gameOver && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', borderRadius: '15px', padding:'20px', textAlign:'center' }}>
          
          {opponent ? (
            <>
               <h2 style={{color:'red', margin:0}}>⚔️ PvP MATCH ⚔️</h2>
               <div style={{margin:'10px 0'}}>
                 Target: <b style={{color:'#0f0'}}>{opponent.score}</b><br/>
                 Entry Fee: <b style={{color:'yellow'}}>{opponent.wager} TRX</b>
               </div>
               
               {!wallet ? (
                 <button onClick={connectWallet} style={{padding:'10px', fontSize:'14px', borderRadius:'5px'}}>🔵 Connect TronLink</button>
               ) : (
                 <button 
                  onClick={acceptChallenge} 
                  disabled={paying}
                  style={{ padding: '15px 40px', fontSize: '20px', background: paying ? '#555' : 'yellow', border: 'none', borderRadius: '50px', cursor: 'pointer', color: 'black', fontWeight: 'bold', boxShadow:'0 0 15px yellow' }}>
                   {paying ? 'CONFIRMING...' : `PAY ${opponent.wager} TRX & PLAY`}
                 </button>
               )}
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '40px', margin: '0 0 20px 0', textShadow: '0 0 10px #7928CA' }}>ZOGS</h1>
              <button onClick={startGame} style={{ padding: '15px 40px', fontSize: '20px', background: '#7928CA', border: 'none', borderRadius: '50px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>
                PLAY
              </button>
            </>
          )}
        </div>
      )}

      {/* OVERLAY: GAME OVER / CREATE */}
      {gameOver && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)', borderRadius: '15px', padding: '20px', textAlign: 'center' }}>
          
          {loadingAi ? <div style={{ color: '#0f0' }}>📡 AI Judging...</div> : (
            <>
              <h2 style={{ color: '#fff', fontSize: '20px', margin: '0 0 10px 0' }}>MATCH REPORT</h2>
              <div style={{ background: '#222', padding: '10px', borderRadius: '10px', width: '100%', fontSize: '13px', fontStyle: 'italic', marginBottom:'15px', border:'1px solid #444' }}>"{aiCommentary}"</div>

              {/* CREATE WAGER UI */}
              {!opponent && (
                <div style={{ marginBottom: '15px', width:'100%' }}>
                  <label style={{fontSize:'12px', color:'#aaa'}}>ADD WAGER (TRX)</label>
                  <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={myWager}
                      onChange={(e) => setMyWager(e.target.value)}
                      style={{ flex:1, padding:'10px', background:'#000', border:'1px solid #0f0', color:'#fff', borderRadius:'5px', textAlign:'center', fontSize:'16px' }}
                    />
                  </div>
                </div>
              )}
              
              <div style={{ display:'flex', gap:'10px'}}>
                <button onClick={startGame} style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer' }}>RETRY</button>
                
                {/* BUTTON DIFFERS BASED ON STATE */}
                {opponent ? (
                  <button onClick={() => alert("Bet Settled (Demo Only)")} style={{ padding: '10px 20px', background: '#aaa', color: '#000', border: 'none', borderRadius: '30px', cursor: 'not-allowed', fontWeight:'bold' }}>
                    BET SETTLED
                  </button>
                ) : (
                  <button 
                    onClick={createChallenge} 
                    disabled={paying}
                    style={{ padding: '10px 20px', background: '#0f0', color: '#000', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight:'bold' }}
                  >
                    {paying ? 'WAIT...' : `STAKE & SHARE`}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}