/* pages/locker.js - The Command Center Layout */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Smartphone, Shield, Activity, Zap, CheckCircle } from 'lucide-react';
import { useTron } from '../Hooks/useTron';
import ScoreGauge from '../components/ScoreGauge';
import { CHARACTERS } from '../data/characters';

export default function LockerRoom() {
  const { address, connect } = useTron();
  
  // --- STATE ---
  const [selectedCharId, setSelectedCharId] = useState("WALL");
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [equippedId, setEquippedId] = useState(null); // Track who is "Equipped"

  const activeChar = CHARACTERS[selectedCharId] || CHARACTERS["WALL"];
  const scrollRef = useRef(null);

  // --- 1. MEMORY & SCROLL ---
  useEffect(() => {
    // Load Chat History
    const saved = localStorage.getItem(`chat_history_${selectedCharId}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{ 
        role: 'system', 
        content: `LOG START: ${activeChar.name} online.` 
      }]);
    }
  }, [selectedCharId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, scanData, isLoading]);

  // --- 2. ACTIONS ---
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const newMsg = { role: 'user', content: inputText };
    
    // Update UI immediately
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
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const handleScan = async () => {
    if (!address) return alert("Connect Wallet first!");
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'system', content: "⚡ ACTIVATING PORTFOLIO SCANNER..." }]);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address, characterId: selectedCharId })
      });
      const data = await res.json();
      setScanData(data); // Shows the Gauge
      setMessages(prev => [...prev, { role: 'assistant', content: data.feedback }]);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const handleEquip = () => {
    setEquippedId(selectedCharId);
    setMessages(prev => [...prev, { role: 'system', content: `>> ${activeChar.name} IS NOW YOUR MAIN COACH.` }]);
  };

  const wipeMemory = () => {
    localStorage.removeItem(`chat_history_${selectedCharId}`);
    setMessages([{ role: 'system', content: "MEMORY FLUSHED. REBOOTING SYSTEM..." }]);
    setScanData(null);
  };

  return (
    // GRID LAYOUT: Sidebar (250px) | Content (Auto)
    <div className="grid grid-cols-[250px_1fr] h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* === LEFT SIDEBAR (ROSTER) === */}
      <div className="bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div className="p-6 border-b border-neutral-800">
          <h1 className="text-xl font-black text-green-500 tracking-tighter italic">FOOTBALL<br/>ALIENS</h1>
          <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Locker Room V1</div>
        </div>

        {/* Character List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2 px-2">
          {Object.entries(CHARACTERS).map(([id, char]) => (
            <button
              key={id}
              onClick={() => { setSelectedCharId(id); setScanData(null); }}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                selectedCharId === id 
                  ? 'bg-neutral-800 border-l-4 border-green-500' 
                  : 'hover:bg-neutral-800/50 border-l-4 border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={char.img} className="w-10 h-10 rounded-lg object-cover bg-neutral-700" />
              <div className="text-left">
                <div className="font-bold text-sm text-gray-200">{char.name}</div>
                <div className="text-[10px] uppercase text-gray-500">{char.role}</div>
              </div>
              {equippedId === id && <CheckCircle size={16} className="text-green-500 ml-auto" />}
            </button>
          ))}
        </div>

        {/* Wallet Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900">
          <button 
            onClick={connect}
            className={`w-full py-3 rounded-lg font-bold text-xs uppercase transition-colors ${
              address ? 'bg-neutral-800 text-green-500' : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {address ? "TRON CONNECTED" : "CONNECT WALLET"}
          </button>
        </div>
      </div>

      {/* === RIGHT MAIN PANEL === */}
      <div className="relative flex flex-col bg-neutral-950/50 h-full">
        
        {/* TOP BAR: Tools & Equip */}
        <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-black/40 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-ping' : 'bg-green-500'}`} />
            <span className="font-mono text-sm text-gray-400">{activeChar.name.toUpperCase()} // ONLINE</span>
          </div>
          <div className="flex gap-2">
            <button onClick={wipeMemory} className="p-2 hover:bg-red-900/20 text-red-500 rounded-lg" title="Wipe Chat">
              <Trash2 size={18} />
            </button>
            <button 
              onClick={handleEquip}
              disabled={equippedId === selectedCharId}
              className={`px-4 py-1.5 text-xs font-bold uppercase rounded transition-all ${
                 equippedId === selectedCharId 
                 ? 'bg-green-500 text-black cursor-default' 
                 : 'bg-neutral-200 text-black hover:bg-white hover:scale-105'
              }`}
            >
              {equippedId === selectedCharId ? "EQUIPPED" : "EQUIP COACH"}
            </button>
          </div>
        </div>

        {/* LOG & VISUALS (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8" ref={scrollRef}>
          
          {/* Main Character Showcase */}
          <div className="flex flex-col items-center">
             <motion.div 
               key={selectedCharId}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="relative"
             >
                <img 
                  src={activeChar.img} 
                  className="w-48 h-48 md:w-64 md:h-64 rounded-2xl border-4 border-neutral-800 shadow-2xl object-cover"
                />
                {/* Float Badge */}
                <div className="absolute -bottom-4 right-0 bg-neutral-900 border border-neutral-700 px-4 py-1 rounded-full text-xs font-mono text-green-400 shadow-lg">
                   FOCUS: {activeChar.focus || "UNKNOWN"}
                </div>
             </motion.div>
          </div>

          {/* SCAN GAUGE (Phase 3 Feature) */}
          <AnimatePresence>
            {scanData && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900 border border-green-500/20 rounded-2xl p-6 max-w-2xl mx-auto"
              >
                <div className="flex flex-col md:flex-row items-center gap-6">
                   <div className="flex-shrink-0">
                      <ScoreGauge score={scanData.score} />
                   </div>
                   <div className="flex-1 w-full grid grid-cols-2 gap-4">
                      <StatRow label="Liquidity" val={scanData.breakdown.liquidity} />
                      <StatRow label="Diversification" val={scanData.breakdown.diversification} />
                      <StatRow label="Risk Lvl" val={scanData.breakdown.risk} />
                      <StatRow label="Strategy" val={scanData.breakdown.strategy} />
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CHAT LOG */}
          <div className="max-w-3xl mx-auto space-y-4 pb-12">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed border
                  ${msg.role === 'user' 
                    ? 'bg-blue-600/20 border-blue-500/30 text-blue-100 rounded-br-none' 
                    : msg.role === 'system'
                    ? 'bg-transparent border-transparent text-gray-500 font-mono text-[10px] uppercase text-center w-full'
                    : 'bg-neutral-800 border-neutral-700 text-gray-200 rounded-bl-none'
                  }
                `}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                  <div className="bg-neutral-800 px-4 py-2 rounded-2xl rounded-bl-none text-xs text-green-500 animate-pulse">
                     ... processing ...
                  </div>
               </div>
            )}
          </div>
        
        </div>

        {/* BOTTOM INPUT BAR (Sticky) */}
        <div className="p-4 bg-black border-t border-neutral-800 z-10">
          <div className="max-w-3xl mx-auto flex gap-3 h-12">
            {/* Context Button: Scan */}
            <button 
              onClick={handleScan}
              disabled={isLoading || !address}
              className="px-4 bg-green-900/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500 hover:text-black transition-all flex items-center gap-2"
              title="Run Portfolio Analysis"
            >
              <Activity size={18} />
              <span className="hidden md:inline font-bold text-xs uppercase">Scan</span>
            </button>

            {/* Input */}
            <input 
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 focus:outline-none focus:border-green-500 text-white placeholder-neutral-600 font-mono text-sm"
              placeholder={address ? "Ask for advice or just chat..." : "Connect wallet to start..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
            />

            {/* Send */}
            <button 
              onClick={handleSendMessage}
              disabled={isLoading}
              className="px-4 bg-neutral-200 text-black rounded-lg hover:bg-white transition-colors"
            >
              <Zap size={18} fill="currentColor" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Simple Helper for Stats
function StatRow({ label, val }) {
   const color = val > 75 ? "text-green-400" : val < 40 ? "text-red-400" : "text-yellow-400";
   return (
     <div className="flex justify-between items-center bg-neutral-950 p-2 rounded border border-neutral-800">
        <span className="text-[10px] text-gray-500 uppercase">{label}</span>
        <span className={`font-mono font-bold ${color}`}>{val}</span>
     </div>
   )
}