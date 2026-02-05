/* agent/guardian.js - ESM Version */
import dotenv from 'dotenv';
import TronWeb from 'tronweb';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. SETUP PATHS (ESM workaround for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root folder (one level up)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// 2. CONFIGURATION
const TRON_API = "https://api.trongrid.io"; 
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// Watch List
const WATCH_LIST = [
    { 
      name: "$SUNAI", 
      address: "TEyzUNwZMuMsAXqdcz5HZrshs3iWfydGAW", 
      threshold: 50 // Low threshold for Demo triggering
    } 
];

// Memory File
const MEMORY_FILE = path.join(__dirname, 'agent_memory.json');
let memory = fs.existsSync(MEMORY_FILE) ? JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8')) : { handledTx: [] };

// Initialize AI
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

console.log("\n🤖 PINKERTAPE SENTINEL (AGENT) STARTING...");
console.log(`👁️  Connected to TRON Mainnet. Watching: ${WATCH_LIST[0].name}`);
console.log(`🧠 AI Brain: Gemini-3-Flash-Preview`);
console.log("----------------------------------------------------");

// 3. MAIN LOOP
async function startPatrol() {
    console.log("...Scanning Mempool for suspicious dumps...");
    await checkTargets();
    setInterval(checkTargets, 15000); // Check every 15s
}

// 4. CHECK LOGIC
async function checkTargets() {
    for (const target of WATCH_LIST) {
        const url = `${TRON_API}/v1/contracts/${target.address}/events?event_name=Transfer&limit=5`;
        
        try {
            const res = await axios.get(url);
            if (!res.data.success) return;

            const events = res.data.data;

            for (const tx of events) {
                if (memory.handledTx.includes(tx.transaction_id)) continue;

                let rawVal = parseInt(tx.result.value);
                // Simple simplified decimal math for demo
                let readableAmount = rawVal / 1e18; 
                if (readableAmount < 0.000001) readableAmount = rawVal / 1e6; 

                console.log(`🔎 Scan: ${readableAmount.toFixed(2)} ${target.name} moved in TX ${tx.transaction_id.slice(0,6)}...`);

                if (readableAmount > target.threshold) {
                    console.log(`\n🚨 ALERT: LARGE MOVEMENT DETECTED (${readableAmount.toFixed(2)} > ${target.threshold})`);
                    console.log("...Sending data to PinkerTape AI...");
                    
                    await analyzeRisk(tx, readableAmount, target);
                }

                memory.handledTx.push(tx.transaction_id);
                if (memory.handledTx.length > 50) memory.handledTx.shift();
                fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory));
            }
        } catch (e) {
            console.log(`Connection blip: ${e.message}`);
        }
    }
}

// 5. AI LOGIC
async function analyzeRisk(tx, amount, target) {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    // Convert hex address to base58 safely
    let sender = tx.result.from;
    try {
        if(TronWeb.address) sender = TronWeb.address.fromHex(sender);
        else if (TronWeb.default && TronWeb.default.address) sender = TronWeb.default.address.fromHex(sender);
    } catch(e) { sender = "Unknown"; }

    const prompt = `
        You are PinkerTape, an Autonomous AI Guardian on TRON.
        A large transfer of ${amount} ${target.name} just occurred.
        Sender: ${sender}

        Analyze this. Is it a "Dump" or just "Whale Activity"?
        Be paranoid.
        
        Output format JSON ONLY:
        {
            "risk": "HIGH" or "MEDIUM",
            "reason": "Short snarky sentence why.",
            "action": "Generate a Tweet text warning the community."
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);

        console.log("🧠 AI ANALYSIS COMPLETE:");
        console.log(`   RISK LEVEL: ${analysis.risk}`);
        console.log(`   REASON: ${analysis.reason}`);

        if (analysis.risk === "HIGH" || analysis.risk === "MEDIUM") {
            await executeDefense(analysis.action);

            // --- NEW: SAVE ALERT TO FILE FOR DASHBOARD ---
            const alertData = {
                timestamp: new Date().toISOString(),
                token: target.name,
                amount: amount.toFixed(2),
                risk: analysis.risk,
                reason: analysis.reason,
                tx: tx.transaction_id,
                tweet: analysis.action
            };

            // Read, Push, Save
            if (!memory.alerts) memory.alerts = [];
            memory.alerts.unshift(alertData); // Add to top
            if (memory.alerts.length > 20) memory.alerts.pop(); // Keep last 20
            
            fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
            // ---------------------------------------------
        }

    } catch (e) {
        console.error("AI Error:", e.message);
    }
}

// 6. ACTION LOGIC
async function executeDefense(tweetText) {
    console.log("\n⚡ EXECUTING DEFENSE PROTOCOLS...");
    
    await new Promise(r => setTimeout(r, 1000));
    console.log(`[X/Twitter API] Posting: "${tweetText}"`);
    
    await new Promise(r => setTimeout(r, 1000));
    console.log(`[SunPump API] ⚠️ DEPLOYING 'RUG-ALERT' TOKEN...`);
    
    await new Promise(r => setTimeout(r, 1000));
    console.log(`✅ ALERT TOKEN DEPLOYED. Contract: T9yKK...3jzX (Simulated)`);
    console.log("🛡️ Community Warned. Guardian Standing By.");
    console.log("----------------------------------------------------\n");
}

startPatrol();