'use client';

import { useState } from 'react';
import { connectWallet } from '../lib/tron';

export default function Header() {
  const [address, setAddress] = useState(null);

  const handleConnect = async () => {
    const addr = await connectWallet();
    if (addr) {
      setAddress(addr);
    } else {
      alert("TronLink not found. Please install TronLink or open in a dApp browser.");
    }
  };

  return (
    <header style={{ 
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px',
      borderBottom: '1px solid #333'
    }}>
      <div style={{ fontWeight: 'bold', color: '#0f0' }}>ZOGS</div>

      {address ? (
        <div style={{
          fontSize: '12px',
          background: '#222',
          padding: '5px 10px',
          borderRadius: '15px'
        }}>
          {address.slice(0, 4)}...{address.slice(-4)}
        </div>
      ) : (
        <button
          onClick={handleConnect}
          style={{
            fontSize: '12px',
            background: 'transparent',
            border: '1px solid white',
            borderRadius: '15px',
            padding: '5px 10px',
            cursor: 'pointer'
          }}
        >
          Connect Wallet
        </button>
      )}
    </header>
  );
}
