/* agent/chain_bridge.js */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. SETUP TRONWEB
const TronWebPkg = require("tronweb");
const TronWeb = TronWebPkg.TronWeb || TronWebPkg;

// 2. LOAD ENV
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PRIVATE_KEY = process.env.TRON_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.TRON_CONTRACT_ADDRESS;

// Debug Check
if (!PRIVATE_KEY) {
    console.error("❌ CRITICAL: TRON_PRIVATE_KEY is missing in .env.local");
    process.exit(1);
}

// 3. INITIALIZE CONNECTION
const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: PRIVATE_KEY
});

// 4. EXPORTED FUNCTIONS
export async function placeSocialBetOnChain(handle, amount, prediction) {
    try {
        // --- THE FIX ---
        // Use the default address derived by the constructor
        // If this prints "false" or "undefined", your Private Key is wrong.
        const issuerAddress = tronWeb.defaultAddress.base58;
        
        console.log(`🔗 CONNECTING to Shasta Contract: ${CONTRACT_ADDRESS}...`);
        console.log(`👤 ISSUER ADDRESS: ${issuerAddress}`); 

        if (!issuerAddress) {
            throw new Error("Could not derive address from Private Key. Check .env file.");
        }
        
        const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);
        const amountInSun = tronWeb.toSun(amount);
        const marketId = 1;

        console.log(`📝 SIGNING Transaction: "Move ${amount} TRX for user ${handle}"...`);
        
        const txId = await contract.placeSocialBet(
            handle, 
            marketId, 
            prediction, 
            amountInSun
        ).send({
            feeLimit: 100_000_000,
            from: issuerAddress // Explicitly passing the string
        });

        console.log(`✅ SUCCESS! Transaction Hash: https://shasta.tronscan.org/#/transaction/${txId}`);
        return txId;

    } catch (error) {
        // detailed error logging
        console.error("❌ BLOCKCHAIN ERROR:", error);
        return null; 
    }
}

export async function settlePayoutOnChain(handle, amount) {
    try {
        const issuerAddress = tronWeb.defaultAddress.base58;
        
        console.log(`🔗 CONNECTING to Shasta Contract...`);
        const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);
        const amountInSun = tronWeb.toSun(amount);

        console.log(`💰 PAYING OUT: ${amount} TRX to ${handle}...`);
        console.log(`👤 SENDER: ${issuerAddress}`);

        const txId = await contract.distributeWinnings(
            handle, 
            amountInSun
        ).send({
            feeLimit: 100_000_000,
            from: issuerAddress
        });

        console.log(`✅ PAYOUT CONFIRMED: https://shasta.tronscan.org/#/transaction/${txId}`);
        return txId;
    } catch (error) {
        console.error("❌ SETTLEMENT ERROR:", error);
        return null;
    }
}