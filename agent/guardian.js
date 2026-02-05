/* agent/guardian.js - ECOSYSTEM UPDATE */

// ... imports remain the same ... 

// --- UPDATED CONFIGURATION ---
const TRON_API = "https://api.trongrid.io"; 
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// 🛡️ THE TRON ECOSYSTEM WATCHLIST
const WATCH_LIST = [
    { 
      name: "$SUNAI", 
      address: "TEyzUNwZMuMsAXqdcz5HZrshs3iWfydGAW", 
      decimals: 18, 
      threshold: 50 // Keep low for your specific demo token
    },
    { 
      name: "USDT", 
      address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", 
      decimals: 6, 
      threshold: 1000000 // Only alert on > $1M USDT moves (Whale Alert)
    },
    { 
      name: "SUN", 
      address: "TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3s", 
      decimals: 18, 
      threshold: 50000 // Alert on 50k SUN moves
    },
    { 
      name: "JST", 
      address: "TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9", 
      decimals: 18, 
      threshold: 100000 
    },
    { 
      name: "BTT", 
      address: "TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4", 
      decimals: 18, 
      threshold: 100000000 // BTT is cheap, so threshold must be high
    },
    { 
      name: "WIN", 
      address: "TLa2f6J26qCmf6ELRRnPaMHgck0dPrQtqK", 
      decimals: 6, 
      threshold: 1000000 
    }
];

// ... memory setup remaining the same ...

// --- UPDATED CHECK LOGIC (Handles Decimals) ---
async function checkTargets() {
    for (const target of WATCH_LIST) {
        const url = `${TRON_API}/v1/contracts/${target.address}/events?event_name=Transfer&limit=5`;
        
        try {
            const res = await axios.get(url);
            if (!res.data.success) return;

            const events = res.data.data;

            for (const tx of events) {
                if (memory.handledTx.includes(tx.transaction_id)) continue;

                let rawVal = parseInt(tx.result.value);
                
                // 🧮 USE CORRECT DECIMALS
                let divisor = Math.pow(10, target.decimals);
                let readableAmount = rawVal / divisor;

                // Log scanning activity (Optional: comment out to reduce noise)
                // console.log(`🔎 Scan: ${readableAmount.toFixed(0)} ${target.name}`);

                // HIT THE THRESHOLD?
                if (readableAmount > target.threshold) {
                    console.log(`\n🚨 ALERT: MASSIVE ${target.name} SURGE (${readableAmount.toLocaleString()} > ${target.threshold})`);
                    console.log("...Consulting Gemini Brain...");
                    
                    await analyzeRisk(tx, readableAmount, target);
                }

                memory.handledTx.push(tx.transaction_id);
                if (memory.handledTx.length > 100) memory.handledTx.shift(); // Increased memory size
                fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory));
            }
        } catch (e) {
            // console.log(`Connection blip for ${target.name}`);
        }
    }
}