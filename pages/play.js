/* pages/play.js */
import GameCanvas from '../components/GameCanvas';
import RefereeOverlay from '../components/RefereeOverlay'; // NEW IMPORT
import Link from 'next/link';
import { useRouter } from 'next/router'; 
import { useEffect, useState } from 'react';
import { getSessionId } from '../lib/session';

export default function Play() {
  const [sid, setSid] = useState('');
  const [gameEvent, setGameEvent] = useState(null); // NEW STATE FOR AI
  const router = useRouter(); 
  const { target, challenger } = router.query; 

  useEffect(() => {
    setSid(getSessionId());
  }, []);

  // --- NEW: Handle events from inside GameCanvas ---
  const handleGameEvent = (type, score, streak) => {
    // timestamp (ts) ensures React updates even if the message is the same
    setGameEvent({ event: type, score, streak, ts: Date.now() });
  };

  return (
    <div style={{ width: '100%', maxWidth: '500px', padding: '20px', position: 'relative' }}>
      
      {/* 1. THE AI REFEREE OVERLAY */}
      {/* This sits on top of everything to show commentary */}
      <RefereeOverlay trigger={gameEvent} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <Link href="/">← Back</Link>
        <span style={{ fontSize: '10px', color: '#666' }}>ID: {sid}</span>
      </div>

      {/* SHOW CHALLENGE HEADER */}
      {target && (
        <div style={{ 
          background: '#ff4d4d', 
          color: 'white', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '20px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          🎯 BEAT SCORE: {target}
        </div>
      )}

      {/* 2. Pass handleGameEvent directly to the Canvas */}
      <GameCanvas 
        targetScore={target ? parseInt(target) : 0} 
        onEvent={handleGameEvent} 
      />
    </div>
  );
}