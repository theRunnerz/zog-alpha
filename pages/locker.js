/* pages/locker.js - Forced Layout Version */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home, Zap, Activity } from 'lucide-react';
import { useTron } from '../hooks/useTron';
import ScoreGauge from '../components/ScoreGauge';
import { CHARACTERS } from '../data/characters';

export default function LockerRoom() {
  const { address, connect } = useTron();
  
  // State
  const [activeView, setActiveView] = useState(null); // null = Grid, "ID" = Chat
  const [equippedId, setEquippedId] = useState("PinkerTape");

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      
      {/* HEADER */}
      <nav className="flex sticky top-0 bg-neutral-900 border-b border-neutral-800 p-4 z-50 justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveView(null)} className="hover:text-green-500">
             <Home size={24} />
          </button>
          <span className="font-bold tracking-widest">MY LOCKER</span>
        </div>
        <div className="flex items-center gap-4">
           {equippedId && <span className="text-xs text-green-500 font-mono hidden md:block">EQUIPPED: {equippedId}</span>}
           <button onClick={connect} className={`px-4 py-2 rounded text-xs font-bold uppercase ${address ? 'bg-neutral-800 text-green-500' : 'bg-green-600 text-black'}`}>
             {address ? "Scan Ready" : "Connect"}
           </button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="p-6 max-w-6xl mx-auto">
        
        {/* VIEW 1: THE GRID (Forced Styles) */}
        {!activeView ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {Object.entries(CHARACTERS).map(([id, char]) => (
              <motion.div 
                key={id} 
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveView(id)}
                className={`cursor-pointer bg-neutral-900 rounded-2xl overflow-hidden border-2 ${equippedId === id ? 'border-green-500' : 'border-neutral-800'}`}
              >
                {/* FORCE IMAGE SIZE */}
                <img 
                  src={char.img} 
                  style={{ width: '100%', height: '250px', objectFit: 'cover' }} 
                  alt={char.name}
                />
                <div className="p-4 text-center">
                  <h3 className="font-black uppercase text-xl">{char.name}</h3>
                  <p className="text-gray-500 text-xs uppercase">{char.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* VIEW 2: ACTIVE COACH */
          <ActiveCoachView 
            charId={activeView} 
            address={address}
            onBack={() => setActiveView(null)}
            isEquipped={equippedId === activeView}
            onEquip={() => setEquippedId(activeView)}
          />
        )}

      </main>
    </div>
  );
}

// --- SUB-COMPONENT ---
function ActiveCoachView({ charId, address, onBack, isEquipped, onEquip }) {
  const char = CHARACTERS[charId];
  const scrollRef = useRef(null);
  
  const [messages, setMessages] = useState([{ role: 'system', content: char.systemPrompt }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanData, setScanData] = useState(null);

  // Auto Scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, scanData]);

  // Send Logic
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
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // Scan Logic
  const scan = async () => {
    if (!address) return alert("Connect Wallet!");
    setLoading(true);
    setMessages(prev => [...prev, { role: 'system', content: "Reading Blockchain..." }]);
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

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[80vh]">
      
      {/* Left Panel: Stats & Image */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl text-center">
           <img 
             src={char.img} 
             style={{ width: '150px', height: '150px', objectFit: 'cover' }} 
             className="mx-auto rounded-full border-4 border-neutral-800 mb-4" 
           />
           <h2 className="text-2xl font-black">{char.name}</h2>
           
           <div className="flex gap-2 mt-4 justify-center">
              <button onClick={onBack} className="p-2 bg-neutral-800 rounded"><ArrowLeft/></button>
              <button onClick={onEquip} disabled={isEquipped} className={`px-4 py-2 rounded text-xs font-bold uppercase ${isEquipped ? 'bg-green-500 text-black' : 'bg-white text-black'}`}>
                {isEquipped ? "Equipped" : "Equip"}
              </button>
           </div>
        </div>

        {/* Scan Results */}
        {scanData && (
          <div className="bg-neutral-900 border border-green-900 p-4 rounded-3xl flex-1">
             <div className="h-32 mb-2"><ScoreGauge score={scanData.score} /></div>
             <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(scanData.breakdown).map(([k,v]) => (
                   <div key={k} className="bg-black p-2 rounded flex justify-between">
                     <span className="uppercase text-gray-500">{k.slice(0,4)}</span>
                     <span className="font-mono text-green-400">{v}</span>
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Right Panel: Chat */}
      <div className="flex-1 bg-neutral-900 rounded-3xl border border-neutral-800 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
           {messages.map((m,i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-xl max-w-[80%] text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : m.role === 'system' ? 'text-gray-500 italic text-center w-full bg-transparent' : 'bg-neutral-800 text-gray-200'}`}>
                  {m.content}
                </div>
             </div>
           ))}
           {loading && <div className="text-center text-green-500 text-xs animate-pulse">Thinking...</div>}
        </div>
        
        <div className="p-3 bg-black flex gap-2">
           <button onClick={scan} className="p-3 bg-green-900/30 text-green-500 rounded-lg"><Activity size={20}/></button>
           <input 
             className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 text-white"
             placeholder="Message..."
             value={input}
             onChange={e => setInput(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && send()}
           />
           <button onClick={send} className="p-3 bg-white text-black rounded-lg"><Zap size={20} fill="black"/></button>
        </div>
      </div>

    </div>
  );
}