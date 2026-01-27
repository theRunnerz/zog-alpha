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
          sessionId: getSessionId() + selectedChar // Unique session per char
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
    <div style={{ minHeight: '100vh', padding: '20px', background: '#111', color: '#fff' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
        <Link href="/" style={{ marginRight: '20px', fontSize: '20px' }}>← Home</Link>
        <h1 style={{ margin: 0, fontSize: '24px' }}>MY LOCKER (NFTs)</h1>
      </div>

      {/* 1. CHARACTER GRID */}
      {!selectedChar && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
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
                <h3 style={{ margin: 0, fontSize: '16px' }}>{char.name}</h3>
                <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#888' }}>{char.role}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. CHAT INTERFACE */}
      {selectedChar && (
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '80vh' }}>
          
          {/* Active Character Header */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#222', padding: '15px', borderRadius: '10px 10px 0 0', border: '1px solid #333' }}>
            <button onClick={() => setSelectedChar(null)} style={{ marginRight: '15px', background: 'none', border: 'none', color: '#666', fontSize: '20px', cursor:'pointer' }}>✕</button>
            <img 
              src={CHARACTERS[selectedChar].img} 
              style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }} 
            />
            <div>
              <div style={{ fontWeight: 'bold' }}>{CHARACTERS[selectedChar].name}</div>
              <div style={{ fontSize: '12px', color: '#0f0' }}>● Use Brain</div>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#000', borderX: '1px solid #333', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ 
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                background: m.role === 'user' ? '#7928CA' : '#222',
                padding: '10px 15px',
                borderRadius: '15px',
                color: '#fff',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {m.text}
              </div>
            ))}
            {loading && <div style={{ color: '#666', fontSize: '12px', fontStyle: 'italic' }}>Thinking...</div>}
          </div>

          {/* Input Area */}
          <div style={{ display: 'flex', padding: '10px', background: '#222', borderRadius: '0 0 10px 10px', border: '1px solid #333' }}>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Message ${CHARACTERS[selectedChar].name}...`}
              style={{ flex: 1, padding: '10px', background: '#000', border: 'none', color: '#fff', borderRadius: '5px', outline: 'none' }}
            />
            <button 
              onClick={handleSend}
              style={{ marginLeft: '10px', padding: '10px 20px', background: '#0f0', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              SEND
            </button>
          </div>

        </div>
      )}
    </div>
  );
}