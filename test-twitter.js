/* test-twitter.js */
import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Load keys

// 1. Check if keys loaded
console.log("Checking Keys...");
console.log("App Key:", process.env.TWITTER_APP_KEY ? "✅ Loaded" : "❌ Missing");
console.log("Access Token:", process.env.TWITTER_ACCESS_TOKEN ? "✅ Loaded" : "❌ Missing");

const client = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function sendTest() {
    try {
        console.log("\nAttempting to tweet...");
        
        // Add random number so Twitter doesn't block it as duplicate
        const rand = Math.floor(Math.random() * 1000);
        const tweet = await client.v2.tweet(`Guardian System Online. Test ID: ${rand} #PinkerTape`);
        
        console.log("✅ SUCCESS!");
        console.log("Tweet ID:", tweet.data.id);
    } catch (e) {
        console.log("\n❌ FAILED.");
        console.log("Error Code:", e.code);
        console.log("Message:", e.message);
        console.log("Details:", JSON.stringify(e.data, null, 2));
    }
}

sendTest();