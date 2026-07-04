import dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local immediately
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function runTest() {
  console.log("🔍 Testing connection with your keys...");
  console.log("TWITTER_APP_KEY present:", !!process.env.TWITTER_APP_KEY);
  console.log("TWITTER_APP_SECRET present:", !!process.env.TWITTER_APP_SECRET);
  console.log("TWITTER_ACCESS_TOKEN present:", !!process.env.TWITTER_ACCESS_TOKEN);
  console.log("TWITTER_ACCESS_SECRET present:", !!process.env.TWITTER_ACCESS_SECRET);

  const { TwitterApi } = await import('twitter-api-v2');

  // Initialize with your exact .env.local variable names
  const xClient = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY || '',
    appSecret: process.env.TWITTER_APP_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
  });

  try {
    const tweet = await xClient.v2.tweet("⚡ Zog-Alpha Sentinel Online. Reactivation successful.");
    console.log("✅ Success! Tweet posted. ID:", tweet.data.id);
  } catch (err) {
    console.error("❌ Posting failed:", err);
  }
}

runTest();
