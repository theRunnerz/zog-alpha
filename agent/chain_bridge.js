/* agent/chain_bridge.js */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- 1. THE IMPORT FIX ---
// Load the package specifically to handle ESM/CommonJS issues
const TronWebPkg = require("tronweb");
// Check: Is 'TronWeb' a property inside the package? Or is it the package itself?
const TronWeb = TronWebPkg.TronWeb || TronWebPkg;

// Safety Check
if (typeof TronWeb !== 'function') {
    console.error("❌ CRITICAL ERROR: TronWeb failed to load. Type is:", typeof TronWeb);
    process.exit(1); 
}

// --- 2. CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PRIVATE_KEY = process.env.TRON_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.TRON_CONTRACT_ADDRESS;

// Initialize connection
const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: PRIVATE_KEY
});

// --- 3. EXPORTED FUNCTIONS ---

export async function placeSocialBetOnChain(handle, amount, prediction) {
    try {
        // FIX: Explicitly get the address from the private key
        const issuerAddress = tronWeb.address.fromPrivateKey(PRIVATE_KEY);
        
        console.log(`🔗 CONNECTING to Shasta Contract: ${CONTRACT_ADDRESS}...`);
        
        const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);
        
        // Convert TRX to SUN
        const amountInSun = tronWeb.toSun(amount);
        const marketId = 1; // Hardcoded for demo

        console.log(`📝 SIGNING Transaction: "Move ${amount} TRX for user ${handle}"...`);
        
        // Call the smart contract function
        // We act as the ORACLE here.
        const txId = await contract.placeSocialBet(
            handle, 
            marketId, 
            prediction, 
            amountInSun
        ).send({
            feeLimit: 100_000_000, 
            from: issuerAddress // <--- THIS FIXES THE "INVALID ISSUER" ERROR
        });

        console.log(`✅ SUCCESS! Transaction Hash: https://shasta.tronscan.org/#/transaction/${txId}`);
        return txId;

    } catch (error) {
        console.error("❌ BLOCKCHAIN ERROR:", error.toString());
        return null; 
    }
}

export async function settlePayoutOnChain(handle, amount) {
    try {
        const issuerAddress = tronWeb.address.fromPrivateKey(PRIVATE_KEY);
        
        console.log(`🔗 CONNECTING to Shasta Contract to PAYOUT...`);
        const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);
        const amountInSun = tronWeb.toSun(amount);

        console.log(`💰 PAYING OUT: ${amount} TRX to ${handle}...`);

        const txId = await contract.distributeWinnings(
            handle, 
            amountInSun
        ).send({
            feeLimit: 100_000_000,
            from: issuerAddress // <--- Explicit Sender
        });

        console.log(`✅ PAYOUT CONFIRMED: https://shasta.tronscan.org/#/transaction/${txId}`);
        return txId;
    } catch (error) {
        console.error("❌ SETTLEMENT ERROR:", error.toString());
        return null;
    }
}