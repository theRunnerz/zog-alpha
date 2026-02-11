/* pages/market_dashboard.js */
import { useState, useEffect } from 'react';
// import Navbar from '../components/Navbar';

export default function MarketDashboard() {
  // --- STATE MANAGEMENT (Replaces simple variables) ---
  const [logs, setLogs] = useState([]);
  const [walletAddress, setWalletAddress] = useState(null);
  const [statusMsg, setStatusMsg] = useState("Standby...");
  const [socialHandle, setSocialHandle] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const CONTRACT_ADDRESS = "TNu2WufgBwb6v3R8ZT4SpN9tHfzTHqxfiG"; 

  // --- LOGGING SYSTEM ---
  const addLog = (msg, type = "info") => {
    const time = new Date().toLocaleTimeString();
    // Add new log to the TOP of the list
    setLogs((prev) => [{ time, msg, type }, ...prev]);
  };

  // --- INITIALIZATION (Run once on load) ---
  useEffect(() => {
    addLog("SYSTEM ONLINE", "info");
    addLog("CONNECTED TO TRONGRID (SHASTA)", "info");
    addLog("LISTENING FOR WHALES", "alert");
  }, []);

  // --- WALLET CONNECT ---
  const connectWallet = async () => {
    if (typeof window === 'undefined') return;

    if (!window.tronWeb) {
      alert("Please install TronLink!");
      return;
    }

    try {
      const result = await window.tronWeb.request({ method: 'tron_requestAccounts' });
      
      if (result.code === 200 || window.tronWeb.ready) {
        const address = window.tronWeb.defaultAddress.base58;
        setWalletAddress(address);
        addLog(`LINK ESTABLISHED: ${address}`, "info");
        addLog(`NETWORK: SHASTA TESTNET`, "info");
      } else {
        alert("Please unlock TronLink and try again.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- DEPOSIT FUNCTION ---
  const handleDeposit = async () => {
    if (!walletAddress) {
      await connectWallet();
      return;
    }
    if (!socialHandle || !depositAmount) {
      alert("PLEASE ENTER HANDLE AND AMOUNT");
      return;
    }

    try {
      setStatusMsg("⏳ REQUESTING SIGNATURE...");
      
      const contract = await window.tronWeb.contract().at(CONTRACT_ADDRESS);
      const amountInSun = window.tronWeb.toSun(depositAmount);

      const txId = await contract.registerAndDeposit(socialHandle).send({
        callValue: amountInSun
      });

      setStatusMsg("✅ DEPOSIT SENT");
      addLog(`DEPOSIT SUCCESS: ${depositAmount} TRX`, "alert");
      addLog(`TX ID: ${txId}`, "info");
      
      // Clear Amount Input
      setDepositAmount("");
      
    } catch (e) {
      console.error(e);
      setStatusMsg("❌ FAILED / REJECTED");
      addLog(`ERROR: ${e.message || e}`, "alert");
    }
  };

  return (
    <div className="dashboard-container">
    {/* <Navbar /> */}

      <div className="layout-grid">
        {/* LEFT COLUMN: INTELLIGENCE */}
        <div className="main-feed">
          <div className="panel">
            <h2>📡 LIVE INTERCEPT LOG</h2>
            <div id="log-feed">
              {logs.map((log, index) => (
                <div key={index} className={`log-entry ${log.type}`}>
                  <span className="timestamp">{log.time}</span> {log.msg}
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ flexGrow: 1 }}>
            <h2>⚡ ACTIVE MARKETS</h2>
            <div id="market-container">
              <div className="market-card">
                <h3>MARKET #001: WAITING FOR SIGNAL...</h3>
                <p>Status: SCANNING MEMPOOL</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROLS & BANK */}
        <div className="sidebar">
          
          {/* BANKING UI */}
          <div className="panel">
            <h2>🏦 OPERATOR UPLINK</h2>
            <div 
              style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={connectWallet}
            >
              <span className={`status-light ${walletAddress ? 'active' : ''}`}></span>
              <span style={{ color: walletAddress ? '#0f0' : '#555' }}>
                {walletAddress ? walletAddress.substring(0, 15) + "..." : "CLICK TO CONNECT WALLET"}
              </span>
            </div>

            <label>SOCIAL HANDLE</label>
            <input 
              type="text" 
              className="bank-input" 
              placeholder="@SunGenX_Fan"
              value={socialHandle}
              onChange={(e) => setSocialHandle(e.target.value)}
            />

            <label>DEPOSIT AMOUNT (TRX)</label>
            <input 
              type="number" 
              className="bank-input" 
              placeholder="100"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />

            <button onClick={handleDeposit} className="bank-btn">AUTHORIZE DEPOSIT</button>
            <p style={{ fontSize: '0.8rem', marginTop: '10px', color: '#555', textAlign: 'center' }}>
              {statusMsg}
            </p>
          </div>

          <div className="panel">
            <h2>🧠 AI METRICS</h2>
            <p>Accuracy: 87.4%</p>
            <p>Whales Tracked: 1,420</p>
            <p>Total Yield Paid: 45,000 TRX</p>
            <div style={{ height: '10px', background: '#333', marginTop: '10px' }}>
              <div style={{ width: '87%', height: '100%', background: '#0f0' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CSS STYLES (Scoped to this page) --- */}
      <style jsx global>{`
        :root {
            --neon-green: #0f0;
            --neon-red: #f00;
            --bg-color: #050a05;
            --panel-bg: #0a110a;
            --border-color: #1a331a;
        }
        body {
            background-color: var(--bg-color);
            color: var(--neon-green);
        }
      `}</style>
      
      <style jsx>{`
        .dashboard-container {
            font-family: 'Courier New', Courier, monospace;
            min-height: 100vh;
            background-color: #050a05;
            color: #0f0;
            padding-top: 20px; /* Space for Navbar */
        }
        .layout-grid {
            padding: 20px;
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            height: calc(100vh - 100px);
        }

        .main-feed { display: flex; flex-direction: column; gap: 20px; }
        .sidebar { display: flex; flex-direction: column; gap: 20px; }
        
        .panel {
            border: 1px solid #1a331a;
            background: #0a110a;
            padding: 15px;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.1);
            position: relative;
        }
        
        h2 {
            margin-top: 0;
            border-bottom: 1px solid #1a331a;
            padding-bottom: 10px;
            font-size: 1.2rem;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        #log-feed {
            height: 200px;
            overflow-y: auto;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        .log-entry { margin-bottom: 5px; }
        .timestamp { color: #555; margin-right: 10px; }
        .alert { color: #f00; font-weight: bold; }
        .info { color: #0ff; }

        .bank-input {
            width: 100%;
            background: #000;
            border: 1px solid #0f0;
            color: #0f0;
            padding: 10px;
            margin-bottom: 10px;
            font-family: inherit;
        }
        .bank-btn {
            width: 100%;
            background: #0f0;
            color: #000;
            border: none;
            padding: 15px;
            font-weight: bold;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.2s;
        }
        .bank-btn:hover {
            background: #fff;
            box-shadow: 0 0 15px #0f0;
        }
        
        .status-light {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #333;
            margin-right: 10px;
        }
        .status-light.active { background: #0f0; box-shadow: 0 0 5px #0f0; }

        .market-card {
            border-left: 3px solid #0f0;
            padding: 10px;
            margin-bottom: 10px;
            background: rgba(0, 255, 0, 0.05);
        }
      `}</style>
    </div>
  );
}