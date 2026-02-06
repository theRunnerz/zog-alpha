/* agent/guardian.js - VERSION: TIMESTAMP BYPASS (Final Fix) */
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
const PRICE_API = "https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT";

// 🧠 MODEL: Gemini 3 Flash Preview (High Intelligence)
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

// --- 2. MEMORY & COOLDOWN SYSTEM ---
const MEMORY_FILE = path.join(__dirname, 'agent_memory.json');
let memory = { 
    stats: { totalScans: 0, lastBriefing: Date.now() }, 
    market: { lastPrice: 0 },
    mentions: { lastId: null }, 
    handledTx: [], 
    alerts: [] 
};

// ⏳ GLOBAL COOLDOWN TRACKER
let lastTweetTime = 0; 

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

console.log("\n🤖 PINKERTAPE SENTINEL (TIMESTAMP BYPASS) ONLINE");
console.log("🛡️ Status: Anti-Spam Protocols + Text Fallback");
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

    console.log("...Scanning Protocols Active...");
    
    // Initial Run
    await checkTargets(); 
    await checkPriceVolatility();
    await checkMentions(botId);

    // Loops
    setInterval(checkTargets, 15000);             
    setInterval(checkPriceVolatility, 60000);     
    setInterval(checkDailyBriefing, 60000);       
    setInterval(() => checkMentions(botId), 120000); 
}

// --- 4. NEURAL INTERFACE (No Dupes) ---
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
    
    const prompt = `
        You are PinkerTape, an AI Sentinel on TRON.
        User Input: "${userText}"
        Context: TRX Price: $${lastPrice}.
        Reply Personality: Robotic, Efficient. Under 180 chars. No hashtags.
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (e) { return null; }
}

// --- 5. DAILY BRIEFING ---
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

                const isKnown = memory.handledTx.includes(tx.transaction_id);
                
                // Visual Log
                const logSymbol = isKnown ? "👁️" : "🆕";
                process.stdout.write(`${logSymbol} Scan: ${readableAmount.toFixed(0).padEnd(5)} ${target.name} \r`);
                
                if (isKnown) continue; 

                console.log(`\n🆕 NEW SIGNAL: ${readableAmount.toFixed(2)} ${target.name}`);

                const vipMatch = VIP_LIST.find(v => v.address === senderAddr);
                
                if (readableAmount > target.threshold || vipMatch) {
                    await analyzeRisk(tx, readableAmount, target, senderAddr, vipMatch);
                }

                memory.handledTx.push(tx.transaction_id);
                if (memory.handledTx.length > 200) memory.handledTx.shift(); 
                saveMemory();
            }
        } catch (e) { /* ignore */ }
    }
}

// --- 8. AI ANALYSIS: MARKET ---
async function analyzeMarketVol(price, percent) {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const direction = percent > 0 ? "SURGE" : "CRASH";
    const prompt = `
        You are PinkerTape. TRX Price ${direction}! Moved ${percent.toFixed(2)}%.
        TASK: JSON Response Only.
        { "risk": "VOLATILITY", "reason": "Market volatility detected.", "tokenName": "Market Pulse", "ticker": "VOL" }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);
        await executeRealDefense(analysis, `TRX PRICE`, direction, "MARKET_EVENT", false);
    } catch(e) { console.error("AI Market Error"); }
}

// --- 9. AI ANALYSIS: WHALES ---
async function analyzeRisk(tx, amount, target, sender, vipMatch) {
    // 🛡️ COOLDOWN CHECK 1
    if (Date.now() - lastTweetTime < 60000) {
        console.log(`⏳ Tweet Cooldown Active. Skipping ${target} analysis.`);
        return;
    }

    console.log(`🚨 WHALE DETECTED: ${target.name}`);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    let contextStr = `Analyze whale movement.`;
    if (vipMatch) contextStr = `CRITICAL: Sender is ${vipMatch.name}. Tone: "COMMANDER ALERT".`;

    const prompt = `
        You are PinkerTape, an Advanced Military AI on TRON.
        EVENT: Scanned Token: ${target.name}, Amount: ${amount.toLocaleString()}
        SENDER: ${sender} ${vipMatch ? `(IDENTITY: ${vipMatch.name})` : ""}
        
        TASK:
        1. ANALYZE the move. Do not just say "Whale moved". 
           - SPECULATE INTENT: Is it "Accumulation", "Liquidity Injection", "Panic Sell"?
        2. INVENT a unique Defense Unit Name (e.g., "Aegis-7", "Iron_Sentinel", "Ghost-Protocol").
        3. CREATE a unique ticker (e.g., $AEGIS, $IRON, $GHST).
        
        OUTPUT JSON ONLY:
        { 
            "risk": "HIGH", 
            "reason": "Tactical liquidity injection detected. Preparing for market shift.", 
            "tokenName": "Aegis-7 Protocol", 
            "ticker": "AEGIS"
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);

        console.log("🧠 GEMINI DECISION:", analysis.tokenName, `(${analysis.ticker})`);
        await executeRealDefense(analysis, amount, target.name, tx.transaction_id, vipMatch);

    } catch (e) {
        // Fallback Procedure
        const emergencyAnalysis = {
            risk: "HIGH",
            reason: `Large volumetric shift detected on ${target.name}. Strategic monitoring active.`,
            tokenName: `Sentinel-Prime-${Math.floor(Math.random()*999)}`, 
            ticker: "DEF"
        };
        await executeRealDefense(emergencyAnalysis, amount, target.name, tx.transaction_id, vipMatch);
    }
}

// --- 10. EXECUTION ---
async function executeRealDefense(analysis, amount, tokenName, txID, vipMatch) {
    if (Date.now() - lastTweetTime < 60000) return;

    console.log("\n⚡ EXECUTING DEFENSE PROTOCOLS...");
    lastTweetTime = Date.now(); 
    
    // ✅ TIMESTAMP BYPASS - Forces uniqueness at the VERY START of the tweet
    const nowLog = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    const uniqueID = Math.floor(Math.random() * 90000) + 10000;
    const displayName = analysis.tokenName || "Protocol Alpha";

    // 🎲 TEMPLATE RANDOMIZER
    const templates = [
        `[LOG: ${nowLog}] 🚨 ${tokenName} MOVEMENT\n\nVol: ${amount.toLocaleString()}\nIntel: ${analysis.reason}\n\nUnit: ${displayName} ($${analysis.ticker})\n#ID${uniqueID} @Agent_SunGenX`,
        
        `[SYSTEM_${nowLog}] ⚠️ ALERT: ${tokenName}\n\nDetected: ${amount.toLocaleString()}\nAnalysis: ${analysis.reason}\n\nDeploying: ${displayName} ($${analysis.ticker})\nRef: ${uniqueID} @Girl_SunLumi`,
        
        `[SCAN ${nowLog}] 👁️ ON-CHAIN: ${tokenName}\n>> ${amount.toLocaleString()} moved.\n>> "${analysis.reason}"\n\nActive: ${displayName} ($${analysis.ticker})\n#TRON ${uniqueID}`
    ];

    const statusText = templates[Math.floor(Math.random() * templates.length)];

    let mediaIds = [];

    // --- 🎨 IMAGE GENERATION ---
    try {
        console.log("🎨 Generating Unit Avatar...");
        const uniqueKey = `${analysis.ticker}-${uniqueID}`;
        const imageUrl = `https://robohash.org/${uniqueKey}.png?set=set1&bgset=bg1&size=600x600`;
        const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const mediaId = await twitterClient.v1.uploadMedia(Buffer.from(imageBuffer.data), { mimeType: 'image/png' });
        mediaIds = [mediaId];
        console.log("✅ Avatar Uploaded.");

    } catch (imgError) {
        console.error(`⚠️ Visual Render Failed: ${imgError.message}`);
    }

    try {
        const tweet = await twitterClient.v2.tweet({
            text: statusText,
            media: mediaIds.length > 0 ? { media_ids: mediaIds } : undefined
        });

        console.log(`✅ TWEET POSTED! ID: ${tweet.data.id}`);
        
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
        
        // 🚑 403 RESCUE SQUAD: If Image Tweet Fails, Try TEXT ONLY immediately
        if(e.code === 403) {
            console.log("🚨 403 ERROR! Attempting TEXT-ONLY RESCUE...");
            try {
                // Try sending just text with an extra ID to force entry
                const rescueText = `[RETRY ${Math.floor(Math.random()*99)}] ` + statusText;
                await twitterClient.v2.tweet(rescueText);
                console.log("✅ RESCUE TWEET POSTED (Text Only).");
            } catch(retryError) {
                console.log("❌ RESCUE FAILED. Extending cooldown.");
                lastTweetTime = Date.now() + 60000;
            }
        }
    }
    
    console.log("----------------------------------------------------\n");
}

startPatrol();