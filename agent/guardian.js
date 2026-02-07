/* agent/guardian.js - VERSION: CONCURRENCY LOCK (Prevents Double-Posting) */
import dotenv from 'dotenv';
import TronWeb from 'tronweb';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- 0. GLOBAL SAFETY LOCKS ---
let isScanning = false; // <--- PREVENTS OVERLAPS
process.on('uncaughtException', (err) => { console.log(`\n⚠️ ERROR: ${err.message}`); });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// API Keys
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const TRON_API = "https://api.trongrid.io"; 
const PRICE_API = "https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT";

// 🧠 MODEL: Gemini 3
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// Twitter Client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// 👑 VIP WATCHLIST
const VIP_LIST = [
    { name: "JUSTIN SUN", address: "TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N" }, 
    { name: "TRON DAO", address: "TF5j4f68vjVjTqT6AAcR6S5Q72i7r5tK3" }      
];

// 🛡️ TOKEN WATCHLIST
const WATCH_LIST = [
    { name: "$SUNAI", address: "TEyzUNwZMuMsAXqdcz5HZrshs3iWfydGAW", decimals: 18, threshold: 5000000 },
    { name: "USDT", address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", decimals: 6, threshold: 50000 },
    { name: "SUN", address: "TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3s", decimals: 18, threshold: 10000 },
    { name: "JST", address: "TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9", decimals: 18, threshold: 20000 },
    { name: "WIN", address: "TLa2f6J26qCmf6ELRRnPaMHgck0dPrQtqK", decimals: 6, threshold: 500000 }
];

// --- 2. MEMORY SYSTEM ---
const MEMORY_FILE = path.join(__dirname, 'agent_memory.json');
let memory = { 
    stats: { totalScans: 0, lastBriefing: Date.now() }, 
    market: { lastPrice: 0 },
    mentions: { lastId: null }, 
    handledTx: [], 
    alerts: [] 
};

// ⏳ TWEET COOLDOWN (Increased to 3 Minutes for safety)
let lastTweetTime = 0; 
const COOLDOWN_MS = 180000; 

try {
    if (fs.existsSync(MEMORY_FILE)) {
        const rawData = fs.readFileSync(MEMORY_FILE, 'utf8');
        if (rawData.trim()) {
            const loaded = JSON.parse(rawData);
            memory = { ...memory, ...loaded };
        }
    }
} catch (e) { console.log("⚠️ Memory Reset"); }

function saveMemory() { fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2)); }

console.log("\n🤖 PINKERTAPE SENTINEL (LOCKED MODE) ONLINE");
console.log("🔒 Status: Concurrency Lock Active (No Overlaps)");
console.log("----------------------------------------------------\n");

// --- 3. MAIN LOOP ---
async function startPatrol() {
    let botId = null;
    try {
        const me = await twitterClient.v2.me();
        botId = me.data.id;
        console.log(`🆔 Identity Confirmed: @${me.data.username}`);
    } catch (e) {
        console.error("❌ TWITTER KEY ERROR. Check .env.local");
        return;
    }

    // Run loops SAFELY
    setInterval(safeScan, 15000);              // Check Transactions
    setInterval(checkPriceVolatility, 60000);  // Check Price
    setInterval(checkMentionsWrapper, 120000, botId); // Check Repliess
}

// Wrapper to prevent overlap
async function safeScan() {
    if (isScanning) return; // SKIP if busy
    isScanning = true;
    try {
        await checkTargets();
    } catch(e) { console.error("Scan Error:", e.message); }
    isScanning = false;
}

// Wrapper for mentions
async function checkMentionsWrapper(botId) {
    await checkMentions(botId);
}

// --- 4. NEURAL INTERFACE ---
async function checkMentions(botId) {
    try {
        const mentions = await twitterClient.v2.userMentionTimeline(botId, {
            since_id: memory.mentions.lastId ? memory.mentions.lastId : undefined,
            max_results: 5,
            'tweet.fields': ['author_id', 'text'] 
        });

        if (mentions.data.meta.result_count === 0) return;

        const tweets = mentions.data.data.reverse();

        for (const tweet of tweets) {
            if (tweet.author_id === botId) { 
                memory.mentions.lastId = tweet.id;
                saveMemory();
                continue;
            }

            console.log(`📨 Incoming: "${tweet.text}"`);
            const replyText = await generateAIReply(tweet.text);
            
            if(replyText) {
                const uniqueReply = `${replyText} \n[Ref:${Math.floor(Math.random()*999)}]`;
                await twitterClient.v2.reply(uniqueReply, tweet.id);
                console.log(`🗣️ Replied: "${uniqueReply}"`);
            }

            memory.mentions.lastId = tweet.id;
            saveMemory();
        }
    } catch (e) { /* Quiet fail */ }
}

async function generateAIReply(userText) {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const lastPrice = memory.market.lastPrice || "Unknown";
    const prompt = `You are PinkerTape, AI on TRON. Input: "${userText}". TRX: $${lastPrice}. Reply robotic, <180 chars.`;
    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (e) { return null; }
}

// --- 6. MARKET VOLATILITY ---
async function checkPriceVolatility() {
    try {
        const res = await axios.get(PRICE_API);
        const currentPrice = parseFloat(res.data.price);
        const lastPrice = memory.market.lastPrice;

        if (!lastPrice || lastPrice === 0) {
            memory.market.lastPrice = currentPrice;
            saveMemory();
            return; 
        }

        const diff = currentPrice - lastPrice;
        const percentChange = (diff / lastPrice) * 100;

        if (Math.abs(percentChange) >= 2.0) {
            console.log(`\n🚨 MARKET ALERT: TRX MOVED ${percentChange.toFixed(2)}%`);
            await analyzeMarketVol(currentPrice, percentChange);
            memory.market.lastPrice = currentPrice;
            saveMemory();
        }
    } catch (e) { /* ignore */ }
}

// --- 7. WHALE & VIP CHECK ---
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
                let rawVal = parseInt(tx.result.value);
                let divisor = Math.pow(10, target.decimals);
                let readableAmount = rawVal / divisor;
                let senderAddr = tx.result.from || "";
                
                try { if (TronWeb.address) senderAddr = TronWeb.address.fromHex(senderAddr); } catch(e) {}

                // CHECK MEMORY FIRST
                if (memory.handledTx.includes(tx.transaction_id)) continue; 

                // Threshold Check
                const vipMatch = VIP_LIST.find(v => v.address === senderAddr);
                
                // Visual Log (Compact)
                if (readableAmount > target.threshold) {
                    process.stdout.write(`⚡ Found: ${readableAmount.toFixed(0)} ${target.name}... `);
                    
                    // SAVE IMMEDIATELY TO PREVENT RE-ENTRY
                    memory.handledTx.push(tx.transaction_id);
                    if (memory.handledTx.length > 200) memory.handledTx.shift(); 
                    saveMemory();

                    // THEN ANALYZE
                    await analyzeRisk(tx, readableAmount, target, senderAddr, vipMatch);
                }
            }
        } catch (e) { /* ignore */ }
    }
}

// --- 8. AI ANALYSIS: MARKET ---
async function analyzeMarketVol(price, percent) {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const direction = percent > 0 ? "SURGE" : "CRASH";
    try {
        const prompt = `PinkerTape Alert. TRX Price ${direction} ${percent.toFixed(2)}%. JSON output: { "risk": "VOLATILITY", "reason": "Market move", "tokenName": "Market Pulse", "ticker": "VOL" }`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);
        await executeRealDefense(analysis, `TRX PRICE`, direction, "MARKET_EVENT", false);
    } catch(e) { console.error("AI Error"); }
}

// --- 9. AI ANALYSIS: WHALES ---
async function analyzeRisk(tx, amount, target, sender, vipMatch) {
    if (Date.now() - lastTweetTime < COOLDOWN_MS) { 
        console.log(`(Cooldown Active - Logged Only)`);
        return;
    }

    console.log(`\n🚨 ANALYZING WHALE: ${target.name}`);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    let contextStr = `Analyze whale movement.`;
    if (vipMatch) contextStr = `CRITICAL: Sender is ${vipMatch.name}. Tone: "COMMANDER ALERT".`;

    const prompt = `
        You are PinkerTape, an Advanced Military AI on TRON.
        EVENT: Scanned Token: ${target.name}, Amount: ${amount.toLocaleString()}
        SENDER: ${sender} ${vipMatch ? `(IDENTITY: ${vipMatch.name})` : ""}
        
        TASK:
        1. ANALYZE the move. Speculate intent.
        2. INVENT a unique Defense Unit Name (e.g., "Aegis-7").
        3. CREATE a unique ticker (e.g., $AEGIS).
        
        OUTPUT JSON ONLY:
        { 
            "risk": "HIGH", 
            "reason": "Tactical liquidity injection detected.", 
            "tokenName": "Aegis-7 Protocol", 
            "ticker": "AEGIS"
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);

        console.log("🧠 PLAN:", analysis.tokenName);
        await executeRealDefense(analysis, amount, target.name, tx.transaction_id, vipMatch);

    } catch (e) {
        const emergencyAnalysis = {
            risk: "HIGH",
            reason: `Volumetric shift on ${target.name}.`,
            tokenName: `Sentinel-${Math.floor(Math.random()*999)}`, 
            ticker: "DEF"
        };
        await executeRealDefense(emergencyAnalysis, amount, target.name, tx.transaction_id, vipMatch);
    }
}

// --- 10. EXECUTION ---
async function executeRealDefense(analysis, amount, tokenName, txID, vipMatch) {
    if (Date.now() - lastTweetTime < COOLDOWN_MS) return;

    console.log("⚡ EXECUTING DEFENSE...");
    lastTweetTime = Date.now(); 
    
    const nowLog = new Date().toISOString().split('T')[1].split('.')[0]; 
    const uniqueID = Math.floor(Math.random() * 90000) + 10000;
    const displayName = analysis.tokenName || "Protocol Alpha";

    // 🔄 RANDOMIZED TEMPLATES + MENTIONS
    const templates = [
        `[LOG: ${nowLog}]\nTarget: ${tokenName}\nVolume: ${amount.toLocaleString()}\nData: ${analysis.reason}\n\nDeploying @Agent_SunGenX | Monitor: @Girl_SunLumi\n[Unit: ${displayName} | $${analysis.ticker}]\nRef: ${uniqueID}`,
        
        `[SCAN_COMPLETE]\nAsset: ${tokenName}\nMoved: ${amount.toLocaleString()}\nIntel: "${analysis.reason}"\n\nActive: ${displayName} ($${analysis.ticker})\nCC: @Agent_SunGenX @Girl_SunLumi\nTX: ${uniqueID}`,
        
        `:: PinkerTape Sentinel ::\nDetected: ${amount.toLocaleString()} ${tokenName}\nAnalysis: ${analysis.reason}\n\nReporting to @Agent_SunGenX & @Girl_SunLumi\nUnit: ${displayName} ($${analysis.ticker})\nID: ${uniqueID}`
    ];

    const statusText = templates[Math.floor(Math.random() * templates.length)];

    let mediaIds = [];

    // --- 🎨 IMAGE GENERATION ---
    try {
        console.log("🎨 Generating...");
        const uniqueKey = `${analysis.ticker}-${uniqueID}`;
        const imageUrl = `https://robohash.org/${uniqueKey}.png?set=set1&bgset=bg1&size=600x600`;
        const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 20000 });
        const mediaId = await twitterClient.v1.uploadMedia(Buffer.from(imageBuffer.data), { mimeType: 'image/png' });
        mediaIds = [mediaId];

    } catch (imgError) {
        console.error(`⚠️ Image Skipped: ${imgError.message}`);
    }

    // ⭐ LIVE TWEET ⭐
    try {
        const tweet = await twitterClient.v2.tweet({
            text: statusText,
            media: mediaIds.length > 0 ? { media_ids: mediaIds } : undefined
        });

        console.log(`✅ POSTED: ${tweet.data.id}`);
        
        if (!memory.alerts) memory.alerts = [];
        memory.alerts.unshift({ 
            timestamp: new Date(), 
            token: tokenName,
            amount: amount,                 
            risk: analysis.risk || "HIGH",  
            reason: analysis.reason,        
            tweet: statusText
        });
        saveMemory();

    } catch (e) {
        console.error(`❌ TWITTER ERROR: ${e.code || e.message}`);
        if(e.code === 403) lastTweetTime = Date.now() + 600000; // 10m Penalty
    }
    
    console.log("----------------------------------------------------\n");
}

startPatrol();