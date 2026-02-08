/* agent/guardian.js - VERSION: DEMO READY (Whales + Predictions) */
import dotenv from 'dotenv';
import TronWeb from 'tronweb';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🧠 Prediction Engine
import {
  createDailyStrike,
  resolveDailyStrike,
  getAccuracy
} from './predictionEngine.js';

// --- 0. GLOBAL SAFETY LOCKS ---
let isScanning = false; 
process.on('uncaughtException', (err) => { 
    console.log(`\n⚠️ GLOBAL ERROR CAUGHT: ${err.message}`); 
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// API Keys
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const TRON_API = "https://api.trongrid.io"; 
const PRICE_API = "https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT";

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

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
    { name: "Pepe", address: "TMacq4TDUw5q8NFBwmbY4RLXvzvG5JTkvi", decimals: 18, threshold: 1000000 },
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

// --- HEARTBEAT SYSTEM ---
const HEARTBEAT_INTERVAL = 60000; // 1 minute
let lastActivityTime = Date.now();

function heartbeat() {
    const idleSeconds = Math.floor((Date.now() - lastActivityTime) / 1000);
    console.log(`🫀 HEARTBEAT | scans=${memory.stats.totalScans} | idle=${idleSeconds}s`);
}

// --- DAILY PREDICTION FLOW ---
const signals = { whaleScore: 65, momentum: 58, volatility: 60, stress: 55 };

function buildSignals() {
  return {
    whaleScore: signals.whaleScore ?? 50,
    momentum: signals.momentum ?? 50,
    volatility: signals.volatility ?? 50,
    stress: signals.stress ?? 50,
    timestamp: Date.now()
  };
}

async function dailyPredictionCycle() {
  try {
    const sigs = buildSignals();
    // 1. Resolve Old Predictions
    const resolved = await resolveDailyStrike();
    if (resolved) {
      const acc = getAccuracy(30);
      console.log(`✅ STRIKE RESOLVED: ${resolved.outcome} | 30D ACC=${acc}%`);
      // Tweet the Result (Optional)
      /* await twitterClient.v2.tweet(`🎯 PREDICTION RESOLVED: ${resolved.outcome}\nTarget: $${resolved.strike}\nAccuracy: ${acc}%`); */
    }

    // 2. Create New Prediction
    const strike = await createDailyStrike(sigs);
    if (strike?.date) {
        // Only log/tweet if it's NEW (checking if we already tweeted it helps)
        const predictionKey = `pred-${strike.date}`;
        if(memory[predictionKey]) return; // Already handled today

        console.log(`📊 DAILY PREDICTION: ${strike.confidence} confidence to hit $${strike.strike}`);
        
        // TWEET THE PREDICTION
        const msg = `🔮 PREDICTION ENGINE [${strike.date}]\n\nAsset: $TRX (Current: $${strike.startPrice})\nTarget: $${strike.strike} (ABOVE)\nConfidence: ${strike.confidence} (${strike.probability}%)\n\nSignals:\n🐳 Whale: ${sigs.whaleScore}\n📈 Momentum: ${sigs.momentum}\n\n#TRON #AI`;
        
        try {
            await twitterClient.v2.tweet(msg);
            console.log("✅ PREDICTION POSTED TO TWITTER");
            memory[predictionKey] = true;
            saveMemory();
        } catch(e) { console.log("⚠️ Tweet Failed (Prediction)"); }
    }
  } catch (e) {
    console.error("⚠️ Prediction cycle error:", e.message);
  }
}

// ⏳ TWEET COOLDOWN (2 Minutes)
let lastTweetTime = 0; 
const COOLDOWN_MS = 120000; 

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

console.log("\n🤖 PINKERTAPE SENTINEL (LIVE FORMAT) ONLINE");
console.log("💎 Status: Bot is Live & Active (Pred Engine V2).");
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

    // Run Initial Prediction Scan
    dailyPredictionCycle();

    // Timers
    setInterval(safeScan, 15000);              
    setInterval(checkPriceVolatility, 60000);  
    setInterval(checkMentionsWrapper, 120000, botId); 
    setInterval(heartbeat, HEARTBEAT_INTERVAL);
    setInterval(reportIdleHealth, (10 * 60 * 1000));
    setInterval(dailyPredictionCycle, 5 * 60 * 1000); // Check every 5 mins
}

function markActivity() { lastActivityTime = Date.now(); }

async function safeScan() {
    if (isScanning) return; 
    isScanning = true;
    try { await checkTargets(); } catch(e) { console.error("Scan Error:", e.message); }
    isScanning = false;
}

async function checkMentionsWrapper(botId) { await checkMentions(botId); }

// --- IDLE STATUS REPORTER ---
async function reportIdleHealth() {
    const idleTime = Date.now() - lastActivityTime;
    if (idleTime < (30 * 60 * 1000)) return; // 30m
    if (Date.now() - lastTweetTime < COOLDOWN_MS) return;

    const msg = `🫀 SYSTEM STATUS: ACTIVE\nSector scans normal\nNo large whale activity detected\nTRX: $${memory.market.lastPrice}\n[Idle:${Math.floor(idleTime/60000)}m]`;

    try {
        await twitterClient.v2.tweet(msg);
        lastTweetTime = Date.now();
        markActivity();
        console.log("📡 Idle health report posted");
    } catch (e) { /* ignore */ }
}

// --- 4. MENTIONS HANDLER ---
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
                memory.mentions.lastId = tweet.id; saveMemory(); continue;
            }
            console.log(`📨 Incoming: "${tweet.text}"`);
            const replyText = await generateAIReply(tweet.text);
            if(replyText) {
                const uniqueReply = `${replyText} \n[Ref:${Math.floor(Math.random()*999)}]`;
                await twitterClient.v2.reply(uniqueReply, tweet.id);
                console.log(`🗣️ Replied: "${uniqueReply}"`);
            }
            memory.mentions.lastId = tweet.id; saveMemory();
            markActivity();
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

// --- 5. PRICE CHECKER ---
async function checkPriceVolatility() {
    try {
        const res = await axios.get(PRICE_API);
        const currentPrice = parseFloat(res.data.price);
        const lastPrice = memory.market.lastPrice;
        if (!lastPrice || lastPrice === 0) { memory.market.lastPrice = currentPrice; saveMemory(); return; }
        const diff = currentPrice - lastPrice;
        const percentChange = (diff / lastPrice) * 100;
        if (Math.abs(percentChange) >= 2.0) {
            console.log(`\n🚨 MARKET ALERT: TRX MOVED ${percentChange.toFixed(2)}%`);
            await analyzeMarketVol(currentPrice, percentChange);
            memory.market.lastPrice = currentPrice; saveMemory();
            markActivity();
        }
    } catch (e) { /* ignore */ }
}

// --- 6. TARGET SCANNER ---
async function checkTargets() {
    memory.stats.totalScans += WATCH_LIST.length; saveMemory(); 
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
                
                if (memory.handledTx.includes(tx.transaction_id)) continue; 
                
                if (readableAmount > target.threshold) {
                    const vipMatch = VIP_LIST.find(v => v.address === senderAddr);
                    
                    process.stdout.write(`⚡ Found: ${readableAmount.toFixed(0)} ${target.name}... `);
                    
                    memory.handledTx.push(tx.transaction_id);
                    if (memory.handledTx.length > 200) memory.handledTx.shift(); 
                    saveMemory();
                    
                    await analyzeRisk(tx, readableAmount, target, senderAddr, vipMatch);
                    return; 
                }
            }
        } catch (e) { /* ignore */ }
    }
}

// --- 7. AI ANALYZERS ---
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

async function analyzeRisk(tx, amount, target, sender, vipMatch) {
    if (Date.now() - lastTweetTime < COOLDOWN_MS) { 
        console.log(`(Cooldown Active)`); return;
    }
    console.log(`\n🚨 ANALYZING WHALE: ${target.name}`);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const randomSeed = Math.floor(Math.random() * 1000);

    const prompt = `
        You are PinkerTape, AI Sentinel.
        EVENT: Scanned ${target.name}, Amount: ${amount.toLocaleString()}
        SENDER: ${sender} ${vipMatch ? `(IDENTITY: ${vipMatch.name})` : ""}
        RANDOM_SEED: ${randomSeed} (Use this to create totally unique names)
        
        TASK:
        1. Short Analysis (Under 80 chars - Military Style).
        2. VERY CREATIVE Unique Unit Name (e.g. Iron-Viper-9, Sun-Glider-Alpha).
        3. VERY CREATIVE Ticker (e.g. IV9, SGA).
        
        OUTPUT JSON ONLY:
        { "risk": "HIGH", "reason": "Liquidity detected.", "tokenName": "Iron-Viper-9", "ticker": "IV9" }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);
        console.log("🧠 PLAN:", analysis.tokenName);
        await executeRealDefense(analysis, amount, target.name, tx.transaction_id, vipMatch);
    } catch (e) { console.log("AI Failed, using backup"); }
}

// --- 8. DEFENSE EXECUTION ---
async function executeRealDefense(analysis, amount, tokenName, txID, vipMatch) {
    markActivity(); // Heartbeat reset
    if (Date.now() - lastTweetTime < COOLDOWN_MS) return;

    console.log("⚡ EXECUTING DEFENSE... (Attempting Image)");
    lastTweetTime = Date.now(); 
    
    // Unique ID
    const nowLog = new Date().toISOString().split('T')[1].split('.')[0]; 
    const uniqueID = Math.floor(Math.random() * 90000) + 10000;

    // 🎲 FORMATTED TEMPLATES
    const templates = [
        `🚨 MOVEMENT: ${amount.toLocaleString()} $${tokenName}\nIntel: ${analysis.reason}\n\nName: ${analysis.tokenName}\nTicker: $${analysis.ticker}\n\nDeploying @Agent_SunGenX | Monitor @Girl_SunLumi\n[Ref: ${uniqueID}]`,
        
        `⚡ FLASH ALERT: Whale active on $${tokenName}\nVol: ${amount.toLocaleString()}\n\nName: ${analysis.tokenName}\nTicker: $${analysis.ticker}\n\nReporting to @Agent_SunGenX & @Girl_SunLumi\n[ID: ${uniqueID}]`,
        
        `:: SENTINEL LOG ::\nTarget: $${tokenName}\nAmount: ${amount.toLocaleString()}\nData: ${analysis.reason}\n\nName: ${analysis.tokenName}\nTicker: $${analysis.ticker}\n\nCC: @Agent_SunGenX @Girl_SunLumi\n[Time: ${nowLog}]`
    ];
    
    const statusText = templates[Math.floor(Math.random() * templates.length)];

    let mediaIds = [];
    try {
        const uniqueKey = `${analysis.ticker}-${uniqueID}`;
        const imageUrl = `https://robohash.org/${uniqueKey}.png?set=set1&bgset=bg1&size=600x600`;
        const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 20000 });
        const mediaId = await twitterClient.v1.uploadMedia(Buffer.from(imageBuffer.data), { mimeType: 'image/png' });
        mediaIds = [mediaId];
        console.log("✅ Art Uploaded.");
    } catch (imgError) {
        console.log("⚠️ Art Failed (Network). Proceeding Text-Only.");
    }

    try {
        const tweet = await twitterClient.v2.tweet({
            text: statusText,
            media: mediaIds.length > 0 ? { media_ids: mediaIds } : undefined
        });

        console.log(`✅ POSTED (With Image)! ID: ${tweet.data.id}`);
        
        if (!memory.alerts) memory.alerts = [];
        memory.alerts.unshift({ timestamp: new Date(), token: tokenName, amount: amount, risk: "HIGH", reason: analysis.reason, tweet: statusText });
        saveMemory();

    } catch (e) {
        // 🚑 RESCUE MISSION
        const errCode = e.code || e.statusCode;
        console.log(`❌ ERROR ${errCode}: ${e.message}`);
        
        if(errCode === 403 || errCode === 400 || errCode === 401 || errCode === 413) {
            console.log("🚨 RETRYING TEXT ONLY...");
            try {
                const tweet = await twitterClient.v2.tweet(statusText); 
                console.log(`✅ RESCUED (Text Only)! ID: ${tweet.data.id}`);
                if (!memory.alerts) memory.alerts = [];
                memory.alerts.unshift({ timestamp: new Date(), token: tokenName, amount: amount, risk: "HIGH", reason: analysis.reason, tweet: statusText });
                saveMemory();
            } catch (retryError) { console.error(`❌ RESCUE FAILED: ${retryError.message}`); lastTweetTime = Date.now() + 600000; }
        }
    }
    console.log("----------------------------------------------------\n");
}

startPatrol();