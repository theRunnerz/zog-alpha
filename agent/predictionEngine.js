import axios from "axios";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "agent", "predictions.json");

const PRICE_API = "https://api.binance.com/api/v3/klines?symbol=TRXUSDT&interval=1d&limit=2";

// --- HELPERS ---
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// --- SIGNAL MODEL (v1 SIMPLE & DEFENSIBLE) ---
export function computeProbability({ whaleScore, momentum, volatility, stress }) {
  const raw =
    whaleScore * 0.35 +
    momentum * 0.25 +
    volatility * 0.20 +
    stress * 0.20;

  const probability = clamp(Math.round(raw), 50, 85);

  return probability;
}

// --- CREATE DAILY STRIKE ---
export async function createDailyStrike(signals) {
  const data = loadData();

  const todayUTC = new Date().toISOString().split("T")[0];
  const exists = data.find(d => d.date === todayUTC);
  if (exists) return exists;

  const probability = computeProbability(signals);
  const confidence =
    probability >= 70 ? "HIGH" :
    probability >= 55 ? "MEDIUM" : "LOW";

  const priceRes = await axios.get(PRICE_API);
  const lastClose = parseFloat(priceRes.data[0][4]);

  const strike = {
    id: `TRX-${todayUTC}`,
    date: todayUTC,
    asset: "TRX",
    strike: Number((lastClose * 1.01).toFixed(4)), // simple +1% target
    direction: "ABOVE",
    resolutionUTC: `${todayUTC}T00:00:00Z`,
    probability,
    confidence,
    signals,
    status: "ACTIVE",
    outcome: null,
    resolvedPrice: null
  };

  data.push(strike);
  saveData(data);

  return strike;
}

// --- RESOLVE STRIKE ---
export async function resolveDailyStrike() {
  const data = loadData();
  const active = data.find(d => d.status === "ACTIVE");
  if (!active) return null;

  const res = await axios.get(PRICE_API);
  const close = parseFloat(res.data[1][4]);

  active.resolvedPrice = close;
  active.outcome =
    active.direction === "ABOVE"
      ? close > active.strike ? "YES" : "NO"
      : close < active.strike ? "YES" : "NO";

  active.status = "RESOLVED";
  saveData(data);

  return active;
}

// --- ACCURACY ---
export function getAccuracy(days = 30) {
  const data = loadData().filter(d => d.status === "RESOLVED");
  const slice = data.slice(-days);
  if (!slice.length) return 0;

  const wins = slice.filter(d => d.outcome === "YES").length;
  return Math.round((wins / slice.length) * 100);
}
