/* pages/locker.js - Restored Grid Layout */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home, Zap, Activity } from 'lucide-react';
import Link from 'next/link'; 
import { useTron } from '../hooks/useTron';
import ScoreGauge from '../components/ScoreGauge';
import { CHARACTERS } from '../data/characters';

export default function LockerRoom() {
  const { address, connect } = useTron();
  
  const [activeView, setActiveView] = useState(null); // null = Grid, "ID" = Chat
  const [equippedId, setEquippedId] = useState("PinkerTape");

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-green-500 selection:text-black">
      
      {/* HEADER: Matches your 'Good' screenshot */}
      <nav className="flex sticky top-0 bg-black/90 border-b border-neutral-900 px-8 py-5 z-50 justify-between items-center backdrop-blur">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-neutral-400 hover:text-white transition-colors">
             <Home size={22} />
          </Link>
          <span className="font-bold tracking-tight text-lg uppercase text-white">MY LOCKER</span>
        </div>
        <div className="flex items-center gap-4">
           {equippedId && (
             <div className="hidden md:block px-3 py-1 rounded bg-green-900/30 border border-green-500/30 text-[10px] font-bold text-green-400 uppercase tracking-widest">
               PLAYING AS: <span className="text-white">{equippedId}</span>
             </div>
           )}
           <button 
             onClick={connect} 
             className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
               address 
               ? 'bg-neutral-900 text-neutral-400 cursor-default' 
               : 'bg-white text-black hover:bg-gray-200'
             }`}
           >
             {address ? "CONNECTED" : "CONNECT WALLET"}
           </button>
        </div>
      </nav>

      {/* BODY */}
      <main className="p-8 max-w-7xl mx-auto">
        
        {/* VIEW 1: THE FOUR CARD GRID */}
        {!activeView ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(CHARACTERS).map(([id, char]) => (
              <motion.div 
                key={id} 
                whileHover={{ y: -5 }}
                onClick={() => setActiveView(id)}
                className={`relative group cursor-pointer bg-neutral-900 rounded-xl overflow-hidden border transition-all duration-300 ${
                  equippedId === id 
                    ? 'border-green-500 ring-1 ring-green-500' 
                    : 'border-neutral-800 hover:border-neutral-600'
                }`}
              >
                {/* Image Container */}
                <div className="aspect-square w-full bg-neutral-800 relative">
                  <img 
                    src={char.img} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    alt={char.name}
                  />
                  {equippedId === id && (
                     <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                       EQUIPPED
                     </div>
                  )}
                </div>
                
                {/* Text Footer */}
                <div className="p-4 text-center bg-neutral-900">
                  <h3 className="font-black uppercase text-lg text-white mb-1 leading-none">{char.name}</h3>
                  <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-medium">{char.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* VIEW 2: ACTIVE COACH DASHBOARD */
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
        console.error(e);
        setMessages(prev => [...prev, { role: 'assistant', content: "Error: Neural Link Failed." }]);
    }
    setLoading(false);
  };

  const scan = async () => {
    if (!address) return alert("Connect Wallet!");
    setLoading(true);
    setMessages(prev => [...prev, { role: 'system', content: "Scanning On-Chain Data..." }]);
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row gap-8 min-h-[600px] items-stretch"
    >
      
      {/* SIDEBAR: Stats & Info */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center relative overflow-hidden">
           <button onClick={onBack} className="absolute left-4 top-4 text-neutral-500 hover:text-white"><ArrowLeft size={20}/></button>
           
           <img 
             src={char.img} 
             className="w-40 h-40 mx-auto rounded-full border-4 border-neutral-800 object-cover mb-6 shadow-2xl" 
           />
           <h2 className="text-3xl font-black uppercase leading-none mb-2">{char.name}</h2>
           <p className="text-green-500 text-xs font-mono uppercase mb-6">{char.role}</p>
           
           <button 
             onClick={onEquip} 
             disabled={isEquipped}
             className={`w-full py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all ${
               isEquipped 
               ? 'bg-green-500 text-black cursor-default' 
               : 'bg-white text-black hover:bg-neutral-200'
             }`}
           >
             {isEquipped ? "Currently Equipped" : "Equip As Coach"}
           </button>
        </div>

        {/* METRICS PANEL (Shows after scan) */}
        {scanData && (
          <div className="bg-neutral-900 border border-green-500/30 p-6 rounded-2xl flex-1 animate-pulse-once">
             <div className="flex justify-center mb-6 h-32">
                <ScoreGauge score={scanData.score} />
             </div>
             <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(scanData.breakdown).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center bg-black/50 p-2 rounded border border-neutral-800">
                    <span className="text-gray-500 uppercase">{k.slice(0,4)}</span>
                    <span className="font-mono font-bold text-white">{v}</span>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* MAIN: Chat Interface */}
      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                 m.role === 'user' 
                   ? 'bg-blue-600 text-white rounded-br-none' 
                   : m.role === 'system'
                     ? 'w-full text-center text-[10px] text-neutral-500 font-mono  bg-transparent'
                     : 'bg-neutral-800 border border-neutral-700 text-gray-200 rounded-bl-none'
               }`}>
                 {m.content}
               </div>
            </div>
          ))}
          {loading && <div className="text-center text-[10px] text-green-500 animate-pulse font-mono mt-2">UPLOADING TO ALIEN MIND...</div>}
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-black border-t border-neutral-800 flex gap-3">
           <button 
             onClick={scan}
             className="p-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl hover:bg-green-500 hover:text-black transition-colors"
             title="Run Scan"
           >
             <Activity size={20} />
           </button>
           <input 
             className="flex-1 bg-neutral-900 border-none rounded-xl px-4 text-white placeholder-neutral-600 focus:ring-1 focus:ring-green-500"
             placeholder={`Send message to ${char.name}...`}
             value={input}
             onChange={e => setInput(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && send()}
           />
           <button 
             onClick={send}
             className="p-3 bg-white text-black rounded-xl hover:bg-neutral-200"
           >
             <Zap size={20} fill="currentColor" />
           </button>
        </div>
      </div>
    </motion.div>
  );
}