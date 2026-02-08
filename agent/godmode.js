/* agent/god_mode.js - FOR DEMO VIDEO ONLY */
import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function triggerFakeWhale() {
    console.log("🎬 ACTION! Simulating Whale Attack...");
    
    // Fake Data
    const token = "SUNAI";
    const amount = 15000000;
    const uniqueID = Math.floor(Math.random() * 9999);
    
    // The Tweet
    const statusText = `🚨 SIMULATION: ${amount.toLocaleString()} $${token} MOVED\n\nWhale: "Deep-Dive-Alpha"\nTracker: $DDA\n\nTargeting Liquidity Pools.\nDeploying @Agent_SunGenX | Monitor @Girl_SunLumi\n[Ref: ${uniqueID}]`;

    // Generate Art
    console.log("🎨 Generating Stunt Double Art...");
    const imageUrl = `https://robohash.org/${uniqueID}.png?set=set1&bgset=bg1&size=600x600`;
    const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const mediaId = await twitterClient.v1.uploadMedia(Buffer.from(imageBuffer.data), { mimeType: 'image/png' });

    // Post
    const tweet = await twitterClient.v2.tweet({
        text: statusText,
        media: { media_ids: [mediaId] }
    });

    console.log(`✅ CUT! Tweet Posted: ${tweet.data.id}`);
}

async function triggerFakePayout() {
    console.log("🎬 ACTION! Simulating DeFi Payout...");
    
    const profit = "4.20x";
    const volume = "1,250,000";
    
    const msg = `💰 MARKET SETTLEMENT [SIMULATION]\n\nResult: ✅ WIN\nStrike: $0.2800\n\n📊 VIRTUAL POOL:\nVol: ${volume} TRX\nYield: ${profit} APY 🚀\n\n"The Oracle is never wrong."\n#TRON #DeFi #AI`;
    
    const tweet = await twitterClient.v2.tweet(msg);
    console.log(`✅ CUT! Payout Posted: ${tweet.data.id}`);
}

// UNCOMMENT THE ONE YOU WANT TO RUN FOR THE VIDEO:
triggerFakeWhale();
// triggerFakePayout();