import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CHARACTERS } from '../data/characters';
import { getSessionId } from '../lib/session';

export default function Locker() {
  const [selectedChar, setSelectedChar] = useState(null);
  const [activeCharId, setActiveCharId] = useState(null); // Track who is equipped
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load equipped char on mount
  useEffect(() => {
    const saved = localStorage.getItem('zogs_active_char');
    if (saved) setActiveCharId(saved);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => scrollToBottom(), [messages]);

  // Load Character Chat
  const selectCharacter = (key) => {
    setSelectedChar(key);
    const savedMemory = localStorage.getItem(`zogs_memory_${key}`);
    if (savedMemory) {
      setMessages(JSON.parse(savedMemory));
    } else {
      setMessages([{ role: 'ai', text: `*${CHARACTERS[key].name} stares at you.*` }]);
    }
  };

  // EQUIP FUNCTION
  const equipCharacter = () => {
    localStorage.setItem('zogs_active_char', selectedChar);
    setActiveCharId(selectedChar);
    alert(`${CHARACTERS[selectedChar].name} is now your ACTIVE PLAYER! Go play the game.`);
  };

  const saveMemory = (key, msgs) => {
    localStorage.setItem(`zogs_memory_${key}`, JSON.stringify(msgs));
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    const newHistory = [...messages, { role: 'user', text: userMsg }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          characterId: selectedChar,
          history: newHistory.slice(-20)
        })
      });
      const data = await res.json();
      const finalHistory = [...newHistory, { role: 'ai', text: data.reply }];
      setMessages(finalHistory);
      saveMemory(selectedChar, finalHistory);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "(Connection Error)" }]);
    }
    setLoading(false);
  };

  const clearMemory = () => {
    if(!confirm("Wipe this Alien's memory?")) return;
    localStorage.removeItem(`zogs_memory_${selectedChar}`);
    setMessages([{ role: 'ai', text: `*${CHARACTERS[selectedChar].name} resets.*` }]);
  };

  // UI
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#111', overflowY: 'scroll', WebkitOverflowScrolling: 'touch', zIndex: 1000 }}>
      <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center'}}>
             <Link href="/" style={{ marginRight: '20px', fontSize: '20px', textDecoration: 'none' }}>🏠</Link>
             <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>MY LOCKER</h1>
          </div>
          {activeCharId && (
            <div style={{ fontSize:'12px', border:'1px solid #0f0', padding:'5px', borderRadius:'5px', color:'#0f0'}}>
              PLAYING AS: <b>{CHARACTERS[activeCharId]?.name}</b>
            </div>
          )}
        </div>

        {!selectedChar && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
            {Object.entries(CHARACTERS).map(([key, char]) => (
              <div key={key} onClick={() => selectCharacter(key)} style={{ border: key === activeCharId ? '2px solid #0f0' : '1px solid #333', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#222', textAlign: 'center' }}>
                <img src={char.img} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                <div style={{ padding: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{char.name}</h3>
                  {key === activeCharId && <div style={{color:'#0f0', fontSize:'10px', fontWeight:'bold'}}>EQUIPPED</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedChar && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '80vh', border: '1px solid #333', borderRadius: '10px', background: '#000', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#222', padding: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={() => setSelectedChar(null)} style={{ marginRight: '15px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor:'pointer' }}>←</button>
                <img src={CHARACTERS[selectedChar].img} style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px', border: '1px solid #0f0' }} />
                <div>
                  <div style={{ fontWeight: 'bold', color: '#fff' }}>{CHARACTERS[selectedChar].name}</div>
                  <div style={{ fontSize: '11px', color: '#0f0' }}>● ONLINE</div>
                </div>
              </div>
              
              {/* EQUIP BUTTON */}
              <div style={{ display:'flex', gap:'10px'}}>
                <button onClick={equipCharacter} style={{ background: '#0f0', border: 'none', color: '#000', fontSize: '11px', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' }}>
                  EQUIP ⚡
                </button>
                <button onClick={clearMemory} style={{ background: 'none', border: '1px solid #444', color: '#666', fontSize: '10px', padding: '5px', borderRadius: '5px', cursor: 'pointer' }}>
                  WIPE
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: m.role === 'user' ? '#7928CA' : '#222', padding: '12px 16px', borderRadius: '15px', color: '#fff', fontSize: '15px', lineHeight: '1.4' }}>{m.text}</div>
              ))}
              {loading && <div style={{ color: '#0f0', fontSize: '12px' }}>Typing...</div>}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '10px', background: '#222', display: 'flex' }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Message..." style={{ flex: 1, padding: '15px', background: '#111', border: '1px solid #444', color: '#fff', borderRadius: '30px', outline: 'none', fontSize: '16px' }} />
              <button onClick={handleSend} disabled={loading} style={{ marginLeft: '10px', padding: '0 20px', background: '#0f0', color: '#000', border: 'none', borderRadius: '30px', fontWeight: 'bold' }}>➤</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}