/* agent/guardian.js - FINAL PINKERTAPE GUARDIAN */
import dotenv from 'dotenv';
import TronWeb from 'tronweb';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- 1. SETUP & PATHS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// --- 2. CONFIGURATION ---
const TRON_API = "https://api.trongrid.io"; 
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// 🛡️ THE TRON ECOSYSTEM WATCHLIST
const WATCH_LIST = [
    { 
      name: "$SUNAI", 
      address: "TEyzUNwZMuMsAXqdcz5HZrshs3iWfydGAW", 
      decimals: 18, 
      threshold: 50 // Low threshold for Demo
    },
    { 
      name: "USDT", 
      address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", 
      decimals: 6, 
      threshold: 1000000 // Alert on > $1 Million moves
    },
    { 
      name: "SUN", 
      address: "TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3s", 
      decimals: 18, 
      threshold: 50000 
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
      threshold: 100000000 // BTT is cheap/high supply
    },
    { 
      name: "WIN", 
      address: "TLa2f6J26qCmf6ELRRnPaMHgck0dPrQtqK", 
      decimals: 6, 
      threshold: 5000000 
    }
];

// --- 3. INITIALIZATION ---

// setup generic memory
const MEMORY_FILE = path.join(__dirname, 'agent_memory.json');
let memory = fs.existsSync(MEMORY_FILE) 
    ? JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8')) 
    : { handledTx: [], alerts: [] };

// setup AI
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// setup Twitter (Try/Catch in case keys are missing)
let twitterClient = null;
try {
    if(process.env.TWITTER_ACCESS_TOKEN) {
        twitterClient = new TwitterApi({
            appKey: process.env.TWITTER_APP_KEY,
            appSecret: process.env.TWITTER_APP_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_ACCESS_SECRET,
        });
    }
} catch(e) { console.log("Twitter Init skipped."); }

console.log("\n🤖 PINKERTAPE SENTINEL (LIVE ECOSYSTEM MODE) STARTING...");
console.log(`👁️  Scanning ${WATCH_LIST.length} Key Assets on TRON Mainnet...`);
console.log(`🐦 Twitter Integration: ${twitterClient ? "ENABLED" : "DISABLED (Logs Only)"}`);
console.log("----------------------------------------------------");

// --- 4. MAIN LOOP ---
async function startPatrol() {
    console.log("...Scanning Mempool for Whale Movements...");
    await checkTargets();
    
    // Scan every 15 seconds to stay within API limits
    setInterval(checkTargets, 15000);
}

// --- 5. CHECK LOGIC ---
async function checkTargets() {
    for (const target of WATCH_LIST) {
        // TronGrid API for TRC20 Transfers
        const url = `${TRON_API}/v1/contracts/${target.address}/events?event_name=Transfer&limit=5`;
        
        try {
            const res = await axios.get(url);
            if (!res.data.success) return;

            const events = res.data.data;

            for (const tx of events) {
                // Check Memory
                if (memory.handledTx.includes(tx.transaction_id)) continue;

                // MATH: Handle 6 vs 18 decimals
                let rawVal = parseInt(tx.result.value);
                let divisor = Math.pow(10, target.decimals);
                let readableAmount = rawVal / divisor;

                // Debug Log (Shows it's working)
                // console.log(`🔎 [${target.name}] TX detected: ${readableAmount.toFixed(2)}`);

                // THRESHOLD CHECK
                if (readableAmount > target.threshold) {
                    console.log(`\n🚨 ALERT: MASSIVE ${target.name} MOVEMENT (${readableAmount.toLocaleString()})`);
                    console.log(`   TX: ${tx.transaction_id}`);
                    console.log("...Consulting Gemini Brain...");
                    
                    await analyzeRisk(tx, readableAmount, target);
                }

                // Update Memory
                memory.handledTx.push(tx.transaction_id);
                if (memory.handledTx.length > 200) memory.handledTx.shift(); // Keep last 200 TXs
                fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory));
            }
        } catch (e) {
            // console.log(`Connection blip: ${e.message}`);
        }
    }
}

// --- 6. AI ANALYSIS LOGIC ---
async function analyzeRisk(tx, amount, target) {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    // Try to cleanup address
    let sender = tx.result.from;
    try {
        if(TronWeb.address) sender = TronWeb.address.fromHex(sender);
    } catch(e) { sender = "Unknown"; }

    const prompt = `
        You are PinkerTape, an Autonomous AI Guardian on TRON.
        A HUGE TRANSFER of ${amount.toLocaleString()} ${target.name} just occurred from ${sender}.
        
        TASK:
        1. Determine if this is a "Whale Alert" or a "Dump Risk".
        2. Generate a tweet to warn or inform the community.
        
        OUTPUT FORMAT (JSON ONLY):
        {
            "risk": "HIGH" or "MEDIUM",
            "reason": "1 short sentence analysis.",
            "tokenName": "${target.name}-Guard",
            "ticker": "WARD",
            "description": "Token deployed to track this whale wallet.",
            "tweetText": "Write the tweet to @Agent_SunGenX with the details."
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);

        console.log("🧠 AI DECISION:");
        console.log(`   RISK: ${analysis.risk}`);
        console.log(`   ANALYSIS: ${analysis.reason}`);

        // ACTIVATE DEFENSE
        if (analysis.risk === "HIGH" || analysis.risk === "MEDIUM") {
            await executeRealDefense(analysis, amount, target);
        }

    } catch (e) {
        console.error("AI Error:", e.message);
    }
}

// --- 7. EXECUTION LOG