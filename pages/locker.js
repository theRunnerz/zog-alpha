/* pages/locker.js - Scrollable Fixed Version */
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Zap, Activity } from 'lucide-react';
import Link from 'next/link'; 
import { useTron } from '../hooks/useTron';
import ScoreGauge from '../components/ScoreGauge';
import { CHARACTERS } from '../data/characters';

export default function LockerRoom() {
  const { address, connect } = useTron();
  
  const [activeView, setActiveView] = useState(null); // null = Grid, "ID" = Chat
  const [equippedId, setEquippedId] = useState("PinkerTape");

  // --- STYLES ---
  const styles = {
    page: { 
      backgroundColor: '#000000', 
      minHeight: '100vh', 
      color: 'white', 
      fontFamily: 'sans-serif',
      overflowX: 'hidden' // Prevent side-scroll
    },
    nav: { 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      padding: '20px', borderBottom: '1px solid #333', backgroundColor: '#111', 
      position: 'sticky', top: 0, zIndex: 50 
    },
    grid: {
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
      gap: '24px', 
      padding: '40px',
      maxWidth: '1200px',
      margin: '0 auto',
      paddingBottom: '100px' // Extra space at bottom for scrolling
    },
    card: {
      backgroundColor: '#1a1a1a', borderRadius: '16px', border: '1px solid #333', 
      overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease'
    },
    imageContainer: { width: '100%', height: '300px', overflow: 'hidden', backgroundColor: '#222' },
    image: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    cardText: { padding: '20px', textAlign: 'center' }
  };

  return (
    <div style={styles.page}>
      
      {/* HEADER */}
      <nav style={styles.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>
            <Home size={24} />
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '1px', margin: 0 }}>MY LOCKER</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
           {equippedId && (
             <div style={{ 
               backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #166534', 
               padding: '5px 12px', borderRadius: '6px', fontSize: '10px', 
               color: '#4ade80', fontWeight: 'bold', textTransform: 'uppercase' 
             }}>
                Playing As: {equippedId}
             </div>
           )}
           <button 
             onClick={connect} 
             style={{ 
               backgroundColor: address ? '#333' : '#16a34a', 
               color: address ? '#4ade80' : '#000',
               border: 'none', padding: '10px 20px', borderRadius: '8px', 
               fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase'
             }}
           >
             {address ? "Wallet Connected" : "Connect"}
           </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main>
        
        {!activeView ? (
          /* --- GRID VIEW --- */
          <div style={styles.grid}>
            {Object.entries(CHARACTERS).map(([id, char]) => (
              <motion.div 
                key={id} 
                whileHover={{ y: -5, borderColor: '#22c55e' }}
                onClick={() => setActiveView(id)}
                style={{ 
                  ...styles.card, 
                  border: equippedId === id ? '2px solid #22c55e' : '1px solid #333' 
                }}
              >
                <div style={styles.imageContainer}>
                  <img src={char.img} style={styles.image} alt={char.name} />
                </div>
                <div style={styles.cardText}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'black', textTransform: 'uppercase' }}>{char.name}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>{char.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* --- CHAT VIEW --- */
          <ActiveCoachView 
            charId={activeView} 
            address={address}
            onBack={() => setActiveView(null)}
            isEquipped={equippedId === activeView}
            onEquip={() => {
              setEquippedId(activeView);
              localStorage.setItem('zogs_active_char', activeView); // Save to storage
            }}
          />
        )}

      </main>
    </div>
  );
}

// --- SUB-COMPONENT: Chat & Scan ---
function ActiveCoachView({ charId, address, onBack, isEquipped, onEquip }) {
  const char = CHARACTERS[charId];
  const scrollRef = useRef(null);
  
  const [messages, setMessages] = useState([{ role: 'system', content: char.systemPrompt }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanData, setScanData] = useState(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, scanData]);

  // CHAT LOGIC
  const send = async () => {
    if (!input) return;
    const newMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: charId, messages: [...messages, newMsg], wallet: address })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e) { 
        setMessages(prev => [...prev, { role: 'assistant', content: "Error: Connection Failed." }]);
    }
    setLoading(false);
  };

  // SCAN LOGIC
  const scan = async () => {
    if (!address) return alert("Connect Wallet!");
    setLoading(true);
    setMessages(prev => [...prev, { role: 'system', content: "Scanning Blockchain..." }]);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, characterId: charId })
      });
      const data = await res.json();
      setScanData(data);
      setMessages(prev => [...prev, { role: 'assistant', content: data.feedback }]);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // LAYOUT
  const layoutStyle = {
    display: 'flex', 
    flexWrap: 'wrap', // Allow wrapping on mobile
    gap: '30px', 
    padding: '40px', 
    maxWidth: '1200px', 
    margin: '0 auto',
    height: 'calc(100vh - 80px)', 
    minHeight: '600px', // Prevent it from being too small
    alignItems: 'stretch'
  };

  // Mobile check (you can do this cleaner with CSS, but staying inline for safety)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{ 
      ...layoutStyle, 
      flexDirection: isMobile ? 'column' : 'row',
      height: isMobile ? 'auto' : layoutStyle.height 
    }}>
      
      {/* SIDEBAR (Stats) - Scrollable */}
      <div style={{ 
        width: isMobile ? '100%' : '350px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        overflowY: 'auto', // Enable scroll here
        maxHeight: isMobile ? 'none' : '100%'
      }}>
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '16px', padding: '30px', textAlign: 'center', position: 'relative' }}>
           <button onClick={onBack} style={{ position: 'absolute', top: '20px', left: '20px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
             <ArrowLeft size={24} />
           </button>
           
           <img src={char.img} style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #333', margin: '0 auto 20px auto' }} />
           <h2 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', margin: '0 0 10px 0' }}>{char.name}</h2>
           <p style={{ color: '#22c55e', fontSize: '12px', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '20px' }}>{char.role}</p>
           
           <button 
             onClick={onEquip} 
             disabled={isEquipped}
             style={{ 
               width: '100%', padding: '12px', borderRadius: '8px', 
               backgroundColor: isEquipped ? '#22c55e' : '#fff', color: '#000',
               border: 'none', fontWeight: 'bold', cursor: isEquipped ? 'default' : 'pointer', textTransform: 'uppercase' 
             }}
           >
             {isEquipped ? "Equipped" : "Equip Coach"}
           </button>
        </div>

        {scanData && (
          <div style={{ 
            flexShrink: 0, // Don't squash me
            backgroundColor: '#1a1a1a', border: '1px solid #166534', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column' 
          }}>
             <div style={{ height: '150px', marginBottom: '20px' }}><ScoreGauge score={scanData.score} /></div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {Object.entries(scanData.breakdown).map(([k, v]) => (
                  <div key={k} style={{ backgroundColor: '#000', padding: '10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', alignItems: 'center' }}>
                    <span style={{ color: '#666', textTransform: 'uppercase' }}>{k.slice(0,4)}</span>
                    <span style={{ color: '#22c55e', fontFamily: 'monospace' }}>{v}</span>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* CHAT BOX - Flexes to fill space */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '16px', 
        display: 'flex', flexDirection: 'column', 
        overflow: 'hidden',
        height: isMobile ? '500px' : 'auto' // Force height on mobile so it doesn't vanish
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }} ref={scrollRef}>
          {messages.map((m, i) => (
             <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  maxWidth: '80%', padding: '12px 18px', borderRadius: '12px', fontSize: '14px', lineHeight: '1.5',
                  backgroundColor: m.role === 'user' ? '#2563eb' : '#262626',
                  color: m.role === 'user' ? '#fff' : '#e5e5e5',
                  borderBottomRightRadius: m.role === 'user' ? '0' : '12px',
                  borderBottomLeftRadius: m.role === 'system' ? '0' : (m.role === 'user' ? '12px' : '0'),
                  width: m.role === 'system' ? '100%' : 'auto', textAlign: m.role === 'system' ? 'center' : 'left',
                  background: m.role === 'system' ? 'transparent' : undefined, color: m.role === 'system' ? '#666' : undefined
                }}>
                  {m.content}
                </div>
             </div>
          ))}
          {loading && <div style={{ textAlign: 'center', color: '#22c55e', fontSize: '12px', fontFamily: 'monospace' }}>THINKING...</div>}
        </div>

        <div style={{ padding: '20px', backgroundColor: '#000', borderTop: '1px solid #333', display: 'flex', gap: '10px' }}>
           <button onClick={scan} style={{ width: '50px', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #166534', borderRadius: '8px', color: '#22c55e', cursor: 'pointer' }}><Activity size={20}/></button>
           <input 
             style={{ flex: 1, backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', padding: '0 15px', color: 'white', outline: 'none' }}
             placeholder="Message..."
             value={input}
             onChange={e => setInput(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && send()}
           />
           <button onClick={send} style={{ width: '50px', backgroundColor: '#fff', border: 'none', borderRadius: '8px', color: '#000', cursor: 'pointer' }}><Zap size={20} fill="black"/></button>
        </div>
      </div>
    </div>
  );
}