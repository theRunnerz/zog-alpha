import pptxgen from "pptxgenjs";

let pres = new pptxgen();

// Theme presets
const titleFmt = { x: 0.5, y: 0.5, w: "90%", h: 1, fontSize: 36, color: "FF0000", bold: true };
const bodyFmt = { x: 0.5, y: 1.8, w: "90%", h: 3.5, fontSize: 20, color: "333333", bullet: true, align: "left" };

// Slide 1: Title
let slide1 = pres.addSlide();
slide1.background = { color: "111111" };
slide1.addText("FlashMarket", { x: 1, y: 2, w: "80%", h: 1, fontSize: 54, color: "FF0000", bold: true, align: "center" });
slide1.addText("Autonomous Social Prediction Agents on TRON", { x: 1, y: 3, w: "80%", h: 1, fontSize: 24, color: "FFFFFF", align: "center" });

// Slide 2: The Problem
let slide2 = pres.addSlide();
slide2.addText("🚨 The Problem", titleFmt);
slide2.addText([
    { text: "Web3 prediction markets have too much UX friction." },
    { text: "Users see breaking news on Web2 social media (Twitter/X)." },
    { text: "Participating requires leaving the app, connecting wallets, and navigating complex UIs." },
    { text: "By the time they place a bet, the opportunity to act on early sentiment is gone." }
], bodyFmt);

// Slide 3: The Solution
let slide3 = pres.addSlide();
slide3.addText("⚡ The Solution: FlashMarket", titleFmt);
slide3.addText([
    { text: "We remove the UI completely by turning social actions into on-chain triggers." },
    { text: "Users simply 'Like' or 'Retweet' specific posts on social media." },
    { text: "Our AI 'Sentinel' Agents autonomously monitor and detect this sentiment in real-time." },
    { text: "The Agent securely executes a TRX prediction transaction directly on the TRON blockchain." }
], bodyFmt);

// Slide 4: Architecture
let slide4 = pres.addSlide();
slide4.addText("🛠 Technical Architecture", titleFmt);
slide4.addText([
    { text: "Web2 Agent Engine: TypeScript, NodeJS, and Social Data APIs monitor consensus." },
    { text: "Web3 Bridge: TronWeb SDK acts as the highly secure transaction signer." },
    { text: "On-Chain Smart Contract: Custom Solidity 0.8.6 escrow optimized for the TRON Virtual Machine." },
    { text: "Security: Contract features built-in division-by-zero protection and uses safe low-level call routing." }
], bodyFmt);

// Slide 5: The Hackathon Proof
let slide5 = pres.addSlide();
slide5.addText("🏆 Proof of Execution", titleFmt);
slide5.addText("Fully functional end-to-end TRON Network Testnet Execution:", { x: 0.5, y: 1.5, w: "90%", fontSize: 22, color: "000000" });
slide5.addText([
    { text: "Terminal agents successfully mapped social actions to on-chain balances." },
    { text: "Empty payout pools successfully triggered protective reverting." },
    { text: "Final Oracle Resolution correctly distributed the 5 TRX prize pool." },
    { text: "Verified Tx Hash: 5e4670557991bacd617a6740ec2789e60f95137408f1451153d00af004f2834b" }
], { x: 0.5, y: 2.2, w: "90%", h: 2.5, fontSize: 18, color: "008800", bullet: true });

// Slide 6: Roadmap
let slide6 = pres.addSlide();
slide6.addText("🚀 What's Next?", titleFmt);
slide6.addText([
    { text: "Mainnet Deployment: Bringing FlashMarket to TRON mainnet." },
    { text: "Platform Expansion: Sentinel agents for Discord, Telegram, and Farcaster." },
    { text: "NLP Integration: Letting users simply reply 'Bet 100 TRX on YES' to seamlessly execute trades." }
], bodyFmt);

// Save the PPT
pres.writeFile({ fileName: "FlashMarket_Deck.pptx" }).then(() => {
    console.log("✅ successfully created FlashMarket_Deck.pptx!");
});