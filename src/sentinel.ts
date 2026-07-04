import dotenv from 'dotenv';
import * as path from 'path';
import { TwitterApi } from 'twitter-api-v2';
import { TronWeb } from 'tronweb';
import { getTronAddressByXHandle } from './core/db';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const fullNode = 'https://api.shasta.trongrid.io';
const tronWeb = new TronWeb({
  fullHost: fullNode,
  privateKey: process.env.TEST_AGENT_1_PRIVATE_KEY
});

const xClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY || '',
  appSecret: process.env.TWITTER_APP_SECRET || '',
  accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
  accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
});

async function processSocialBets(tweetId: string) {
  console.log(`📡 Sentinel checking Social Interactions for Tweet: ${tweetId}`);

  // Safety fallback to ensure the contract address loads perfectly
  const contractAddress = process.env.FLASH_MARKET_CONTRACT || process.env.NEXT_PUBLIC_FLASH_MARKET_CONTRACT;
  if (!contractAddress) throw new Error("Contract address config missing!");

  const contract = await tronWeb.contract().at(contractAddress);

  try {
    // 1. Fetch Users who Liked (YES)
    console.log("➡️ Scanning Likes (YES/True Bets)...");
    
    // THE FIX: Save the data directly to the 'likingUsers' variable!
    const likingUsers = await xClient.v2.tweetLikedBy(tweetId);
    
    if (likingUsers.data) {
      for (const rawUser of likingUsers.data) {
        const xHandle = rawUser.username;
        const mappedAddress = await getTronAddressByXHandle(xHandle);

        if (mappedAddress) {
          console.log(`🎯 Match Found! User @${xHandle} mapping to ${mappedAddress}. Placing YES Bet...`);
          const tx = await contract.placeBet(true).send({
            callValue: 10 * 1_000_000, // 10 TRX
            feeLimit: 500_000_000
          });
          console.log(`✅ Placed YES Bet. Tx: ${tx}`);
        } else {
          console.log(`⚠️ User @${xHandle} interacted, but has not linked their TronLink wallet via dashboard.`);
        }
      }
    }

    // 2. Fetch Users who Retweeted (NO)
    console.log("\n➡️ Scanning Retweets (NO/False Bets)...");
    const retweetingUsers = await xClient.v2.tweetRetweetedBy(tweetId);

    if (retweetingUsers.data) {
      for (const rawUser of retweetingUsers.data) {
        const xHandle = rawUser.username;
        const mappedAddress = await getTronAddressByXHandle(xHandle);

        if (mappedAddress) {
          console.log(`🎯 Match Found! User @${xHandle} mapping to ${mappedAddress}. Placing NO Bet...`);
          const tx = await contract.placeBet(false).send({
            callValue: 5 * 1_000_000, // 5 TRX
            feeLimit: 500_000_000
          });
          console.log(`✅ Placed NO Bet. Tx: ${tx}`);
        } else {
          console.log(`⚠️ User @${xHandle} interacted, but has not linked their TronLink wallet via dashboard.`);
        }
      }
    }

  } catch (error) {
    console.error("❌ Sentinel Execution Interrupted:", error);
  }
}

async function runSentinelTest() {
  const TARGET_TWEET_ID = "2073445234126860628";
  await processSocialBets(TARGET_TWEET_ID);
}

runSentinelTest();