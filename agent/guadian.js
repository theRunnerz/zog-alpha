/* agent/guardian.js - The PinkerTape Autonomous Sentinel */
require('dotenv').config({ path: '../.env.local' }); // Load env from root
const TronWeb = require('tronweb');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

// --- 1. CONFIGURATION ---
const TRON_NODE = "https://api.shasta.trongrid.io"; // Use Shasta for testing, Mainnet for Prod
const PRIVATE_KEY = process.env.TRON_OWNER_PRIVATE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// TARGETS TO MONITOR (Example: $SUNAI Contract)
const WATCH_LIST = [
    { name: "$SUNAI", address: "TEyzUNwZMuMsAXqdcz5HZrshs3iWfydGAW", threshold: 100000 } 
];

// STATE MEMORY (Simple persistent storage)
const MEMORY_FILE = './agent_memory.json';
let memory = fs.existsSync(MEMORY_FILE) ? JSON.parse(fs.readFileSync(MEMORY_FILE)) : { handledTx: [] };

// --- 2. INITIALIZATION ---
const tronWeb = new TronWeb({ fullNode: TRON_NODE, solidityNode: TRON_NODE, eventServer: TRON_NODE, privateKey: PRIVATE_KEY });
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

console.log("🤖 PINKERTAPE SENTINEL ONLINE...");
console.log(`👁️ Monitoring ${WATCH_LIST.length} targets on TRON...`);

// --- 3. THE CORE LOOP ---
async function startPatrol() {
    setInterval(async () => {
        try {
            await checkTargets();
        } catch (e) {
            console.error("⚠️ Patrol Error:", e.message);
        }
    }, 10000); // Check every 10 seconds
}

// --- 4. MONITORING LOGIC ---
async function checkTargets() {
    for (const target of WATCH_LIST) {
        // Fetch recent TRC20 transfers for this contract
        // Note: For hackathon, we use TronGrid API. 
        const url = `https://api.shasta.trongrid.io/v1/contracts/${target.address}/events?event_name=Transfer&limit=5`;
        
        try {
            const res = await axios.get(url);
            const events = res.data.data;

            for (const tx of events) {
                if (memory.handledTx.includes(tx.transaction_id)) continue;

                const amount = parseInt(tx.result.value) / 1000000; // Assuming 6 decimals
                
                // IF AMOUNT IS HUGE -> ANALYZE
                if (amount > target.threshold) {
                    console.log(`🚨 HUGE MOVEMENT DETECTED: ${amount} ${target.name}`);
                    await analyzeRisk(tx, amount, target);
                }
                
                // Remember this TX so we don't process it twice
                memory.handledTx.push(tx.transaction_id);
                fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory));
            }
        } catch (e) {
            console.log(`Polling error for ${target.name}: ${e.message}`);
        }
    }
}

// --- 5. THE AI BRAIN (Gemini 3 Flash Preview) ---
async function analyzeRisk(tx, amount, target) {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    // Check if sender is a known developer/deployer (simulated check)
    const sender = TronWeb.address.fromHex(tx.result.from);
    
    const prompt = `
        You are PinkerTape, an Autonomous Blockchain Guardian.
        Analyze this suspicious transaction on TRON.
        
        Context:
        - Token: ${target.name}
        - Amount Moved: ${amount}
        - Sender Address: ${sender}
        - Threshold for Alert: ${target.threshold}
        
        Is this likely a "Rug Pull" / "Dump"?
        Return JSON ONLY: { "riskLevel": "HIGH" | "LOW", "message": "Your tweet content here", "shouldLaunchAlert": boolean }
    `;

    try {
        const result = await model.generateContent(prompt);
        // Clean JSON string
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const decision = JSON.parse(text);

        console.log("🧠 AI DECISION:", decision);

        if (decision.shouldLaunchAlert) {
            await executeDefenseProtocol(target, decision.message);
        }
    } catch (e) {
        console.error("AI Brain Freeze:", e);
    }
}

// --- 6. THE EXECUTION (Deploy Warning Token) ---
async function executeDefenseProtocol(target, tweetContent) {
    console.log("\n⚡ DEFENSE PROTOCOL INITIATED ⚡");
    console.log("1. Tweeting Warning via X API (Mock):", tweetContent);
    
    // REAL TRONWEB INTERACTION: Launch a Counter-Token
    // For this example, we mock the SunPump factory call, but this code is valid for any Factory contract.
    try {
        console.log("2. Launching 'RUG-ALERT' Token on Chain...");
        
        // This simulates calling a Factory to create a new token
        // In real SunPump, you'd call the 'launch' method on their contract
        
        /* 
        const factory = await tronWeb.contract().at("SUN_PUMP_FACTORY_ADDRESS");
        const tx = await factory.launch(
            `RugAlert-${target.name}`, // Name
            "RUG",                     // Symbol
            1000000000,                // Supply
            "Warning: suspicious activity detected." // Description
        ).send();
        console.log("✅ ON-CHAIN ALERT DEPLOYED. TX:", tx);
        */
       
        console.log("✅ (Simulation) Token 'RUG-SunAI' deployed to Shasta Testnet.");

    } catch (e) {
        console.error("Deployment Failed:", e);
    }
}

startPatrol();