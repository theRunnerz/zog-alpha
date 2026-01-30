/* pages/locker.js - The "Hybrid" Version */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Shield, MessageSquare, Activity, Zap } from 'lucide-react'; // Icons
import { useTron } from '../Hooks/useTron';
import ScoreGauge from '../components/ScoreGauge';
import { CHARACTERS } from '../data/characters';

export default function LockerRoom() {
  const { address, connect } = useTron();
  
  // --- STATE ---
  const [selectedCharId, setSelectedCharId] = useState("WALL");
  const [messages, setMessages] = useState([]); // Chat history
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Phase 3 Data (The Scan Results)
  const [scanData, setScanData] = useState(null);

  const activeChar = CHARACTERS[selectedCharId];
  const scrollRef = useRef(null);

  // --- 1. LOAD MEMORY ---
  useEffect(() => {
    // Load chat history from LocalStorage for this character
    const saved = localStorage.getItem(`chat_history_${selectedCharId}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{ 
        role: 'system', 
        content: `I am ${activeChar.name}. ${activeChar.role}. Connect wallet to scan, or just talk to me.` 
      }]);
    }
    setScanData(null); // Reset scan when switching chars
  }, [selectedCharId]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // --- 2. THE CHAT FUNCTION ---
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const newMsg = { role: 'user', content: inputText };
    const updatedHistory = [...messages, newMsg];
    
    setMessages(updatedHistory);
    setInputText("");
    setIsLoading(true);

    try {
      // NOTE: Ensure you still have pages/api/chat.js for generic chat!
      // If not, we can route this to coach.js with a flag, but let's assume chat.js exists.
      const res = await fetch('/api/chat', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          characterId: selectedCharId,
          messages: updatedHistory,
          wallet: address 
        })
      });
      
      const data = await res.json();
      const botMsg = { role: 'assistant', content: data.reply };
      
      const finalHistory = [...updatedHistory, botMsg];
      setMessages(finalHistory);
      localStorage.setItem(`chat_history_${selectedCharId}`, JSON.stringify(finalHistory));

    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  // --- 3. THE SCAN FUNCTION (Phase 3) ---
  const handleScan = async () => {
    if (!address) return alert("Connect Wallet first!");
    
    setIsLoading(true);
    // Add a system message saying we are scanning
    setMessages(prev => [...prev, { role: 'assistant', content: "🔍 Accessing on-chain data... Hold tight." }]);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: address, 
          characterId: selectedCharId 
        })
      });
      const data = await res.json();
      
      // 1. Save the Gauge Data to show the UI
      setScanData(data);

      // 2. Add the Roast to the chat history
      const roastMsg = { role: 'assistant', content: `[ANALYSIS COMPLETE]: ${data.feedback}` };
      const newHistory = [...messages, roastMsg];
      setMessages(newHistory);
      localStorage.setItem(`chat_history_${selectedCharId}`, JSON.stringify(newHistory));

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "❌ Data Scan Failed. Try again." }]);
    }
    setIsLoading(false);
  };

  // --- 4. UTILS ---
  const wipeMemory = () => {
    localStorage.removeItem(`chat_history_${selectedCharId}`);
    setMessages([{ role: 'system', content: "Memory wiped. Who are you again?" }]);
    setScanData(null);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans flex flex-col md:flex-row">
      
      {/* === LEFT: CHARACTER SELECTOR === */}
      <div className="w-full md:w-64 bg-neutral-950 border-r border-neutral-800 p-4 flex flex-col gap-4">
        <h1 className="text-xl font-bold text-green-500 tracking-tighter">ZOG LOCKER UI</h1>
        
        <div className="flex flex-col gap-2 overflow-y-auto">
          {Object.entries(CHARACTERS).map(([id, char]) => (
            <button
              key={id}
              onClick={() => setSelectedCharId(id)}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-colors text-left ${
                selectedCharId === id 
                  ? 'bg-neutral-800 border-green-500 text-white' 
                  : 'bg-transparent border-neutral-800 text-gray-500 hover:bg-neutral-900'
              }`}
            >
              <img src={char.img} className="w-8 h-8 rounded-full bg-neutral-700 object-cover" />
              <div>
                <div className="text-sm font-bold">{char.name}</div>
                <div className="text-[10px] uppercase opacity-70">{char.role}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-neutral-800">
           {!address ? (
             <button onClick={connect} className="w-full py-3 bg-blue-600 rounded-lg font-bold text-xs uppercase hover:bg-blue-500">
               Connect Tron
             </button>
           ) : (
             <div className="text-xs text-center text-gray-500 font-mono">
               Connected: <span className="text-green-500">{address.slice(0,4)}...{address.slice(-4)}</span>
             </div>
           )}
        </div>
      </div>

      {/* === CENTER: MAIN STAGE === */}
      <div className="flex-1 flex flex-col relative max-h-screen overflow-hidden">
        
        {/* --- Header Tools --- */}
        <div className="h-16 border-b border-neutral-800 flex justify-between items-center px-6 bg-neutral-900/95 backdrop-blur z-20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-mono text-sm text-green-400">ONLINE // {activeChar.name.toUpperCase()}</span>
          </div>
          <div className="flex gap-2">
             <button onClick={wipeMemory} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg" title="Wipe Memory">
                <Trash2 size={18} />
             </button>
             <button className="px-4 py-1.5 bg-neutral-100 text-black text-xs font-bold rounded hover:bg-white transition">
                EQUIP COACH
             </button>
          </div>
        </div>

        {/* --- Content Area --- */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" ref={scrollRef}>
          
          {/* 1. Character Visual */}
          <div className="flex justify-center mb-8">
             <motion.div 
               key={selectedCharId}
               initial={{ opacity: 0, y: 10 }} 
               animate={{ opacity: 1, y: 0 }}
               className="relative"
             >
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent z-10" />
                <img 
                  src={activeChar.img} 
                  className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-2xl border border-neutral-700 shadow-[0_0_30px_rgba(0,0,0,0.5)]" 
                />
                <div className="absolute -bottom-3 -right-3 bg-neutral-900 border border-neutral-700 px-3 py-1 rounded-full text-xs font-mono text-green-400 z-20">
                  LVL 1
                </div>
             </motion.div>
          </div>

          {/* 2. Chat History */}
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-neutral-800 text-white rounded-br-none' 
                    : 'bg-neutral-950 border border-neutral-800 text-gray-300 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-xs text-gray-500 animate-pulse text-center">Alien is typing...</div>}
          </div>

          {/* 3. The SCAN CARD (Pops up when data exists) */}
          <AnimatePresence>
            {scanData && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto mt-8 bg-neutral-950 border border-green-500/30 rounded-3xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
                
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Gauge */}
                  <div className="flex-shrink-0">
                    <ScoreGauge score={scanData.score} />
                  </div>
                  
                  {/* Stats */}
                  <div className="flex-1 w-full grid grid-cols-2 gap-3">
                     <StatBox label="Liquidity" val={scanData.breakdown.liquidity} />
                     <StatBox label="Diversity" val={scanData.breakdown.diversification} />
                     <StatBox label="Risk" val={scanData.breakdown.risk} />
                     <StatBox label="Strategy" val={scanData.breakdown.strategy} />
                     <div className="col-span-2 pt-2 border-t border-neutral-800 mt-2 flex justify-between text-xs text-gray-400">
                        <span>Net Worth: ${scanData.metrics.totalValue.toLocaleString()}</span>
                        <span>Top: {scanData.metrics.topAsset}</span>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-20" /> {/* Spacer */}
        </div>

        {/* --- Footer Input --- */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 sticky bottom-0 z-30">
          <div className="max-w-3xl mx-auto flex gap-3">
             {/* SCAN BUTTON */}
             <button 
               onClick={handleScan}
               disabled={!address || isLoading}
               className="px-4 bg-green-500/10 border border-green-500/50 text-green-400 rounded-xl hover:bg-green-500 hover:text-black transition-colors flex items-center gap-2 group disabled:opacity-50"
               title="Run Full Portfolio Scan"
             >
                <Activity size={18} className='group-hover:rotate-12 transition-transform' />
                <span className="hidden md:inline font-bold text-xs uppercase">Scan</span>
             </button>

             {/* TEXT INPUT */}
             <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Send message to ${activeChar.name}...`}
                  className="w-full bg-neutral-800 border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-green-500 text-sm placeholder-gray-500 text-white"
                />
             </div>
             
             {/* SEND BUTTON */}
             <button 
               onClick={handleSendMessage}
               disabled={isLoading}
               className="p-3 bg-white text-black rounded-xl hover:bg-gray-200 disabled:opacity-50"
             >
                <Zap size={18} fill="currentColor" />
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatBox({ label, val }) {
  // Simple color coding
  const color = val > 75 ? "text-green-400" : val > 40 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800">
       <div className="text-[10px] uppercase text-gray-500">{label}</div>
       <div className={`text-lg font-mono font-bold ${color}`}>{val}</div>
    </div>
  );
}