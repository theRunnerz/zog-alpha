/* agent/god_mode.js - UPDATED FOR REALISM */
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

console.log("\n⚡ GOD MODE: DIRECTORS CUT ⚡");
console.log("--------------------------------");
console.log("1. 🐳 Simulate WHALE ATTACK");
console.log("2. 💰 Simulate DEFI PAYOUT (Win)");
console.log("3. ⚡ Simulate FLASH MARKET (Open Signal)");
console.log("--------------------------------");

rl.question('Select Action (1-3): ', async (answer) => {
    if (answer === '1') await triggerFakeWhale();
    else if (answer === '2') await triggerFakePayout();
    else if (answer === '3') await triggerFakePrediction();
    else console.log("❌ Invalid selection.");
    rl.close();
});

async function triggerFakeWhale() {
    console.log("\n🎬 ACTION! Simulating Whale Attack...");
    const uniqueID = Math.floor(Math.random() * 9999);
    const amount = Math.floor(Math.random() * 5000000) + 10000000;
    
    const statusText = `🚨 MOVEMENT: ${amount.toLocaleString()} $SUNAI\nIntel: Liquidity Injection Detected\n\nName: Void-Ray-${uniqueID}\nTicker: $VRAY\n\nDeploying @Agent_SunGenX | Monitor @Girl_SunLumi\n[Ref: ${uniqueID}]`;

    try {
        const imageUrl = `https://robohash.org/${uniqueID}.png?set=set1&bgset=bg1&size=600x600`;
        const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const mediaId = await twitterClient.v1.uploadMedia(Buffer.from(imageBuffer.data), { mimeType: 'image/png' });

        const tweet = await twitterClient.v2.tweet({
            text: statusText,
            media: { media_ids: [mediaId] }
        });
        console.log(`✅ CUT! Tweet Posted: https://twitter.com/user/status/${tweet.data.id}`);
    } catch (e) { console.error(e.message); }
}

async function triggerFakePayout() {
    console.log("\n🎬 ACTION! Simulating DeFi Payout...");
    const profit = "4.20x";
    const volume = "1,250,000";
    // Using a timestamp to make it look recent
    const time = new Date().toISOString().split('T')[1].split('.')[0]; 
    
    // We simulate hitting the target
    const msg = `💰 MARKET SETTLEMENT [${time} UTC]\n\nResult: ✅ WIN 🎯\nStrike: $0.2650\nAct: $0.2710\n\n📊 POOL STATS:\nVol: ${volume} TRX\nYield: ${profit} APY 🚀\n\n"The Oracle speaks."\n#TRON #DeFi #Payout`;
    
    try {
        const tweet = await twitterClient.v2.tweet(msg);
        console.log(`✅ CUT! Payout Posted: https://twitter.com/user/status/${tweet.data.id}`);
    } catch (e) { console.error(e.message); }
}

async function triggerFakePrediction() {
    console.log("\n🎬 ACTION! Simulating Flash Market...");
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].slice(0, 5); // HH:MM
    
    // Random target slightly above market
    const target = (Math.random() * (0.30 - 0.28) + 0.28).toFixed(4); 
    const conf = Math.floor(Math.random() * (95 - 75) + 75);

    // CHANGED TO "FLASH MARKET" so it makes sense to post anytime
    const msg = `⚡ FLASH MARKET [${time} UTC]\n\nAsset: $TRX \nTarget: $${target} \nAI Conf: ${conf}% (High Volatility)\n\n🗳️ QUICK BET:\n❤️ Like = LONG\n🔁 RT = SHORT\n\n#TRON #Flash #AI`;

    try {
        const tweet = await twitterClient.v2.tweet(msg);
        console.log(`✅ CUT! Prediction Posted: https://twitter.com/user/status/${tweet.data.id}`);
    } catch (e) { console.error(e.message); }
}