/* pages/locker.js - Fixed Dashboard Layout */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Activity, Zap, CheckCircle, Wallet, MessageSquare } from 'lucide-react';
import { useTron } from '../Hooks/useTron';
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

  // --- 1. Load History ---
  useEffect(() => {
    // Attempt to load from local storage
    const saved = localStorage.getItem(`chat_history_${selectedCharId}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{ 
        role: 'system', 
        content: `Connection established with ${activeChar.name}.` 
      }]);
    }
  }, [selectedCharId]);

  // Auto-Scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, scanData, isLoading]);

  // --- 2. Action Logic ---
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const newMsg = { role: 'user', content: inputText };
    const tempHistory = [...messages, newMsg];
    
    setMessages(tempHistory);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: selectedCharId, messages: tempHistory, wallet: address })
      });
      const data = await res.json();
      const finalHistory = [...tempHistory, { role: 'assistant', content: data.reply }];
      setMessages(finalHistory);
      localStorage.setItem(`chat_history_${selectedCharId}`, JSON.stringify(finalHistory));
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleScan = async () => {
    if (!address) return alert("Please connect wallet first!");
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'system', content: "Scanner Module Activated..." }]);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address, characterId: selectedCharId })
      });
      const data = await res.json();
      setScanData(data);
      setMessages(prev => [...prev, { role: 'assistant', content: data.feedback }]);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleEquip = () => {
    setEquippedId(selectedCharId);
    setMessages(prev => [...prev, { role: 'system', content: `Coach ${activeChar.name} equipped!` }]);
  };

  const wipeMemory = () => {
    localStorage.removeItem(`chat_history_${selectedCharId}`);
    setMessages([{ role: 'system', content: "Memory cleared." }]);
    setScanData(null);
  };

  return (
    // CONTAINER: Full Screen Flexbox
    <div className="flex h-screen w-screen bg-black text-white font-sans overflow-hidden">
      
      {/* === LEFT SIDEBAR === */}
      <div className="w-64 flex flex-col bg-neutral-900 border-r border-neutral-800 flex-shrink-0">
        
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-neutral-800">
          <h1 className="text-xl font-bold text-green-500 tracking-tighter">ZOG ARENA</h1>
        </div>

        {/* Character List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {Object.entries(CHARACTERS).map(([id, char]) => (
            <button
              key={id}
              onClick={() => { setSelectedCharId(id); setScanData(null); }}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors text-left ${
                selectedCharId === id 
                  ? 'bg-neutral-800 ring-1 ring-green-500/50' 
                  : 'hover:bg-neutral-800 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={char.img} className="w-8 h-8 rounded bg-neutral-700 object-cover" />
              <div>
                <div className="font-bold text-sm text-gray-200">{char.name}</div>
                <div className="text-[10px] uppercase text-gray-500">{char.role}</div>
              </div>
              {equippedId === id && <CheckCircle size={14} className="text-green-500 ml-auto" />}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800">
           <button 
             onClick={connect}
             className={`w-full py-3 rounded-lg font-bold text-xs uppercase flex justify-center items-center gap-2 ${
               address ? 'bg-neutral-800 text-green-500' : 'bg-blue-600 hover:bg-blue-500'
             }`}
           >
             <Wallet size={14} />
             {address ? "Connected" : "Connect Wallet"}
           </button>
        </div>
      </div>

      {/* === RIGHT CONTENT === */}
      <div className="flex-1 flex flex-col bg-neutral-950 relative min-w-0">
        
        {/* TOP TOOLBAR */}
        <div className="h-16 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <span className="font-mono text-sm text-green-400">ONLINE: {activeChar.name.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={wipeMemory} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
               <Trash2 size={18} />
             </button>
             <button 
                onClick={handleEquip}
                disabled={equippedId === selectedCharId}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                  equippedId === selectedCharId 
                    ? 'bg-green-500 text-black cursor-default' 
                    : 'bg-neutral-200 text-black hover:bg-white'
                }`}
             >
               {equippedId === selectedCharId ? "Equipped" : "Equip"}
             </button>
          </div>
        </div>

        {/* MAIN SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-10 pb-10">
            
            {/* HER0 IMAGE (Controlled Size) */}
            <div className="flex flex-col items-center">
               <motion.div 
                 key={selectedCharId}
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="relative"
               >
                 <img 
                   src={activeChar.img} 
                   className="w-48 h-48 rounded-2xl border-4 border-neutral-800 shadow-2xl object-cover" 
                 />
                 <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-700 text-[10px] text-green-400 font-mono whitespace-nowrap">
                    LVL 1 COACH
                 </div>
               </motion.div>
            </div>

            {/* API SCAN RESULTS (Conditional) */}
            <AnimatePresence>
              {scanData && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }}
                  className="bg-neutral-900 rounded-2xl p-6 border border-green-500/20 overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-40 h-40 flex-shrink-0">
                       <ScoreGauge score={scanData.score} />
                    </div>
                    <div className="flex-1 w-full grid grid-cols-2 gap-4">
                       <StatItem label="Liquidity" val={scanData.breakdown.liquidity} />
                       <StatItem label="Diversity" val={scanData.breakdown.diversification} />
                       <StatItem label="Risk" val={scanData.breakdown.risk} />
                       <StatItem label="Strategy" val={scanData.breakdown.strategy} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CHAT BUBBLES */}
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed
                    ${msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : msg.role === 'system'
                        ? 'w-full text-center text-[10px] text-gray-500 font-mono uppercase bg-transparent'
                        : 'bg-neutral-800 text-gray-200 border border-neutral-700 rounded-bl-none'
                    }
                  `}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="text-center text-xs text-green-500 animate-pulse mt-2">... Alien is typing ...</div>
              )}
            </div>

          </div>
        </div>

        {/* BOTTOM INPUT (Sticky Footer) */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex-shrink-0">
          <div className="max-w-3xl mx-auto flex gap-3">
             <button 
                onClick={handleScan}
                disabled={isLoading || !address}
                className="px-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500 hover:text-black transition-all flex items-center gap-2"
                title="Run Scan"
             >
               <Activity size={18} />
             </button>
             
             <input 
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
               className="flex-1 bg-neutral-800 border-none rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:ring-1 focus:ring-green-500 outline-none"
               placeholder={address ? "Type a message..." : "Connect wallet to chat..."}
             />

             <button 
               onClick={handleSendMessage}
               disabled={isLoading}
               className="p-3 bg-white text-black rounded-lg hover:bg-gray-200"
             >
               <Zap size={18} fill="currentColor" />
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper
function StatItem({ label, val }) {
  const color = val > 75 ? "text-green-400" : val < 40 ? "text-red-400" : "text-yellow-400";
  return (
    <div className="bg-neutral-950 p-2 rounded border border-neutral-800 flex justify-between">
      <span className="text-[10px] uppercase text-gray-500">{label}</span>
      <span className={`font-mono font-bold ${color}`}>{val}</span>
    </div>
  );
}