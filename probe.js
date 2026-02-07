import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const client = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function probe() {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`📡 Probing Twitter API at ${timestamp}...`);
    
    try {
        await client.v2.tweet(`System Probe: ${timestamp}`);
        console.log("✅ SUCCESS! You are unbanned. You can run the Guardian now.");
    } catch (e) {
        console.log("❌ FAILED (403). check back in 30 mins.");
        console.log("Reason:", e.data || e.message);
    }
}

probe();