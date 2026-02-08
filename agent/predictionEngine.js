/* agent/predictionEngine.js - PHASE 2: SOCIAL VOTING ADDED */
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// 1. SETUP PATHS SAFELY
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "predictions.json");

// 2. USE TRON PRICE API
const PRICE_API = "https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT";

// --- HELPERS ---
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
        return [];
    }
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function saveData(data) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); } catch(e) {}
}

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

// --- SIGNAL MODEL ---
export function computeProbability({ whaleScore, momentum, volatility, stress }) {
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

  const exists = data.find(d => d.date === todayUTC);
  if (exists) return exists;

  let currentPrice = 0.26; 
  try {
      const priceRes = await axios.get(PRICE_API);
      currentPrice = parseFloat(priceRes.data.price);
  } catch(e) {}

  const probability = computeProbability(signals);
  const confidence = probability >= 75 ? "HIGH" : probability >= 60 ? "MEDIUM" : "LOW";
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
    outcome: null,
    tweetId: null, // NEW: Track the social thread
    communityVote: { likes: 0, rts: 0, consensus: "PENDING" } // NEW: Track the hive mind
  };

  data.push(strike);
  saveData(data);
  return strike;
}

// --- NEW: LINK TWEET TO PREDICTION ---
export async function updateStrikeTweet(date, tweetId) {
    const data = loadData();
    const target = data.find(d => d.date === date);
    if(target) {
        target.tweetId = tweetId;
        saveData(data);
        console.log(`🔗 Linked Tweet ID ${tweetId} to Prediction ${date}`);
    }
}

// --- NEW: UPDATE COMMUNITY VOTE ---
export async function updateVoteStats(date, likes, rts) {
    const data = loadData();
    const target = data.find(d => d.date === date);
    if(target) {
        target.communityVote = {
            likes: likes,
            rts: rts,
            consensus: likes > rts ? "AGREE" : "DISAGREE"
        };
        saveData(data);
    }
}

// --- RESOLVE STRIKE ---
export async function resolveDailyStrike() {
  const data = loadData();
  const active = data.find(d => d.status === "ACTIVE");
  if (!active) return null;

  let currentPrice = 0;
  try {
    const res = await axios.get(PRICE_API);
    currentPrice = parseFloat(res.data.price);
  } catch (e) { return null; }

  const todayUTC = new Date().toISOString().split("T")[0];
  const isOld = active.date !== todayUTC;

  // Resolve Logic
  if (currentPrice >= active.strike || (isOld && currentPrice < active.strike)) {
      active.status = "RESOLVED";
      active.outcome = currentPrice >= active.strike ? "WIN" : "LOSS";
      active.resolvedPrice = currentPrice;
      saveData(data);
      return active;
  }
  return null; 
}

// --- ACCURACY ---
export function getAccuracy(days = 30) {
  const data = loadData();
  const resolved = data.filter(d => d.status === "RESOLVED");
  if (!resolved.length) return 0;
  const wins = resolved.filter(d => d.outcome === "WIN").length;
  return Math.round((wins / resolved.length) * 100);
}