import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { CHARACTERS } from '../data/characters';

// ⚠️ PASTE YOUR DEPLOYED SMART CONTRACT ADDRESS HERE
// If you haven't deployed yet, use the previous wallet logic, 
// otherwise this will fail until deployed.
const CONTRACT_ADDRESS = "TG...YOUR_CONTRACT_ADDRESS_HERE..."; 

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
  
  // Identity State
  const [myCharId, setMyCharId] = useState(null);
  const [playerImage, setPlayerImage] = useState(null);
  
  // PvP & Smart Contract State
  const [matchId, setMatchId] = useState(null);   // Unique ID for the blockchain match
  const [opponent, setOpponent] = useState(null); // { id, score, wager }
  const [myWager, setMyWager] = useState("0");    // The amount input by user
  
  // Wallet State
  const [wallet, setWallet] = useState(null);
  const [paying, setPaying] = useState(false);

  // Entities
  const player = useRef({ x: 175, y: 400, size: 50 });
  const target = useRef({ x: 100, y: 100, size: 40, dx: 3, dy: 3 });

  // 1. SETUP & URL PARSING
  useEffect(() => {
    // A. Load Character Image
    const equipped = localStorage.getItem('zogs_active_char');
    if (equipped && CHARACTERS[equipped]) {
      setMyCharId(equipped);
      const img = new Image();
      img.src = CHARACTERS[equipped].img;
      img.onload = () => setPlayerImage(img);
    }

    // B. Check URL for Challenge
    if (router.isReady) {
      const { challenger, target, wager, matchId: urlMatchId } = router.query;
      
      if (challenger && target) {
        // We are joining a game
        setOpponent({
          id: challenger,
          score: parseInt(target),
          name: CHARACTERS[challenger]?.name || "Unknown Alien",
          wager: wager ? parseFloat(wager) : 0
        });
        if (urlMatchId) setMatchId(urlMatchId);
      } else {
        // We are creating a game (Generate a specific ID for this session)
        if (!matchId) {
          const newId = `match_${Date.now()}_${Math.floor(Math.random()*999)}`;
          setMatchId(newId);
        }
      }
    }

    // C. Check Wallet
    if(window.tronWeb && window.tronWeb.defaultAddress.base58) {
      setWallet(window.tronWeb.defaultAddress.base58);
    }
  }, [router.isReady, router.query]);

  // --- SMART CONTRACT LOGIC ---

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

  const handleContractInteraction = async (isCreator) => {
    // 0. Validation
    if (!window.tronWeb || !window.tronWeb.ready) {
      alert("Please log in to TronLink.");
      connectWallet();
      return false;
    }

    const wagerAmount = isCreator ? parseFloat(myWager) : opponent.wager;
    
    // Skip contract call if betting 0 (Simulated Free Play)
    if (wagerAmount <= 0) return true; 

    setPaying(true);

    try {
      // 1. Get Contract Instance
      const contract = await window.tronWeb.contract().at(CONTRACT_ADDRESS);
      
      // 2. Convert to SUN
      const amountSun = window.tronWeb.toSun(wagerAmount); // Helper to multiply by 1mil

      // 3. Send Transaction
      let tradeTx;
      if (isCreator) {
        // Call: createChallenge(string matchId)
        tradeTx = await contract.createChallenge(matchId).send({
          callValue: amountSun
        });
      } else {
        // Call: joinChallenge(string matchId)
        tradeTx = await contract.joinChallenge(matchId).send({
          callValue: amountSun
        });
      }

      console.log("TX Hash:", tradeTx);
      setPaying(false);
      return true;

    } catch (error) {
      console.error("Smart Contract Error:", error);
      alert(`Transaction Failed: ${error}`);
      setPaying(false);
      return false;
    }
  };

  // ACTIONS

  // Strategy A: Creator pays, then gets the link
  const createChallenge = async () => {
    if (!wallet) return connectWallet();
    
    // Trigger Contract
    const success = await handleContractInteraction(true);
    if (!success) return;

    // Generate Link
    const url = `${window.location.origin}/play?challenger=${myCharId || 'guest'}&target=${score}&wager=${myWager}&matchId=${matchId}`;
    navigator.clipboard.writeText(url);
    alert(`✅ Deposit Confirmed on Blockchain!\nLink Copied.`);
  };

  // Strategy B: Joiner pays, then game starts
  const acceptChallenge = async () => {
    // Trigger Contract
    const success = await handleContractInteraction(false);
    if (success) {
      startGame();
    }
  };

  // --- GAME ENGINE (Unchanged) ---
  
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
        ctx.fillText(opponent ? '💰' : '🎯', target.current.x, target.current.y);
        
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
      ? { playerScore: score, opponentScore: opponent.score, playerCharId: myCharId, opponentCharId: opponent.id, won: isWin, matchId } // Sending matchId to backend
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

  // --- RENDER UI ---
  return (
    <div style={{ position: 'relative', width: '350px', height: '500px', margin: '0 auto' }}>
      
      {/* HUD */}
      <div style={{ position: 'absolute', top: '-40px', left: 0, width: '100%', display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'18px' }}>
        <div style={{ color: '#0f0' }}>SCORE: {score}</div>
        {opponent && <div style={{ color: 'yellow' }}>POT: {opponent.wager * 2} TRX</div>}
        <div style={{ color: timeLeft < 10 ? 'red' : '#fff' }}>TIME: {timeLeft}</div>
      </div>

      <canvas ref={canvasRef} width={350} height={500} style={{ background: '#111', borderRadius: '15px', border: '2px solid #555' }} onMouseDown={handleInput} onTouchStart={handleInput} />

      {/* OVERLAY: START SCREEN / PVP ACCEPT */}
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

      {/* OVERLAY: GAME OVER / STAKE BET */}
      {gameOver && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)', borderRadius: '15px', padding: '20px', textAlign: 'center' }}>
          
          {loadingAi ? <div style={{ color: '#0f0' }}>📡 RECOGNIZING WINNER...</div> : (
            <>
              <h2 style={{ color: '#fff', fontSize: '20px', margin: '0 0 10px 0' }}>MATCH REPORT</h2>
              <div style={{ background: '#222', padding: '10px', borderRadius: '10px', width: '100%', fontSize: '13px', fontStyle: 'italic', marginBottom:'15px', border:'1px solid #444' }}>"{aiCommentary}"</div>

              {/* CREATE WAGER UI */}
              {!opponent && (
                <div style={{ marginBottom: '15px', width:'100%' }}>
                  <label style={{fontSize:'12px', color:'#aaa'}}>WAGER (TRX)</label>
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
                
                {opponent ? (
                  <button onClick={() => alert("Check Wallet for Winnings!")} style={{ padding: '10px 20px', background: '#aaa', color: '#000', border: 'none', borderRadius: '30px', cursor: 'not-allowed', fontWeight:'bold' }}>
                    GAME FINISHED
                  </button>
                ) : (
                  <button 
                    onClick={createChallenge} 
                    disabled={paying}
                    style={{ padding: '10px 20px', background: '#0f0', color: '#000', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight:'bold' }}
                  >
                    {paying ? 'CONFIRMING...' : `STAKE & SHARE`}
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