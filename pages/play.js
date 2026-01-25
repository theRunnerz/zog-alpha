import GameCanvas from '../components/GameCanvas';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSessionId } from '../lib/session';

export default function Play() {
  const [sid, setSid] = useState('');

  useEffect(() => {
    setSid(getSessionId());
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '500px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/">← Back</Link>
        <span style={{ fontSize: '10px', color: '#666' }}>ID: {sid}</span>
      </div>
      <GameCanvas />
    </div>
  );
}