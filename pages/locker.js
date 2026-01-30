/* pages/locker.js - The "Cannot Fail" Layout */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Activity, Zap, CheckCircle, Wallet, Menu } from 'lucide-react';
import { useTron } from '../hooks/useTron';
import ScoreGauge from '../components/ScoreGauge';
import { CHARACTERS } from '../data/characters';

export default function LockerRoom() {
  const { address, connect } = useTron();
  
  // State
  const [selectedCharId, setSelectedCharId] = useState("WALL");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [equippedId, setEquippedId] = useState(null);

  const activeChar = CHARACTERS[selectedCharId] || CHARACTERS["WALL"];
  const scrollRef = useRef(null);

  // Load History
  useEffect(() => {
    const saved = localStorage.getItem(`chat_history_${selectedCharId}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{ role: 'system', content: `System Online: ${activeChar.name}` }]);
    }
  }, [selectedCharId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, scanData]);

  // Action Logic
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const newMsg = { role: 'user', content: inputText };
    setMessages(prev => [...prev, newMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: selectedCharId, messages: [...messages, newMsg], wallet: address })
      });
      const data = await res.json();
      const botMsg = { role: 'assistant', content: data.reply };
      setMessages(prev => {
        const newer = [...prev, botMsg];
        localStorage.setItem(`chat_history_${selectedCharId}`, JSON.stringify(newer));
        return newer;
      });
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const handleScan = async () => {
    if (!address) return alert("Connect Wallet first!");
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'system', content: "Scanning Portfolio..." }]);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address, characterId: selectedCharId })
      });
      const data = await res.json();
      setScanData(data);
      setMessages(prev => [...prev, { role: 'assistant', content: data.feedback }]);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  return (
    // FORCE FLEX ROW via Inline Style to prevent stacking
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#000', color: 'white' }}>
      
      {/* === LEFT SIDEBAR === */}
      <div 
        className="border-r border-neutral-800 bg-neutral-900 flex flex-col"
        style={{ width: '260px', minWidth: '260px', height: '100%' }} // Fixed width
      >
        <div className="p-5 border-b border-neutral-800">
          <h1 className="text-xl font-bold text-green-500 tracking-tighter">ZOG ARENA</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {Object.entries(CHARACTERS).map(([id, char]) => (
            <button
              key={id}
              onClick={() => { setSelectedCharId(id); setScanData(null); }}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors text-left ${
                selectedCharId === id ? 'bg-neutral-800 border-l-4 border-green-500' : 'hover:bg-neutral-800/50 border-l-4 border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={char.img} className="w-8 h-8 rounded bg-neutral-700 object-cover" />
              <div>
                <div className="font-bold text-sm">{char.name}</div>
                <div className="text-[10px] uppercase text-gray-500">{char.role}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-neutral-800">
           <button onClick={connect} className={`w-full py-3 rounded-lg font-bold text-xs uppercase ${address ? 'bg-neutral-800 text-green-500' : 'bg-blue-600'}`}>
             {address ? "Wallet Connected" : "Connect Wallet"}
           </button>
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <div className="flex-1 flex flex-col bg-black relative" style={{ overflow: 'hidden' }}>
        
        {/* Top Header */}
        <div className="h-16 border-b border-neutral-800 flex justify-between items-center px-6 bg-neutral-900/50">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="font-mono text-sm text-gray-400">ONLINE: {activeChar.name}</span>
           </div>
           <button 
             onClick={() => setEquippedId(selectedCharId)}
             className="bg-white text-black px-4 py-1.5 rounded text-xs font-bold uppercase hover:scale-105 transition-transform"
           >
             {equippedId === selectedCharId ? "Equipped" : "Equip Coach"}
           </button>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
          <div className="max-w-2xl mx-auto space-y-8 pb-10">
            
            {/* CENTER IMAGE - Forced Size */}
            <div className="flex justify-center">
               <motion.div 
                 key={selectedCharId}
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }}
               >
                 <img 
                   src={activeChar.img} 
                   alt="Character"
                   // This style prevents the giant image issue
                   style={{ width: '200px', height: '200px', objectFit: 'cover' }} 
                   className="rounded-2xl border-4 border-neutral-800 shadow-2xl" 
                 />
               </motion.div>
            </div>

            {/* SCAN GAUGE */}
            <AnimatePresence>
            {scanData && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-neutral-900 rounded-xl p-4 border border-green-500/30">
                 <div className="flex flex-col items-center">
                    <div style={{ width: '150px', height: '150px' }}>
                       <ScoreGauge score={scanData.score} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full mt-4">
                       <StatRow label="Liquidity" val={scanData.breakdown.liquidity} />
                       <StatRow label="Risk" val={scanData.breakdown.risk} />
                    </div>
                 </div>
              </motion.div>
            )}
            </AnimatePresence>

            {/* CHAT LOG */}
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-2 rounded-xl text-sm max-w-[80%] ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 
                    msg.role === 'system' ? 'text-gray-500 text-xs italic w-full text-center bg-transparent' : 
                    'bg-neutral-800 text-gray-200'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-center text-xs text-green-500 animate-pulse">... processing ...</div>}
            </div>

          </div>
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900">
           <div className="max-w-2xl mx-auto flex gap-2">
              <button onClick={handleScan} className="bg-green-900/30 text-green-500 p-3 rounded-lg border border-green-500/50 hover:bg-green-500 hover:text-black transition">
                 <Activity size={20} />
              </button>
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-black border border-neutral-700 rounded-lg px-4 text-white focus:border-green-500 outline-none"
              />
              <button onClick={handleSendMessage} className="bg-white text-black p-3 rounded-lg font-bold">
                 <Zap size={20} fill="black" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

// Stats Helper
function StatRow({ label, val }) {
   return (
     <div className="flex justify-between bg-black p-2 rounded border border-neutral-800">
        <span className="text-xs text-gray-500 uppercase">{label}</span>
        <span className="font-mono text-xs font-bold text-green-400">{val}</span>
     </div>
   )
}