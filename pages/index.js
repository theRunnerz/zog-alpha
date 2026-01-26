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
    </main>
  );
}