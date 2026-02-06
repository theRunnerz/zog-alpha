/* agent/guardian.js - FINAL VERSION: VIPs + DAILY REPORT + GEMINI VISUALS */
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

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// Twitter Client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// 👑 VIP WATCHLIST (Triggers alerts regardless of amount)
const VIP_LIST = [
    { name: "JUSTIN SUN", address: "TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N" }, 
    { name: "TRON DAO", address: "TF5j4f68vjVjTqT6AAcR6S5Q72i7r5tK3" }      
];

// 🛡️ THE TRON ECOSYSTEM WATCHLIST
const WATCH_LIST = [
    { name: "$SUNAI", address: "TEyzUNwZMuMsAXqdcz5HZrshs3iWfydGAW", decimals: 18, threshold: 5000000 },
    { name: "USDT", address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", decimals: 6, threshold: 50000 },
    { name: "SUN", address: "TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3s", decimals: 18, threshold: 10000 },
    { name: "JST", address: "TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9", decimals: 18, threshold: 20000 },
    { name: "BTT", address: "TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4", decimals: 18, threshold: 10000000 },
    { name: "WIN", address: "TLa2f6J26qCmf6ELRRnPaMHgck0dPrQtqK", decimals: 6, threshold: 500000 }
];

// --- 2. MEMORY SYSTEM ---
const MEMORY_FILE = path.join(__dirname, 'agent_memory.json');
let memory = { stats: { totalScans: 0, lastBriefing: Date.now() }, handledTx: [], alerts: [] };

try {
    if (fs.existsSync(MEMORY_FILE)) {
        const rawData = fs.readFileSync(MEMORY_FILE, 'utf8');
        if (rawData.trim()) {
            const loaded = JSON.parse(rawData);
            memory = { ...memory, ...loaded };
            if (!memory.stats) memory.stats = { totalScans: 0, lastBriefing: Date.now() };
        }
    }
} catch (e) { console.log("⚠️ Memory Logic Reset"); }

function saveMemory() { fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2)); }

console.log("\n🤖 PINKERTAPE SENTINEL (GEMINI VISUAL MODE) ONLINE");
console.log(`👑 Watching VIP: Justin Sun`);
console.log("🎨 Images: Architected by Gemini 1.5");
console.log("----------------------------------------------------\n");

// --- 3. MAIN LOOP ---
async function startPatrol() {
    console.log("...Scanning Blockchain Mempool...");
    await checkTargets(); // Initial run
    setInterval(checkTargets, 15000); 
    setInterval(checkDailyBriefing, 60000); // Check every minute if 24h passed
}

// --- 4. DAILY BRIEFING ---
async function checkDailyBriefing() {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000; 

    if ((now - memory.stats.lastBriefing) > ONE_DAY) {
        console.log("\n📜 GENERATING DAILY SECURITY BRIEFING...");
        const uniqueID = Math.floor(Math.random() * 9000);
        const scans = memory.stats.totalScans || 0;
        
        const briefingText = `
🛡️ DAILY SECURITY REPORT

✅ System Status: ONLINE
📡 Scans: ${scans.toLocaleString()}
🌊 Threat Level: STABLE

Watching for @justinsuntron movements.
CC: @Agent_SunGenX @Girl_SunLumi

#TRON #PinkerTape #ID${uniqueID}
        `.trim();

        try {
            await twitterClient.v2.tweet(briefingText);
            console.log(`✅ DAILY BRIEFING POSTED!`);
            memory.stats.lastBriefing = now;
            memory.stats.totalScans = 0;
            saveMemory();
        } catch (e) { console.error("❌ BRIEFING ERROR"); }
    }
}

// --- 5. CHECK LOGIC (VIP + WHALE) ---
async function checkTargets() {
    memory.stats.totalScans += WATCH_LIST.length; 
    saveMemory(); 

    for (const target of WATCH_LIST) {
        const url = `${TRON_API}/v1/contracts/${target.address}/events?event_name=Transfer&limit=5`;
        try {
            const res = await axios.get(url);
            if (!res.data.success) continue;

            const events = res.data.data;

            for (const tx of events) {
                if (memory.handledTx.includes(tx.transaction_id)) continue;

                // 1. Process Values
                let rawVal = parseInt(tx.result.value);
                let divisor = Math.pow(10, target.decimals);
                let readableAmount = rawVal / divisor;
                
                // 2. Determine Sender
                let senderAddr = tx.result.from;
                try { if (TronWeb.address) senderAddr = TronWeb.address.fromHex(senderAddr); } catch(e) {}

                // 3. CHECK FOR VIP (Justin Sun)
                const vipMatch = VIP_LIST.find(v => v.address === senderAddr);
                
                console.log(`🔎 Scan: ${readableAmount.toFixed(2)} ${target.name}`);

                // 4. TRIGGER DECISION
                if (readableAmount > target.threshold || vipMatch) {
                    if (vipMatch) console.log(`\n👑 VIP MOVEMENT DETECTED: ${vipMatch.name} moved ${target.name}!`);
                    else console.log(`\n🚨 WHALE MOVEMENT DETECTED: ${target.name}`);

                    await analyzeRisk(tx, readableAmount, target, senderAddr, vipMatch);
                }

                memory.handledTx.push(tx.transaction_id);
                if (memory.handledTx.length > 200) memory.handledTx.shift(); 
                saveMemory();
            }
        } catch (e) { /* ignore network blips */ }
    }
}

// --- 6. AI ANALYSIS LOGIC (Gemini Architects the Prompt) ---
async function analyzeRisk(tx, amount, target, sender, vipMatch) {
    console.log("...Consulting Gemini Brain...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Dynamic Context based on VIP
    let contextStr = `Analyze normal whale movement.`;
    if (vipMatch) {
        contextStr = `CRITICAL: The Sender is ${vipMatch.name}. This is a VIP/Founder address. Tone: "COMMANDER ALERT".`;
    }

    const prompt = `
        You are PinkerTape, an Autonomous AI Sentinel on TRON.
        EVENT: Asset: ${target.name}, Amount: ${amount.toLocaleString()}
        SENDER: ${sender} ${vipMatch ? `(IDENTITY: ${vipMatch.name})` : ""}
        CONTEXT: ${contextStr}
        
        TASK:
        1. Determine Risk Level. If VIP, Risk = "STRATEGIC".
        2. Create a Ticker/Name for a reaction token.
        3. Write a Tweet requesting action.
        4. DESIGN A VISUAL: Write a short, vivid description for a Cyberpunk/Tron style image.
           Example: "Cyberpunk whale swimming in a digital red ocean of numbers."

        OUTPUT FORMAT (JSON ONLY):
        {
            "risk": "HIGH",
            "reason": "1 short sentence analysis.",
            "tokenName": "Token Name",
            "ticker": "TICKER",
            "imagePrompt": "Description of the image to generate"
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);

        console.log("🧠 GEMINI DECISION:");
        console.log(`   RISK: ${analysis.risk}`);
        console.log(`   VISUAL: ${analysis.imagePrompt}`);

        // Always execute defense if it's a VIP, otherwise strictly High/Medium
        if (vipMatch || analysis.risk === "HIGH" || analysis.risk === "MEDIUM" || analysis.risk === "STRATEGIC") {
            await executeRealDefense(analysis, amount, target.name, tx.transaction_id, vipMatch);
        }

    } catch (e) {
        console.error("AI Error:", e.message);
    }
}

// --- 7. EXECUTION (RENDER & TWEET) ---
async function executeRealDefense(analysis, amount, tokenName, txID, vipMatch) {
    console.log("\n⚡ EXECUTING DEFENSE PROTOCOLS...");
    const uniqueID = Math.floor(Math.random() * 90000) + 10000;

    // Custom Header for Justin Sun
    let header = `🚨 ${tokenName} MOVEMENT DETECTED 🚨`;
    if (vipMatch) header = `👑 COMMANDER ALERT: ${vipMatch.name} ACTIVE 👑`;

    const statusText = `
${header}

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
        
        const alertData = {
            timestamp: new Date().toISOString(),
            token: tokenName,
            isVIP: !!vipMatch,
            amount: amount.toLocaleString(),
            risk: analysis.risk,
            tweet: statusText
        };
        
        if (!memory.alerts) memory.alerts = [];
        memory.alerts.unshift(alertData);
        if (memory.alerts.length > 20) memory.alerts.pop();
        saveMemory();

    } catch (e) {
        console.error("❌ TWITTER ERROR:", e.message);
    }
    
    console.log("----------------------------------------------------\n");
}

startPatrol();