/* pages/locker.js */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTron } from '../Hooks/useTron';
import ScoreGauge from '../components/ScoreGauge';
import { CHARACTERS } from '../data/characters';

export default function LockerRoom() {
  const { address, connect } = useTron();
  
  // State
  const [loading, setLoading] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState("WALL"); // Default Coach
  const [coachData, setCoachData] = useState(null); // The JSON from API

  const activeChar = CHARACTERS[selectedCharId];

  // The Scan Function
  const handleScan = async () => {
    if (!address) return alert("Connect Wallet first!");
    
    setLoading(true);
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
      setCoachData(data); // Save the API result
    } catch (e) {
      console.error(e);
      alert("Coach is on a coffee break (Error).");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-green-500 selection:text-black">
      
      {/* --- HEADER --- */}
      <nav className="p-4 flex justify-between items-center border-b border-neutral-800">
        <h1 className="text-xl font-bold tracking-tighter text-green-400">FOOTBALL ALIENS</h1>
        <button 
          onClick={connect}
          className="px-4 py-2 bg-neutral-800 rounded-full text-xs font-mono border border-neutral-700 hover:border-green-500 transition-colors"
        >
          {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "CONNECT TRON"}
        </button>
      </nav>

      <main className="max-w-md mx-auto p-4 pb-20">
        
        {/* --- COACH SELECTOR --- */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {Object.entries(CHARACTERS).map(([id, char]) => (
            <button
              key={id}
              onClick={() => { setSelectedCharId(id); setCoachData(null); }}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs border ${
                selectedCharId === id ? 'bg-green-500 text-black border-green-500' : 'bg-neutral-800 border-neutral-700 text-gray-400'
              }`}
            >
              {char.role}
            </button>
          ))}
        </div>

        {/* --- ALIEN STAGE --- */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Green Glow behind head */}
          <div className="absolute top-10 w-32 h-32 bg-green-500/20 blur-3xl rounded-full" />
          
          <motion.img 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key={activeChar.img}
            src={activeChar.img} 
            alt="Alien Coach" 
            className="w-40 h-40 object-cover rounded-2xl border-2 border-neutral-700 shadow-2xl mb-6 relative z-10"
          />

          {/* SPEECH BUBBLE */}
          <div className="bg-neutral-800 border border-neutral-700 p-4 rounded-xl relative w-full mb-8 min-h-[100px]">
            {/* Little triangle arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-neutral-800 border-t border-l border-neutral-700 transform rotate-45" />
            
            {loading ? (
              <p className="text-green-400 animate-pulse font-mono text-sm">Analyzing on-chain data...</p>
            ) : coachData ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-sm text-gray-200 leading-relaxed font-medium">"{coachData.feedback}"</p>
              </motion.div>
            ) : (
              <p className="text-gray-500 text-sm italic">"Connect wallet & scan to get my analysis..."</p>
            )}
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={handleScan}
            disabled={!address || loading}
            className="w-full py-4 bg-green-500 text-black font-black text-lg uppercase tracking-widest rounded-xl hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 shadow-[0_0_20px_rgba(74,222,128,0.3)]"
          >
            {loading ? "SCANNING..." : "SCAN PORTFOLIO"}
          </button>
        </div>

        {/* --- SCORECARD (Only shows after scan) --- */}
        {coachData && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-12 bg-neutral-800/50 rounded-3xl p-6 border border-neutral-800"
          >
            <h3 className="text-center text-gray-400 text-sm font-mono uppercase mb-4">Performance Card</h3>
            
            {/* THE GAUGE */}
            <div className="-mt-8 mb-4">
              <ScoreGauge score={coachData.score} />
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Liquidity" score={coachData.breakdown.liquidity} />
              <MetricCard label="Diversification" score={coachData.breakdown.diversification} />
              <MetricCard label="Risk Protocol" score={coachData.breakdown.risk} />
              <MetricCard label="Strategy" score={coachData.breakdown.strategy} />
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">Top Asset: <span className="text-white">{coachData.metrics.topAsset}</span></p>
              <p className="text-xs text-gray-500">Net Worth: <span className="text-white">${coachData.metrics.totalValue.toLocaleString()}</span></p>
            </div>

          </motion.div>
        )}
      </main>
    </div>
  );
}

// Simple Sub-component for the stats
function MetricCard({ label, score }) {
  // Color logic
  const color = score > 75 ? "bg-green-500" : score > 40 ? "bg-yellow-500" : "bg-red-500";
  
  return (
    <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800">
      <div className="flex justify-between items-end mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-sm font-bold text-white">{score}</span>
      </div>
      <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color}`} 
          style={{ width: `${score}%` }} 
        />
      </div>
    </div>
  );
}