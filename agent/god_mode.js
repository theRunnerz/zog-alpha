/* agent/god_mode.js - LOOPING DEMO TOOL */
import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("\n⚡ GOD MODE: DIRECTORS CUT (LOOPING) ⚡");
console.log("-----------------------------------------");
console.log("1. 🐳 Simulate WHALE ATTACK");
console.log("2. 💰 Simulate DEFI PAYOUT (Win)");
console.log("3. ⚡ Simulate FLASH MARKET (Open Signal)");
console.log("4. ❌ EXIT");
console.log("-----------------------------------------");

const ask = () => {
    rl.question('\nSelect Action (1-4): ', async (answer) => {
        if (answer === '1') await triggerFakeWhale();
        else if (answer === '2') await triggerFakePayout();
        else if (answer === '3') await triggerFakePrediction();
        else if (answer === '4') { console.log("👋 Exiting..."); process.exit(0); }
        else console.log("❌ Invalid selection.");
        
        // Loop back to ask again
        ask();
    });
};

// Start the loop
ask();

// --- SCENARIO 1: WHALE ATTACK ---
async function triggerFakeWhale() {
    console.log("🎬 ACTION! Simulating Whale Attack...");
    const uniqueID = Math.floor(Math.random() * 9999);
    const amount = Math.floor(Math.random() * 5000000) + 10000000;
    
    // TWEET TEXT
    const statusText = `🚨 MOVEMENT: ${amount.toLocaleString()} $SUNAI\nIntel: Liquidity Injection Detected\n\nName: Void-Ray-${uniqueID}\nTicker: $VRAY\n\nDeploying @Agent_SunGenX | Monitor @Girl_SunLumi\n[Ref: ${uniqueID}]`;

    try {
        // GENERATE IMAGE
        const imageUrl = `https://robohash.org/${uniqueID}.png?set=set1&bgset=bg1&size=600x600`;
        const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const mediaId = await twitterClient.v1.uploadMedia(Buffer.from(imageBuffer.data), { mimeType: 'image/png' });

        // POST TWEET
        const tweet = await twitterClient.v2.tweet({
            text: statusText,
            media: { media_ids: [mediaId] }
        });
        console.log(`✅ CUT! Tweet Posted: https://twitter.com/user/status/${tweet.data.id}`);
    } catch (e) { console.error("❌ Error:", e.message); }
}

// --- SCENARIO 2: DEFI PAYOUT ---
async function triggerFakePayout() {
    console.log("🎬 ACTION! Simulating DeFi Payout...");
    const profit = "4.20x";
    const volume = "1,250,000";
    const time = new Date().toISOString().split('T')[1].split('.')[0]; 
    
    const msg = `💰 MARKET SETTLEMENT [${time} UTC]\n\nResult: ✅ WIN 🎯\nStrike: $0.2650\nAct: $0.2710\n\n📊 POOL STATS:\nVol: ${volume} TRX\nYield: ${profit} APY 🚀\n\n"The Oracle speaks."\n#TRON #DeFi #Payout`;
    
    try {
        const tweet = await twitterClient.v2.tweet(msg);
        console.log(`✅ CUT! Payout Posted: https://twitter.com/user/status/${tweet.data.id}`);
    } catch (e) { console.error("❌ Error:", e.message); }
}

// --- SCENARIO 3: FLASH MARKET ---
async function triggerFakePrediction() {
    console.log("🎬 ACTION! Simulating Flash Market...");
    const time = new Date().toISOString().split('T')[1].slice(0, 5); // HH:MM
    const target = (Math.random() * (0.30 - 0.28) + 0.28).toFixed(4); 
    const conf = Math.floor(Math.random() * (95 - 75) + 75);

    const msg = `⚡ FLASH MARKET [${time} UTC]\n\nAsset: $TRX \nTarget: $${target} \nAI Conf: ${conf}% (High Volatility)\n\n🗳️ QUICK BET:\n❤️ Like = LONG\n🔁 RT = SHORT\n\n#TRON #Flash #AI`;

    try {
        const tweet = await twitterClient.v2.tweet(msg);
        console.log(`✅ CUT! Prediction Posted: https://twitter.com/user/status/${tweet.data.id}`);
    } catch (e) { console.error("❌ Error:", e.message); }
}