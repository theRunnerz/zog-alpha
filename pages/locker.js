import { useState } from 'react';
import Link from 'next/link';
import { CHARACTERS } from '../data/characters';
import { getSessionId } from '../lib/session';

export default function Locker() {
  const [selectedChar, setSelectedChar] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Start Chat Session
  const selectCharacter = (key) => {
    setSelectedChar(key);
    setMessages([{ role: 'ai', text: `*${CHARACTERS[key].name} stares at you.*` }]);
  };

  // Send Message Logic
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          characterId: selectedChar,
          sessionId: getSessionId() + selectedChar 
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Connection Error." }]);
    }
    setLoading(false);
  };

  return (
    // ✅ FORCE SCROLL CONTAINER
    // 'fixed' breaks it out of the flexbox trap
    // 'overflowY: scroll' forces the scrollbar to appear
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      background: '#111', 
      overflowY: 'scroll', 
      WebkitOverflowScrolling: 'touch',
      zIndex: 1000 
    }}>
      
      <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          <Link href="/" style={{ marginRight: '20px', fontSize: '20px', textDecoration: 'none' }}>🏠 Home</Link>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>MY LOCKER</h1>
        </div>

        {/* 1. CHARACTER GRID */}
        {!selectedChar && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: '20px'
          }}>
            {Object.entries(CHARACTERS).map(([key, char]) => (
              <div 
                key={key} 
                onClick={() => selectCharacter(key)}
                style={{ 
                  border: '1px solid #333', borderRadius: '10px', overflow: 'hidden', 
                  cursor: 'pointer', background: '#222', textAlign: 'center' 
                }}
              >
                <img src={char.img} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                <div style={{ padding: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{char.name}</h3>
                  <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#888' }}>{char.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. CHAT INTERFACE */}
        {selectedChar && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '80vh', // Fixed height chat window
            border: '1px solid #333',
            borderRadius: '10px',
            background: '#000',
            overflow: 'hidden'
          }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#222', padding: '10px' }}>
              <button onClick={() => setSelectedChar(null)} style={{ marginRight: '15px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor:'pointer' }}>←</button>
              <img src={CHARACTERS[selectedChar].img} style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px', border: '1px solid #0f0' }} />
              <div>
                <div style={{ fontWeight: 'bold', color: '#fff' }}>{CHARACTERS[selectedChar].name}</div>
                <div style={{ fontSize: '11px', color: '#0f0' }}>● ONLINE</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ 
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.role === 'user' ? '#7928CA' : '#222',
                  padding: '12px 16px',
                  borderRadius: '15px',
                  color: '#fff',
                  fontSize: '15px',
                  lineHeight: '1.4'
                }}>
                  {m.text}
                </div>
              ))}
              {loading && <div style={{ color: '#0f0', fontSize: '12px' }}>Typing...</div>}
            </div>

            {/* Input */}
            <div style={{ padding: '10px', background: '#222', display: 'flex' }}>
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message..."
                style={{ flex: 1, padding: '15px', background: '#111', border: '1px solid #444', color: '#fff', borderRadius: '30px', outline: 'none', fontSize: '16px' }}
              />
              <button 
                onClick={handleSend}
                disabled={loading}
                style={{ marginLeft: '10px', padding: '0 20px', background: '#0f0', color: '#000', border: 'none', borderRadius: '30px', fontWeight: 'bold' }}
              >
                ➤
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}