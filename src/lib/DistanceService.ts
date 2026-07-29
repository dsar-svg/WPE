import { AddressSuggestion } from '../types';

// Venezuela bounds for bounded geocoding
const VENEZUELA_BOUNDS = [[0.6, -73.5], [12.5, -59.8]] as const;
const USER_AGENT = 'WPandaExpress/2.0 (PWA App)';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_MIRRORS = [
  'https://router.project-osrm.org',
  'https://router.osrm.ch',
  'https://osrm.pleiades.edu.uy',
];
const VALHALLA_URL = 'https://valhalla1.openstreetmap.de';

// ── localStorage cache helpers ──────────────────────────────────────────────
interface CacheEntry {
  value: number;
  ts: number;
}
const CACHE_KEY_PREFIX = 'wpd_route_cache_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

function routeCacheKey(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const r = (n: number) => n.toFixed(4);
  return `${r(lat1)},${r(lon1)}|${r(lat2)},${r(lon2)}`;
}

function getRouteCache(key: string): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY_PREFIX + key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

function setRouteCache(key: string, value: number): void {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify({ value, ts: Date.now() }));
  } catch {
    // storage full or unavailable — ignore
  }
}

// ── Nominatim helpers ───────────────────────────────────────────────────────

/**
 * Reverse geocode: lat/lng → address string
 * Uses Nominatim reverse with Venezuela-only filter
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=es&countrycodes=ve&zoom=18`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

/**
 * Forward geocode with Venezuela bounding box — returns up to 10 suggestions
 */
export async function geocodeAddressBounded(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];
  const [south, west] = VENEZUELA_BOUNDS[0];
  const [north, east] = VENEZUELA_BOUNDS[1];
  const viewbox = `${west},${south},${east},${north}`;
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=10&countrycodes=ve&addressdetails=1&viewbox=${viewbox}&bounded=1`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return [];
    const data = await res.json() as Array<{ place_id: number; display_name: string; lat: string; lon: string; boundingbox?: string[] }>;
    return data.map((item) => ({
      place_id: String(item.place_id),
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      boundingbox: item.boundingbox,
    }));
  } catch {
    return [];
  }
}

/**
 * Plain forward geocode (no viewbox, still Venezuela-only)
 */
export async function geocodeAddress(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=10&countrycodes=ve&addressdetails=1`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return [];
    const data = await res.json() as Array<{ place_id: number; display_name: string; lat: string; lon: string; boundingbox?: string[] }>;
    return data.map((item) => ({
      place_id: String(item.place_id),
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      boundingbox: item.boundingbox,
    }));
  } catch {
    return [];
  }
}

// ── Photon (Komoot) geocoding ───────────────────────────────────────────────

const PHOTON_BASE = 'https://photon.komoot.io';

/**
 * Forward geocode via Photon — OSM-based, better POI search, typo-tolerant
 * Supports location bias via lat/lon params
 */
async function geocodePhoton(
  query: string,
  biasLat?: number,
  biasLon?: number,
): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];
  const params = new URLSearchParams({
    q: query,
    lang: 'es',
    limit: '10',
  });
  if (biasLat !== undefined && biasLon !== undefined) {
    params.set('lat', String(biasLat));
    params.set('lon', String(biasLon));
  }
  const url = `${PHOTON_BASE}/api/?${params.toString()}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json() as {
      features: Array<{
        geometry: { coordinates: [number, number] };
        properties: {
          name?: string;
          city?: string;
          state?: string;
          country?: string;
          postcode?: string;
          street?: string;
          housenumber?: string;
          label?: string;
        };
      }>;
    };
    return (data.features ?? []).map((f, i) => {
      const p = f.properties;
      const parts = [p.name, p.housenumber, p.street, p.city, p.state, p.country].filter(Boolean);
      const display = p.label || parts.join(', ') || 'Sin dirección';
      return {
        place_id: `photon_${i}_${f.geometry.coordinates[0]}`,
        display_name: display,
        lat: String(f.geometry.coordinates[1]),
        lon: String(f.geometry.coordinates[0]),
      };
    });
  } catch {
    return [];
  }
}

// ── Multi-provider geocoding ────────────────────────────────────────────────

/**
 * Haversine distance in meters between two coordinates
 */
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return R * c;
}

/**
 * Multi-provider forward geocode — runs Nominatim (bounded), Nominatim (unbounded),
 * and Photon in parallel, then deduplicates and sorts by distance to the restaurant.
 */
export async function geocodeAddressMulti(
  query: string,
  restaurantLat?: number,
  restaurantLon?: number,
): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];

  const [south, west] = VENEZUELA_BOUNDS[0];
  const [north, east] = VENEZUELA_BOUNDS[1];
  const viewbox = `${west},${south},${east},${north}`;

  // 1 — Fire all three providers in parallel
  const [nomBounded, nomUnbounded, photon] = await Promise.all([
    // Nominatim bounded (strict Venezuela box)
    (async () => {
      const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=10&countrycodes=ve&addressdetails=1&viewbox=${viewbox}&bounded=1`;
      try {
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(6000) });
        if (!res.ok) return [];
        const data = await res.json() as Array<{ place_id: number; display_name: string; lat: string; lon: string }>;
        return data.map((item) => ({
          place_id: String(item.place_id),
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
        }));
      } catch {
        return [];
      }
    })(),
    // Nominatim unbounded (Venezuela-only but no box restriction)
    (async () => {
      const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=10&countrycodes=ve&addressdetails=1`;
      try {
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(6000) });
        if (!res.ok) return [];
        const data = await res.json() as Array<{ place_id: number; display_name: string; lat: string; lon: string }>;
        return data.map((item) => ({
          place_id: `nom2_${item.place_id}`,
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
        }));
      } catch {
        return [];
      }
    })(),
    // Photon (OSM, better POI search, typo-tolerant)
    geocodePhoton(query, restaurantLat, restaurantLon),
  ]);

  // 2 — Merge all results
  const all = [...nomBounded, ...nomUnbounded, ...photon];

  // 3 — Deduplicate: if two results are <50m apart, keep the first one
  const DEDUP_RADIUS_M = 50;
  const unique: AddressSuggestion[] = [];
  for (const item of all) {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    const isDuplicate = unique.some((u) => {
      const uLat = parseFloat(u.lat);
      const uLon = parseFloat(u.lon);
      return haversineMeters(lat, lon, uLat, uLon) < DEDUP_RADIUS_M;
    });
    if (!isDuplicate) unique.push(item);
  }

  // 4 — Sort by distance to restaurant (closest first)
  if (restaurantLat !== undefined && restaurantLon !== undefined) {
    unique.sort((a, b) => {
      const dA = haversineMeters(parseFloat(a.lat), parseFloat(a.lon), restaurantLat, restaurantLon);
      const dB = haversineMeters(parseFloat(b.lat), parseFloat(b.lon), restaurantLat, restaurantLon);
      return dA - dB;
    });
  }

  // 5 — Return top 10
  return unique.slice(0, 10);
}

// ── Haversine ───────────────────────────────────────────────────────────────

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Haversine straight-line distance in km
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return Math.round(R * c * 10) / 10;
}

// ── OSRM road distance (with mirrors) ──────────────────────────────────────

async function tryOSRMMirror(
  mirror: string,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): Promise<number | null> {
  const url = `${mirror}/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.code === 'Ok' && data.routes?.length > 0) {
    return Math.round((data.routes[0].distance / 1000) * 10) / 10;
  }
  return null;
}

async function getOSRMDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): Promise<number | null> {
  for (const mirror of OSRM_MIRRORS) {
    try {
      const d = await tryOSRMMirror(mirror, lat1, lon1, lat2, lon2);
      if (d !== null) return d;
    } catch {
      // try next mirror
    }
  }
  return null;
}

// ── Valhalla road distance ─────────────────────────────────────────────────

async function getValhallaDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): Promise<number | null> {
  const url = `${VALHALLA_URL}/route?json={"locations":[{"lat":${lat1},"lon":${lon1}},{"lat":${lat2},"lon":${lon2}}],"costing":"auto","directions_options":{"units":"km"}}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const km = data.trip?.summary?.length;
    if (typeof km === 'number') return Math.round(km * 10) / 10;
    return null;
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Road distance with 3-tier fallback:
 * 1. OSRM mirrors (3 endpoints)
 * 2. Valhalla
 * 3. Haversine (last resort)
 * Results are cached in localStorage for 5 min
 */
export async function getRoadDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): Promise<number> {
  const key = routeCacheKey(lat1, lon1, lat2, lon2);
  const cached = getRouteCache(key);
  if (cached !== null) return cached;

  // 1 — OSRM mirrors
  let distance = await getOSRMDistance(lat1, lon1, lat2, lon2);

  // 2 — Valhalla
  if (distance === null) {
    distance = await getValhallaDistance(lat1, lon1, lat2, lon2);
  }

  // 3 — Haversine (always available)
  if (distance === null) {
    distance = calculateDistance(lat1, lon1, lat2, lon2);
  }

  setRouteCache(key, distance);
  return distance;
}

/**
 * Delivery fee calculator based on distance pricing ranges
 */
export function calculateDeliveryFee(
  distance: number,
  ranges: { maxDistance: number | null; fee: number }[],
): number {
  const sorted = [...ranges].sort((a, b) => {
    const aMax = a.maxDistance === null ? Infinity : a.maxDistance;
    const bMax = b.maxDistance === null ? Infinity : b.maxDistance;
    return aMax - bMax;
  });
  for (const range of sorted) {
    if (range.maxDistance === null) return range.fee;
    if (distance <= range.maxDistance) return range.fee;
  }
  return sorted[sorted.length - 1]?.fee ?? 0;
}

/**
 * Checks if distance is within allowed delivery radius
 */
export function isWithinDeliveryRange(distance: number, maxDeliveryDistance: number): boolean {
  return distance <= maxDeliveryDistance;
}

/**
 * GPS location via browser Geolocation API
 */
export function getUserLocation(): Promise<{ lat: number; lng: number }> {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Geolocalización no soportada por el navegador'));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const messages: Record<number, string> = {
          1: 'Permiso de ubicación denegado',
          2: 'Ubicación no disponible',
          3: 'Tiempo de espera agotado',
        };
        reject(new Error(messages[err.code] ?? 'Error al obtener ubicación'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  });
}
