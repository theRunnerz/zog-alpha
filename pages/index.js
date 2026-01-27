import Link from 'next/link';
import Header from '../components/Header';

export default function Home() {
  return (
    <main>
      <Header />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h1 style={{ fontSize: '4rem', margin: '0 0 20px 0' }}>👽 ZOGS</h1>
        <p>Tap the alien. Don't miss.</p>
        <Link href="/play">
          <button style={{ 
            marginTop: '30px', 
            padding: '20px 60px', 
            fontSize: '24px', 
            background: '#7928CA', 
            border: 'none', 
            borderRadius: '50px',
            cursor: 'pointer' 
          }}>
            PLAY NOW
          </button>
        </Link>
      </div>
      // ... existing imports + Link
// inside Home() return:

      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        <Link href="/play">
          <button style={{ 
            padding: '20px 40px', fontSize: '24px', background: '#7928CA', border: 'none', borderRadius: '50px', cursor: 'pointer', color: 'white' 
          }}>
            PLAY GAME
          </button>
        </Link>
        <Link href="/locker">
          <button style={{ 
            padding: '20px 40px', fontSize: '24px', background: '#333', border: '2px solid #555', borderRadius: '50px', cursor: 'pointer', color: 'white'
          }}>
             MY WALLET
          </button>
        </Link>
      </div>

    </main>
  );
}