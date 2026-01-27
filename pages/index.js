import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';

export default function Home() {
  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Zogs: Alien Sports</title>
        <meta name="description" content="Play Zogs - The viral alien sports game." />
      </Head>

      <Header />

      <main style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        paddingtop: '50px',
        textAlign: 'center' 
      }}>
        
        {/* HERO TITLE */}
        <h1 style={{ fontSize: '4rem', margin: '50px 0 10px', color: '#0f0', letterSpacing: '-2px' }}>
          ZOGS
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#888', marginBottom: '40px' }}>
          Alien Arcade Sports on TRON
        </p>

        {/* --- THE BUTTONS --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '300px' }}>
          
          {/* 1. PLAY GAME BUTTON */}
          <Link href="/play" style={{ width: '100%' }}>
            <button style={{ 
              width: '100%',
              padding: '20px', 
              fontSize: '20px', 
              fontWeight: 'bold',
              background: '#7928CA', 
              border: 'none', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              color: 'white',
              boxShadow: '0 4px 0 #5a1e96'
            }}>
              PLAY GAME 🕹️
            </button>
          </Link>

          {/* 2. MY WALLET BUTTON (NEW) */}
          <Link href="/locker" style={{ width: '100%' }}>
            <button style={{ 
              width: '100%',
              padding: '20px', 
              fontSize: '20px', 
              fontWeight: 'bold',
              background: '#222', 
              border: '2px solid #0f0', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              color: '#0f0',
              boxShadow: '0 4px 0 #004400'
            }}>
              MY WALLET 💼
            </button>
          </Link>

        </div>

      </main>
    </div>
  );
}