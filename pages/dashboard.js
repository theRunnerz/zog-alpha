/* pages/dashboard.js - CLIENT SIDE (Crash Fixed) */
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GuardianDashboard() {
  const [logs, setLogs] = useState([]);

  // Poll for updates every 2 seconds
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs'); 
        const data = await res.json();
        if (data.alerts) setLogs(data.alerts);
      } catch (e) { console.error(e); }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#0f0', fontFamily: 'monospace', padding: '20px' }}>
      
      {/* HEADER */}
      <div style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', display:'flex', alignItems:'center', gap:'10px' }}>
            🛡️ PINKERTAPE GUARDIAN
          </h1>
          <div style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>AUTONOMOUS TRON SENTINEL // MAINNET ACTIVE</div>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
             <div style={{ display:'flex', alignItems:'center', gap:'5px', color:'red', fontWeight:'bold', fontSize:'12px' }}>
                <span style={{ display:'block', width:'10px', height:'10px', borderRadius:'50%', background:'red', boxShadow:'0 0 10px red', animation: 'blink 1s infinite' }}></span>
                LIVE
             </div>
             <Link href="/" style={{ marginLeft:'20px', color: '#0f0', textDecoration:'none', border:'1px solid #0f0', padding:'8px 15px', borderRadius:'5px', fontSize:'14px' }}>EXIT</Link>
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard label="Scope" value="6 ASSETS" sub="USDT, BTT, SUN, JST..." />
        <StatCard label="Threat Level" value="ACTIVE" sub="Scanning Mempool..." color="white" />
        <StatCard label="AI Engine" value="GEMINI-3" sub="Flash Preview" />
        <StatCard label="Actions Taken" value={logs.length} sub="Real-time Interventions" color="#0f0" />
      </div>

      {/* LOG FEED */}
      <h2 style={{ fontSize: '16px', borderLeft: '4px solid #0f0', paddingLeft: '10px', marginBottom: '20px', textTransform:'uppercase' }}>Live Security Stream</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {logs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#333', border: '1px dashed #333', borderRadius:'10px' }}>
            <div style={{ fontSize:'30px', marginBottom:'10px' }}>📡</div>
            WAITING FOR SIGNAL...
            <div style={{fontSize:'12px', marginTop:'5px'}}>Ensure agent is running in terminal</div>
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ 
              background: 'rgba(0, 20, 0, 0.5)', border: '1px solid #111', padding: '20px', borderRadius: '8px',
              borderLeft: log.risk === 'HIGH' ? '4px solid red' : '4px solid yellow',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#666', fontSize: '12px' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span style={{ background: log.risk === 'HIGH' ? 'red' : 'yellow', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                  {log.risk || 'INFO'} RISK
                </span>
              </div>
              
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color:'#fff' }}>
                DETECTED: {log.amount || 'Unknown'} {log.token} MOVEMENT
              </div>
              
              <div style={{ background: '#111', padding: '15px', borderRadius: '5px', marginBottom: '15px', fontSize: '13px', color: '#ccc', border:'1px solid #333' }}>
                <span style={{ color: '#0f0', fontWeight:'bold' }}>🧠 ANALYSIS:</span> "{log.reason || 'AI Analysis pending...'}"
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom:'10px' }}>
                <div style={{ flex: 1, borderTop: '1px solid #333' }}></div>
                <span style={{ fontSize: '10px', color: '#666', padding:'0 10px' }}>AUTOMATED RESPONSE</span>
                <div style={{ flex: 1, borderTop: '1px solid #333' }}></div>
              </div>

              <div style={{ fontSize:'12px', color:'#00acee', fontStyle:'italic' }}>
                 {/* 🛠️ FIX IS HERE: We check if log.tweet exists before substrings */}
                 🐦 TWEET SENT: "{log.tweet ? log.tweet.substring(0, 80) : 'Transmission sent...'}"...
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx global>{`
        @keyframes blink { 0% { opacity: 0.2; } 50% { opacity: 1; } 100% { opacity: 0.2; } }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, sub, color = '#0f0' }) {
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '20px', borderRadius: '8px' }}>
      <div style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', marginBottom: '5px', letterSpacing:'1px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: color, marginBottom:'5px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#555' }}>{sub}</div>
    </div>
  );
}