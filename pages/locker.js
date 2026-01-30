/* pages/locker.js - Robust Vertical Layout */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, MessageSquare, Activity, Zap, Shield, Menu } from 'lucide-react';
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

  const activeChar = CHARACTERS[selectedCharId] || CHARACTERS["WALL"];
  const scrollRef = useRef(null);

  // 1. Load Memory
  useEffect(() => {
    const saved = localStorage.getItem(`chat_history_${selectedCharId}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{ 
        role: 'system', 
        content: activeChar.systemPrompt 
      }]);
    }
  }, [selectedCharId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, scanData]);

  // 2. Chat Logic
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const newMsg = { role: 'user', content: inputText };
    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setInputText("");
    setIsLoading(true);

    try {
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
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  // 3. Scan Logic
  const handleScan = async () => {
    if (!address) return alert("Connect Wallet first!");
    
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'assistant', content: "🔍 Scanning On-Chain Data..." }]);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address, characterId: selectedCharId })
      });
      const data = await res.json();
      setScanData(data); // Show Gauge
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `ANALYSIS COMPLETE: ${data.feedback}` 
      }]);
      
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const wipeMemory = () => {
    localStorage.removeItem(`chat_history_${selectedCharId}`);
    setMessages([{ role: 'system', content: "Memory formatted. Rebooting..." }]);
    setScanData(null);
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white font-sans overflow-hidden">
      
      {/* === TOP BAR: Character Selector === */}
      <div className="flex-none bg-neutral-950 border-b border-neutral-800 p-3 z-20">
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide items-center">
          
          {/* Header Title */}
          <div className="flex-none mr-2">
            <h1 className="font-bold text-green-500 tracking-tighter leading-none text-sm">ZOG<br/>LOCKER</h1>
          </div>

          {/* Character Heads */}
          {Object.entries(CHARACTERS).map(([id, char]) => (
            <button
              key={id}
              onClick={() => setSelectedCharId(id)}
              className={`flex-none flex flex-col items-center gap-1 transition-all ${
                selectedCharId === id ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-70'
              }`}
            >
              <div className={`p-0.5 rounded-full border-2 ${selectedCharId === id ? 'border-green-500' : 'border-transparent'}`}>
                <img src={char.img} className="w-10 h-10 rounded-full bg-neutral-800 object-cover" />
              </div>
            </button>
          ))}

          {/* Tools Area */}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={wipeMemory} className="p-2 text-red-500 hover:bg-neutral-800 rounded-full" title="Wipe Memory">
              <Trash2 size={16} />
            </button>
            <button 
              onClick={connect} 
              className={`text-[10px] font-bold px-3 py-1.5 rounded-full border ${address ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-blue-600 border-blue-600'}`}
            >
              {address ? "CONNECTED" : "CONNECT WALLET"}
            </button>
          </div>
        </div>
      </div>

      {/* === MIDDLE: Chat & Main Stage === */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        
        {/* Large Character Image */}
        <div className="flex justify-center py-4">
            <motion.div 
              key={selectedCharId}
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>
              <img 
                src={activeChar.img} 
                className="relative w-40 h-40 md:w-56 md:h-56 object-cover rounded-2xl border-2 border-neutral-800 shadow-2xl" 
              />
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded border border-white/20">
                {activeChar.role.toUpperCase()}
              </div>
            </motion.div>
        </div>

        {/* Scan Results Card (If Data Exists) */}
        <AnimatePresence>
          {scanData && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              className="bg-neutral-950 border border-green-500/30 rounded-2xl p-4 relative overflow-hidden"
            >
              <div className="flex flex-col items-center">
                 <ScoreGauge score={scanData.score} />
                 <div className="grid grid-cols-2 gap-2 w-full mt-4">
                    <MiniStat label="Liquidity" val={scanData.breakdown.liquidity} />
                    <MiniStat label="Risk" val={scanData.breakdown.risk} />
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Bubbles */}
        <div className="space-y-4 pb-4">
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none shadow-lg' 
                  : 'bg-neutral-800 text-gray-200 border border-neutral-700 rounded-bl-none'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isLoading && <div className="text-center text-xs text-green-500 animate-pulse font-mono">ALIEN IS THINKING...</div>}
        </div>
      </div>

      {/* === BOTTOM: Input Area === */}
      <div className="flex-none bg-neutral-900 border-t border-neutral-800 p-3 pb-6 md:pb-3">
        <div className="max-w-3xl mx-auto flex gap-2">
          
          {/* Scan Button */}
          <button 
             onClick={handleScan}
             disabled={isLoading}
             className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-black transition-colors"
          >
            <Activity size={20} />
          </button>

          {/* Text Input */}
          <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Talk to ${activeChar.name}...`}
            className="flex-1 bg-neutral-800 border-none rounded-xl px-4 text-white placeholder-neutral-500 focus:ring-1 focus:ring-green-500"
          />

          {/* Send Button */}
          <button 
            onClick={handleSendMessage}
            className="p-3 bg-white text-black rounded-xl hover:bg-gray-200 font-bold"
          >
            <Zap size={20} fill="currentColor" />
          </button>

        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, val }) {
  const color = val > 75 ? "text-green-400" : val < 40 ? "text-red-400" : "text-yellow-400";
  return (
    <div className="bg-neutral-900 p-2 rounded text-center border border-neutral-800">
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
      <div className={`font-mono font-bold ${color}`}>{val}</div>
    </div>
  );
}