/* pages/index.js - Fixed Home Page */
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTron } from '../hooks/useTron';

export default function Home() {
  const { address, connect } = useTron();
  
  // Mobile Scroll Fix: minHeight 100vh (grows), height auto (scrolls)
  const pageStyle = {
    backgroundColor: 'black',
    color: 'white',
    minHeight: '100vh', 
    height: 'auto', 
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'sans-serif',
    overflowY: 'auto', // Force scroll capability
    overflowX: 'hidden'
  };

  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #333'
  };

  const btnStyle = {
    padding: '10px 20px',
    borderRadius: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    background: 'transparent',
    border: '1px solid white',
    color: 'white', /* FORCE WHITE TEXT */
    fontSize: '14px'
  };

  return (
    <div style={pageStyle}>
      
      {/* Navbar with Fixed Button Text */}
      <nav style={navStyle}>
        <div style={{ fontWeight: 'bold', color: '#0f0', fontSize: '20px' }}>ZOGS</div>
        
        <button onClick={connect} style={btnStyle}>
          {address ? "✅ CONNECTED" : "CONNECT WALLET"}
        </button>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
        
        <h1 style={{ fontSize: '80px', margin: '0 0 10px 0', color: '#0f0', fontWeight: '900', letterSpacing: '-2px' }}>
          ZOGS
        </h1>
        
        <p style={{ fontSize: '18px', color: '#888', marginBottom: '50px' }}>
          Alien Arcade Sports on TRON
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '300px' }}>
          
          {/* Play Button */}
          <Link href="/play" style={{ textDecoration: 'none' }}>
            <button style={{ 
              width: '100%', padding: '20px', backgroundColor: '#7928CA', color: 'white', 
              border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' 
            }}>
              PLAY GAME 🕹️
            </button>
          </Link>

          {/* Locker Button */}
          <Link href="/locker" style={{ textDecoration: 'none' }}>
            <button style={{ 
              width: '100%', padding: '20px', backgroundColor: '#1a1a1a', color: '#0f0', 
              border: '2px solid #0f0', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' 
            }}>
              MY WALLET 💼
            </button>
          </Link>

        </div>
      </main>

      {/* Footer (To show scrolling works) */}
      <footer style={{ padding: '20px', textAlign: 'center', color: '#444', fontSize: '12px' }}>
        <p>Built for TRON Hackathon Season 7</p>
      </footer>

    </div>
  );
}