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

const API_SOURCES = [
  {
    name: 've-dolarapi',
    url: 'https://ve.dolarapi.com/v1/dolares',
    parse: (data: any) => {
      if (Array.isArray(data)) {
        const usd = data.find((d: any) => d.fuente === 'oficial' || d.fuente === 'BCV' || d.nombre === 'Oficial' || d.nombre === 'Dólar');
        return usd?.promedio ?? usd?.precio ?? usd?.price ?? null;
      }
      return data?.promedio ?? data?.precio ?? data?.price ?? null;
    },
  },
  {
    name: 'dolarapi',
    url: 'https://dolarapi.com/v1/dolares',
    parse: (data: any) => {
      if (Array.isArray(data)) {
        const usd = data.find((d: any) => d.fuente === 'oficial' || d.fuente === 'BCV' || d.nombre === 'Oficial' || d.nombre === 'Dólar');
        return usd?.promedio ?? usd?.precio ?? usd?.price ?? null;
      }
      return data?.promedio ?? data?.precio ?? data?.price ?? null;
    },
  },
];

export async function fetchBcvRate(): Promise<number | null> {
  const cached = getCachedRate();
  if (cached !== null) return cached;

  for (const source of API_SOURCES) {
    try {
      const res = await fetch(source.url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const data = await res.json();
      const rate = source.parse(data);
      if (typeof rate === 'number' && rate > 0) {
        setCachedRate(rate);
        return rate;
      }
    } catch {}
  }

  return null;
}
