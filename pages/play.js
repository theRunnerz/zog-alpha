import GameCanvas from '../components/GameCanvas';
import Link from 'next/link';
import { useRouter } from 'next/router'; // IMPORT THIS
import { useEffect, useState } from 'react';
import { getSessionId } from '../lib/session';

export default function Play() {
  const [sid, setSid] = useState('');
  const router = useRouter(); // HOOK
  const { target, challenger } = router.query; // READ PARAMS

  useEffect(() => {
    setSid(getSessionId());
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '500px', padding: '20px' }}>
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

      {/* Pass target to canvas */}
      <GameCanvas targetScore={target ? parseInt(target) : 0} />
    </div>
  );
}