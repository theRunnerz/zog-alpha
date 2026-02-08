/* agent/predictionEngine.js */
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// 1. SETUP PATHS SAFELY
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "predictions.json");

// 2. USE TRON PRICE API (More reliable than Binance for US users)
const PRICE_API = "https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT";

// --- HELPERS ---
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
        // Initialize empty file if missing
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
        return [];
    }
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("⚠️ Memory Read Error (Resetting DB):", e.message);
    return [];
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch(e) {
    console.error("⚠️ Memory Write Error:", e.message);
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// --- SIGNAL MODEL ---
export function computeProbability({ whaleScore, momentum, volatility, stress }) {
  // Safe defaults if signals are missing
  const w = whaleScore || 50;
  const m = momentum || 50;
  const v = volatility || 50;
  const s = stress || 50;

  const raw = w * 0.35 + m * 0.25 + v * 0.20 + s * 0.20;
  return clamp(Math.round(raw), 50, 95);
}

// --- CREATE DAILY STRIKE ---
export async function createDailyStrike(signals) {
  const data = loadData();
  const todayUTC = new Date().toISOString().split("T")[0];

  // If we already have a prediction for today, return it
  const exists = data.find(d => d.date === todayUTC);
  if (exists) return exists;

  // 1. Get Price
  let currentPrice = 0.26; // Fallback for Demo
  try {
      const priceRes = await axios.get(PRICE_API);
      currentPrice = parseFloat(priceRes.data.price);
  } catch(e) {
      console.log("⚠️ API Price Fail (Using fallback)");
  }

  // 2. Calculate Stats
  const probability = computeProbability(signals);
  const confidence = probability >= 75 ? "HIGH" : probability >= 60 ? "MEDIUM" : "LOW";
  
  // 3. Create Strike (Targeting +0.5% move for demo realism)
  const strikePrice = Number((currentPrice * 1.005).toFixed(4)); 

  const strike = {
    id: `PRED-${Math.floor(Math.random() * 9000) + 1000}`,
    date: todayUTC,
    asset: "TRX",
    startPrice: currentPrice,
    strike: strikePrice, 
    direction: "ABOVE",
    probability,
    confidence,
    signals,
    status: "ACTIVE",
    outcome: null
  };

  data.push(strike);
  saveData(data);

  return strike;
}

// --- RESOLVE STRIKE ---
export async function resolveDailyStrike() {
  const data = loadData();
  
  // Find active bets
  const active = data.find(d => d.status === "ACTIVE");
  if (!active) return null;

  // Check Current Price
  let currentPrice = 0;
  try {
    const res = await axios.get(PRICE_API);
    currentPrice = parseFloat(res.data.price);
  } catch (e) { return null; }

  // Resolve logic: If price hits strike OR it's a new day
  const todayUTC = new Date().toISOString().split("T")[0];
  const isOld = active.date !== todayUTC;

  if (currentPrice >= active.strike) {
      active.status = "RESOLVED";
      active.outcome = "WIN";
      active.resolvedPrice = currentPrice;
      saveData(data);
      return active;
  } else if (isOld) {
      // If it's a new day and we didn't hit, it's a loss
      active.status = "RESOLVED";
      active.outcome = "LOSS";
      active.resolvedPrice = currentPrice;
      saveData(data);
      return active;
  }

  return null; // Still active/pending
}

// --- ACCURACY (Safe) ---
export function getAccuracy(days = 30) {
  const data = loadData();
  const resolved = data.filter(d => d.status === "RESOLVED");
  if (!resolved.length) return 0;

  const wins = resolved.filter(d => d.outcome === "WIN").length;
  return Math.round((wins / resolved.length) * 100);
}