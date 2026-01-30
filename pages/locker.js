/* pages/locker.js - Grid Layout Version */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Activity, Zap, ArrowLeft, Home, Trophy } from 'lucide-react';
import { useTron } from '../hooks/useTron';
import ScoreGauge from '../components/ScoreGauge';
import { CHARACTERS } from '../data/characters';

export default function LockerRoom() {
  const { address, connect } = useTron();
  
  // View State: null = "Grid View", string = "Specific Character ID"
  const [activeView, setActiveView] = useState(null); 
  const [equippedId, setEquippedId] = useState("PinkerTape"); // Default equipped from screenshot

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-green-500 selection:text-black">
      
      {/* HEADER */}
      <nav className="flex justify-between items-center p-6 border-b border-neutral-900 bg-black/50 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveView(null)} className="hover:text-green-500 transition">
             <Home size={20} />
          </button>
          <h1 className="text-xl font-bold tracking-tighter uppercase">MY LOCKER</h1>
        </div>
        
        <div className="flex items-center gap-4">
           {equippedId && (
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-900/20 border border-green-500/30 rounded text-green-400 text-xs font-mono font-bold uppercase">
               <span>Playing as: {CHARACTERS[equippedId]?.name}</span>
             </div>
           )}
           <button 
             onClick={connect}
             className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider ${
               address ? 'bg-neutral-800 text-green-500' : 'bg-green-600 text-black hover:bg-green-500'
             }`}
           >
             {address ? "Connected" : "Connect Wallet"}
           </button>
        </div>
      </nav>

      {/* BODY CONTENT */}
      <main className="p-6 md:p-12 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* VIEW 1: THE GRID (Matches Screenshot 2) */}
          {!activeView ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
            >
              {Object.entries(CHARACTERS).map(([id, char]) => (
                <div 
                  key={id} 
                  onClick={() => setActiveView(id)}
                  className={`relative group cursor-pointer bg-neutral-900 rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-900/20 ${
                    equippedId === id ? 'border-green-500 ring-1 ring-green-500' : 'border-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  {/* Image Area */}
                  <div className="aspect-square w-full overflow-hidden bg-neutral-800">
                    <img 
                      src={char.img} 
                      alt={char.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                  </div>
                  
                  {/* Footer Area */}
                  <div className="p-4 bg-neutral-900 flex flex-col items-center">
                    <h2 className="text-lg font-black tracking-tight uppercase group-hover:text-green-400 transition-colors">
                      {char.name}
                    </h2>
                    {equippedId === id && (
                      <span className="mt-1 text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded">
                        Equipped
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            
            /* VIEW 2: THE COMMAND CENTER (Chat & Scan) */
            <ActiveCoachView 
              key="active" 
              charId={activeView} 
              onBack={() => setActiveView(null)} 
              address={address}
              isEquipped={equippedId === activeView}
              onEquip={() => setEquippedId(activeView)}
            />
          )}

        </AnimatePresence>
      </main>

    </div>
  );
}

// --- SUB-COMPONENT: The Chat/Scan Interface ---
function ActiveCoachView({ charId, onBack, address, isEquipped, onEquip }) {
  const char = CHARACTERS[charId];
  const scrollRef = useRef(null);

  // Local State for this view
  const [messages, setMessages] = useState([{ role: 'system', content: char.systemPrompt }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanData, setScanData] = useState(null);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, scanData]);

  // Handler: Send Message
  const send = async () => {
    if (!input.trim()) return;
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

  // Handler: Scan
  const scan = async () => {
    if (!address) return alert("Connect Wallet!");
    setLoading(true);
    setMessages(prev => [...prev, { role: 'system', content: "⚡ Running Portfolio Analysis..." }]);
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
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col md:flex-row gap-6 h-[80vh]"
    >
      
      {/* LEFT: Character Card & Stats */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 text-center relative overflow-hidden">
           <img src={char.img} className="w-40 h-40 mx-auto rounded-full border-4 border-neutral-800 object-cover mb-4 shadow-xl" />
           <h2 className="text-2xl font-black uppercase text-white mb-1">{char.name}</h2>
           <p className="text-green-500 font-mono text-xs uppercase mb-6">{char.role}</p>
           
           <div className="flex gap-2 justify-center">
             <button onClick={onBack} className="p-3 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition">
               <ArrowLeft size={20} />
             </button>
             <button 
               onClick={onEquip}
               disabled={isEquipped}
               className={`flex-1 py-3 px-4 rounded-xl font-bold uppercase text-xs tracking-wider transition ${
                 isEquipped ? 'bg-green-500 text-black cursor-default' : 'bg-white text-black hover:bg-neutral-200'
               }`}
             >
               {isEquipped ? "Equipped" : "Equip Coach"}
             </button>
           </div>
        </div>

        {/* Scan Results (Only appears after scan) */}
        {scanData && (
          <div className="bg-neutral-900 rounded-3xl p-4 border border-green-500/30 flex-1 overflow-y-auto">
             <div className="h-40 flex justify-center items-center mb-2">
                <ScoreGauge score={scanData.score} />
             </div>
             <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(scanData.breakdown).map(([k, v]) => (
                  <div key={k} className="bg-neutral-950 p-2 rounded border border-neutral-800 flex justify-between">
                    <span className="uppercase text-gray-500">{k.slice(0,4)}</span>
                    <span className="font-mono font-bold text-green-400">{v}</span>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* RIGHT: Chat Interface */}
      <div className="flex-1 bg-neutral-900 rounded-3xl border border-neutral-800 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                 m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 
                 m.role === 'system' ? 'w-full text-center text-gray-500 text-xs italic bg-transparent' :
                 'bg-neutral-800 text-gray-200 rounded-bl-none border border-neutral-700'
               }`}>
                 {m.content}
               </div>
            </div>
          ))}
          {loading && <div className="text-center text-xs text-green-500 animate-pulse">Typing...</div>}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-black/30 border-t border-neutral-800 flex gap-3">
           <button onClick={scan} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-black transition">
             <Activity size={20} />
           </button>
           <input 
             value={input}
             onChange={e => setInput(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && send()}
             placeholder="Type a message..."
             className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 text-white focus:outline-none focus:border-green-500"
           />
           <button onClick={send} className="p-3 bg-white text-black rounded-xl hover:bg-gray-200 transition">
             <Zap size={20} fill="currentColor" />
           </button>
        </div>
      </div>

    </motion.div>
  );
}