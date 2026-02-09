/* agent/chain_bridge.js */
import TronWeb from 'tronweb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Environment Variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Shasta Connection
const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY }, // Optional but good
    privateKey: process.env.TRON_PRIVATE_KEY
});

const CONTRACT_ADDRESS = process.env.TRON_CONTRACT_ADDRESS;

export async function placeSocialBetOnChain(handle, amount, prediction) {
    try {
        console.log(`🔗 CONNECTING to Shasta Contract: ${CONTRACT_ADDRESS}...`);
        
        const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);
        
        // Convert TRX to SUN (1 TRX = 1,000,000 SUN)
        const amountInSun = tronWeb.toSun(amount);
        const marketId = 1; // Hardcoded for demo

        console.log(`📝 SIGNING Transaction: "Move ${amount} TRX for user ${handle}"...`);
        
        // Call the smart contract function
        // Note: For this to work, the "handle" must be registered in the contract first.
        // If not, it might revert. ideally register yourself first via TronScan.
        
        const txId = await contract.placeSocialBet(
            handle, 
            marketId, 
            prediction, 
            amountInSun
        ).send({
            feeLimit: 100_000_000 // 100 TRX max fee (Testnet is free practically)
        });

        console.log(`✅ SUCCESS! Transaction Hash: https://shasta.tronscan.org/#/transaction/${txId}`);
        return txId;

    } catch (error) {
        console.error("❌ BLOCKCHAIN ERROR:", error);
        return null; // Don't crash the app
    }
}

export async function settlePayoutOnChain(handle, amount) {
    try {
        console.log(`🔗 CONNECTING to Shasta Contract...`);
        const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);
        const amountInSun = tronWeb.toSun(amount);

        console.log(`💰 PAYING OUT: ${amount} TRX to ${handle}...`);

        const txId = await contract.distributeWinnings(
            handle, 
            amountInSun
        ).send();

        console.log(`✅ PAYOUT CONFIRMED: https://shasta.tronscan.org/#/transaction/${txId}`);
        return txId;
    } catch (error) {
        console.error("❌ SETTLEMENT ERROR:", error);
        return null;
    }
}