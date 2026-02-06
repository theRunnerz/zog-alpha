/* agent/guardian.js - VERSION: DAILY BRIEFING + WHALE ALERTS */
import dotenv from 'dotenv';
import TronWeb from 'tronweb';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- 1. SETUP & CONFIGURATION ---

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
const WATCH_LIST = [
    { name: "$SUNAI", address: "TEyzUNwZMuMsAXqdcz5HZrshs3iWfydGAW", decimals: 18, threshold: 5000000 },
    { name: "USDT", address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", decimals: 6, threshold: 50000 },
    { name: "SUN", address: "TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3s", decimals: 18, threshold: 10000 },
    { name: "JST", address: "TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9", decimals: 18, threshold: 20000 },
    { name: "BTT", address: "TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4", decimals: 18, threshold: 10000000 },
    { name: "WIN", address: "TLa2f6J26qCmf6ELRRnPaMHgck0dPrQtqK", decimals: 6, threshold: 500000 }
];

// --- 2. MEMORY SYSTEM (Self-Healing + Stats) ---
const MEMORY_FILE = path.join(__dirname, 'agent_memory.json');
let memory = { 
    handledTx: [], 
    alerts: [],
    stats: { totalScans: 0, lastBriefing: Date.now() } // Default to 'now' so we wait 24h for first tweet
};

// Robust Load
try {
    if (fs.existsSync(MEMORY_FILE)) {
        const rawData = fs.readFileSync(MEMORY_FILE, 'utf8');
        if (rawData.trim()) {
            const loaded = JSON.parse(rawData);
            memory = { ...memory, ...loaded }; // Merge defaults with loaded data
            if (!memory.stats) memory.stats = { totalScans: 0, lastBriefing: Date.now() };
        }
    }
} catch (e) {
    console.log("⚠️ Memory File Corrupt. Auto-healing...");
    // Keep defaults
}

function saveMemory() {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

// Initialize AI
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

console.log("\n🤖 PINKERTAPE SENTINEL (LIVE + DAILY REPORTING) ONLINE");
console.log(`👁️  Connected to TRON Mainnet.`);
console.log(`🐦 Twitter Relay: ACTIVE`);
console.log("----------------------------------------------------\n");

// --- 3. MAIN LOOP ---
async function startPatrol() {
    console.log("...Scanning Blockchain Mempool...");
    
    // Initial Run
    await checkTargets();
    
    // 15 Second Loop for Alerts
    setInterval(checkTargets, 15000); 

    // 60 Second Loop for Daily Briefing Check
    setInterval(checkDailyBriefing, 60000);
}

// --- 4. DAILY BRIEFING LOGIC ---
async function checkDailyBriefing() {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000; // 24 Hours in milliseconds
    const timeSince = now - memory.stats.lastBriefing;

    // Optional Log to let you know it checks
    // console.log(`⏳ Time until Daily Briefing: ${((ONE_DAY - timeSince)/1000/60/60).toFixed(1)} hours`);

    if (timeSince > ONE_DAY) {
        console.log("\n📜 GENERATING DAILY SECURITY BRIEFING...");
        
        const uniqueID = Math.floor(Math.random() * 9000);
        const scans = memory.stats.totalScans || 0;
        
        const briefingText = `
🛡️ DAILY SECURITY REPORT

✅ System Status: ONLINE
📡 Scans Performed: ${scans.toLocaleString()}
🌊 Sector Threat Level: STABLE

Scanning for Whale movements and Anomalies.
CC: @Agent_SunGenX @Girl_SunLumi

#TRON #PinkerTape #Security #ID${uniqueID}
        `.trim();

        try {
            const tweet = await twitterClient.v2.tweet(briefingText);
            console.log(`✅ DAILY BRIEFING POSTED! ID: ${tweet.data.id}`);
            
            // Reset Stats after successful tweet
            memory.stats.lastBriefing = now;
            memory.stats.totalScans = 0;
            saveMemory();

        } catch (e) {
            console.error("❌ BRIEFING ERROR:", e.message);
        }
        console.log("----------------------------------------------------\n");
    }
}

// --- 5. CHECK LOGIC (ALERT SYSTEM) ---
async function checkTargets() {
    // Increment scan counter for the Daily Report
    memory.stats.totalScans += WATCH_LIST.length; 
    saveMemory(); // Save stats increment

    for (const target of WATCH_LIST) {
        const url = `${TRON_API}/v1/contracts/${target.address}/events?event_name=Transfer&limit=5`;
        try {
            const res = await axios.get(url);
            if (!res.data.success) continue;

            const events = res.data.data;

            for (const tx of events) {
                // VISUAL HEARTBEAT
                if (memory.handledTx.includes(tx.transaction_id)) {
                    // console.log(`➡️  [SKIP] Known TX: ${target.name}`); // Uncomment if you want spam
                    continue;
                }

                let rawVal = parseInt(tx.result.value);
                let divisor = Math.pow(10, target.decimals);
                let readableAmount = rawVal / divisor;

                // NEW TRANSACTION FOUND
                console.log(`🔎 NEW TRANSACTION: ${readableAmount.toLocaleString()} ${target.name}`);

                if (readableAmount > target.threshold) {
                    console.log(`\n🚨 ALERT: SIGNIFICANT ${target.name} MOVEMENT (${readableAmount.toLocaleString()} > ${target.threshold})`);
                    await analyzeRisk(tx, readableAmount, target);
                }

                // Add to memory
                memory.handledTx.push(tx.transaction_id);
                if (memory.handledTx.length > 200) memory.handledTx.shift(); 
                saveMemory();
            }
        } catch (e) { /* ignore network blips */ }
    }
}

// --- 6. AI ANALYSIS LOGIC ---
async function analyzeRisk(tx, amount, target) {
    console.log("...Consulting Gemini Brain...");
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    let sender = tx.result.from;
    try {
        if(TronWeb.address) sender = TronWeb.address.fromHex(sender);
    } catch(e) { sender = "Unknown"; }

    const prompt = `
        You are PinkerTape, an Autonomous AI Sentinel on TRON.
        EVENT: Asset: ${target.name}, Amount: ${amount.toLocaleString()}, Sender: ${sender}
        CONTEXT:
        If asset is USDT, SUN, JST -> Analyze as "Whale Alert" or "Liquidity Shift".
        If asset is $SUNAI -> Analyze as "DUMP RISK" or "Rug Pull Warning".
        
        TASK:
        1. Determine Risk Level (HIGH/MEDIUM).
        2. Create a specific, catchy Ticker and Name for a reaction token.
        3. Write a short tweet.

        OUTPUT FORMAT (JSON ONLY):
        {
            "risk": "HIGH",
            "reason": "1 short sentence analysis.",
            "tokenName": "Creative Reaction Token Name",
            "ticker": "TICKER",
            "description": "Short description of this event token."
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);

        console.log("🧠 AI DECISION:");
        console.log(`   RISK: ${analysis.risk}`);
        console.log(`   IDEA: ${analysis.tokenName} ($${analysis.ticker})`);

        if (analysis.risk === "HIGH" || analysis.risk === "MEDIUM") {
            await executeRealDefense(analysis, amount, target.name, tx.transaction_id);
        }

    } catch (e) {
        console.error("AI Error:", e.message);
    }
}

// --- 7. EXECUTION & TWEETING ---
async function executeRealDefense(analysis, amount, tokenName, txID) {
    console.log("\n⚡ EXECUTING DEFENSE PROTOCOLS...");
    
    // ✅ UNIQUE ID avoids duplicate error
    const uniqueID = Math.floor(Math.random() * 90000) + 10000;

    // 🔥 TAGS BOTH AGENTS
    const statusText = `
🚨 ${tokenName} MOVEMENT DETECTED 🚨

Amount: ${amount.toLocaleString()} ${tokenName}
Analysis: ${analysis.reason}

Requesting @Agent_SunGenX deployment:
Name: ${analysis.tokenName}
Ticker: $${analysis.ticker}

Requesting @Girl_SunLumi analytics:
#TRON #PinkerTape #ID${uniqueID}
    `.trim();

    try {
        const tweet = await twitterClient.v2.tweet(statusText);
        console.log(`✅ TWEET POSTED! ID: ${tweet.data.id}`);
        
        // Dashboard Log
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
        saveMemory();

    } catch (e) {
        console.error("❌ TWITTER API ERROR:", e.message);
        if(e.data) console.log(JSON.stringify(e.data));
    }
    
    console.log("----------------------------------------------------\n");
}

startPatrol();