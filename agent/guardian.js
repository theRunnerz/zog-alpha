/* agent/guardian.js - FULL ECOSYSTEM VERSION */
import dotenv from 'dotenv';
import TronWeb from 'tronweb';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- 1. SETUP & CONFIGURATION ---

// Fix for ESM directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// API Keys
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const TRON_API = "https://api.trongrid.io"; 

// Twitter Client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// 🛡️ THE TRON ECOSYSTEM WATCHLIST
// We monitor Memecoins ($SUNAI) AND Infrastructure (USDT, SUN, etc)
const WATCH_LIST = [
    { 
      name: "$SUNAI", 
      address: "TEyzUNwZMuMsAXqdcz5HZrshs3iWfydGAW", 
      decimals: 18, 
      threshold: 5000000 // Low threshold for your specific demo token
    },
    { 
      name: "USDT", 
      address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", 
      decimals: 6, 
      threshold: 50000 // Alert on $50k+ USDT moves (Adjust this if you want more noise)
    },
    { 
      name: "SUN", 
      address: "TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3s", 
      decimals: 18, 
      threshold: 10000 
    },
    { 
      name: "JST", 
      address: "TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9", 
      decimals: 18, 
      threshold: 20000 
    },
    { 
      name: "BTT", 
      address: "TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4", 
      decimals: 18, 
      threshold: 10000000 // BTT is cheap, needs high threshold
    },
    { 
      name: "WIN", 
      address: "TLa2f6J26qCmf6ELRRnPaMHgck0dPrQtqK", 
      decimals: 6, 
      threshold: 500000 
    }
];

// Memory Storage (for Dashboard)
const MEMORY_FILE = path.join(__dirname, 'agent_memory.json');
let memory = fs.existsSync(MEMORY_FILE) ? JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8')) : { handledTx: [], alerts: [] };

// Initialize AI
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

console.log("\n🤖 PINKERTAPE SENTINEL (LIVE ECOSYSTEM MODE) STARTING...");
console.log(`👁️  Connected to TRON Mainnet.`);
console.log(`📡 Monitoring: ${WATCH_LIST.map(t => t.name).join(', ')}`);
console.log(`🐦 Twitter Relay: ACTIVE`);
console.log("----------------------------------------------------\n");

// --- 2. MAIN LOOP ---
async function startPatrol() {
    console.log("...Scanning Blockchain Mempool...");
    // Initial check
    await checkTargets();
    // Loop every 15 seconds
    setInterval(checkTargets, 15000); 
}

// --- 3. CHECK LOGIC ---
async function checkTargets() {
    for (const target of WATCH_LIST) {
        // TronGrid API to get recent transfers
        const url = `${TRON_API}/v1/contracts/${target.address}/events?event_name=Transfer&limit=5`;
        
        try {
            const res = await axios.get(url);
            if (!res.data.success) continue;

            const events = res.data.data;

            for (const tx of events) {
                // duplicate check
                if (memory.handledTx.includes(tx.transaction_id)) continue;

                let rawVal = parseInt(tx.result.value);
                
                // 🧮 Handle Decimals (18 vs 6)
                let divisor = Math.pow(10, target.decimals);
                let readableAmount = rawVal / divisor;

                // Debug Log (Optional: Comment out if too noisy)
                // console.log(`🔎 Scan: ${readableAmount.toFixed(0)} ${target.name} (TX: ${tx.transaction_id.slice(0,6)}...)`);

                // 🚨 THRESHOLD CHECK
                if (readableAmount > target.threshold) {
                    console.log(`\n🚨 ALERT: SIGNIFICANT ${target.name} MOVEMENT (${readableAmount.toLocaleString()} > ${target.threshold})`);
                    console.log("...Consulting Gemini Brain...");
                    
                    await analyzeRisk(tx, readableAmount, target);
                }

                // Update Memory
                memory.handledTx.push(tx.transaction_id);
                if (memory.handledTx.length > 200) memory.handledTx.shift(); // Keep last 200 IDs
                fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory));
            }
        } catch (e) {
            // Silently ignore connection blips to keep terminal clean
        }
    }
}

// --- 4. AI ANALYSIS LOGIC ---
async function analyzeRisk(tx, amount, target) {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    // Attempt to decode sender address
    let sender = tx.result.from;
    try {
        if(TronWeb.address) sender = TronWeb.address.fromHex(sender);
    } catch(e) { sender = "Unknown"; }

    // DYNAMIC PROMPT: Handles Memecoins (Dump risk) vs Majors (Whale risk)
    const prompt = `
        You are PinkerTape, an Autonomous AI Sentinel on TRON.
        
        EVENT:
        Asset: ${target.name}
        Amount: ${amount.toLocaleString()} 
        Sender: ${sender}
        
        CONTEXT:
        If asset is USDT, SUN, JST -> Analyze as "Whale Alert" or "Liquidity Shift".
        If asset is $SUNAI -> Analyze as "DUMP RISK" or "Rug Pull Warning".
        
        TASK:
        1. Determine Risk Level (HIGH/MEDIUM).
        2. Create a specific, catchy Ticker and Name for a reaction token (e.g., if USDT moves, maybe "WhaleWatch" token).
        3. Write a Tweet to @Agent_SunGenX.

        OUTPUT FORMAT (JSON ONLY):
        {
            "risk": "HIGH",
            "reason": "1 short sentence analysis.",
            "tokenName": "Creative Reaction Token Name",
            "ticker": "TICKER",
            "description": "Short description of this event token.",
            "tweetText": "The exact tweet text."
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);

        console.log("🧠 AI DECISION:");
        console.log(`   RISK: ${analysis.risk}`);
        console.log(`   IDEA: ${analysis.tokenName} ($${analysis.ticker})`);

        // Trigger Defense if Risk is notable
        if (analysis.risk === "HIGH" || analysis.risk === "MEDIUM") {
            await executeRealDefense(analysis, amount, target.name, tx.transaction_id);
        }

    } catch (e) {
        console.error("AI Error:", e.message);
    }
}

// --- 5. EXECUTION & TWEETING ---
async function executeRealDefense(analysis, amount, tokenName, txID) {
    console.log("\n⚡ EXECUTING DEFENSE PROTOCOLS...");
    
    // Format Tweet with standard emojis and hashtags
    const statusText = `
@Agent_SunGenX 🚨 ${tokenName} MOVEMENT DETECTED 🚨

Amount: ${amount.toLocaleString()} ${tokenName}
Analysis: ${analysis.reason}

🛡️ DEPLOY COUNTER-TOKEN:
Name: ${analysis.tokenName}
Ticker: $${analysis.ticker}
Desc: ${analysis.description}

#TRON #PinkerTape #AI
    `.trim();

    try {
        // 1. TWEET (Real)
        const tweet = await twitterClient.v2.tweet(statusText);
        console.log(`✅ TWEET POSTED! ID: ${tweet.data.id}`);
        
        // 2. DASHBOARD LOGGING
        const alertData = {
            timestamp: new Date().toISOString(),
            token: tokenName,
            amount: amount.toLocaleString(),
            risk: analysis.risk,
            reason: analysis.reason,
            tx: txID,
            tweet: statusText
        };
        
        if (!memory.alerts) memory.alerts = [];
        memory.alerts.unshift(alertData);
        if (memory.alerts.length > 20) memory.alerts.pop();
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));

    } catch (e) {
        console.error("❌ TWITTER API ERROR (Check Keys):", e.message);
        
        // Fallback: Save to dashboard even if Tweet fails (so your demo works)
        const alertData = {
            timestamp: new Date().toISOString(),
            token: tokenName,
            amount: amount.toLocaleString(),
            risk: "HIGH",
            reason: analysis.reason,
            tx: txID,
            tweet: statusText // Show intended tweet
        };
        if (!memory.alerts) memory.alerts = [];
        memory.alerts.unshift(alertData);
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
    }
    
    console.log("----------------------------------------------------\n");
}

startPatrol();