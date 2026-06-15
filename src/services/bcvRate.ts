const BCV_API_URL = 'https://pydolarve.org/api/v1/dollar';
const CACHE_KEY = 'bcv_rate_cache';
const SOURCE_KEY = 'bcv_rate_source';

interface BcvRateCache {
  rate: number;
  date: string;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getCachedRate(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: BcvRateCache = JSON.parse(raw);
    if (cache.date === getToday() && cache.rate > 0) {
      return cache.rate;
    }
  } catch {}
  return null;
}

function setCachedRate(rate: number): void {
  try {
    const cache: BcvRateCache = { rate, date: getToday() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

export function getRateSource(): 'bcv' | 'manual' {
  return (localStorage.getItem(SOURCE_KEY) as 'bcv' | 'manual') || 'manual';
}

export function saveRateSource(source: 'bcv' | 'manual'): void {
  localStorage.setItem(SOURCE_KEY, source);
}

export async function fetchBcvRate(): Promise<number | null> {
  const cached = getCachedRate();
  if (cached !== null) return cached;

  try {
    const res = await fetch(BCV_API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const rate = data?.rates?.price
      ?? data?.price
      ?? data?.dollar?.price
      ?? null;

    if (typeof rate === 'number' && rate > 0) {
      setCachedRate(rate);
      return rate;
    }
  } catch {}

  return null;
}
