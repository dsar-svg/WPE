import { useState, useCallback } from 'react';
import { AddressSuggestion } from '../types';
import {
  geocodeAddressMulti,
  reverseGeocode,
  calculateDistance,
  calculateDeliveryFee,
  isWithinDeliveryRange,
  getRoadDistance,
  getUserLocation,
} from '../lib/DistanceService';

const LAST_ADDRESS_KEY = 'wpd_last_address';
const LAST_ADDRESS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface LastAddress {
  address: string;
  lat: number;
  lng: number;
  ts: number;
}

export interface DistanceCalculationResult {
  distance: number;
  deliveryFee: number;
  isWithinRange: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useDistanceCalculation() {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Autocomplete search (multi-provider, sorted by distance to restaurant) ──

  const searchAddress = useCallback(async (query: string, restaurantLat?: number, restaurantLon?: number) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const results = await geocodeAddressMulti(query, restaurantLat, restaurantLon);
      setSuggestions(results);
    } catch {
      setError('Error al buscar direcciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Reverse geocode ─────────────────────────────────────────────────────

  const reverseGeocodeAddress = useCallback(
    async (lat: number, lng: number): Promise<string | null> => {
      return reverseGeocode(lat, lng);
    },
    [],
  );

  // ── Auto-geocode on blur ────────────────────────────────────────────────

  const autoGeocode = useCallback(
    async (address: string, restaurantLat?: number, restaurantLon?: number): Promise<AddressSuggestion | null> => {
      if (!address || address.trim().length < 5) return null;
      try {
        const results = await geocodeAddressMulti(address, restaurantLat, restaurantLon);
        return results.length > 0 ? results[0] : null;
      } catch {
        return null;
      }
    },
    [],
  );

  // ── Road distance ───────────────────────────────────────────────────────

  const calculateDistanceAndFee = useCallback(
    (
      originLat: number,
      originLng: number,
      destLat: number,
      destLng: number,
      pricingRanges: { maxDistance: number | null; fee: number }[],
      maxDeliveryDistance: number,
      useRoadDistance = false,
    ): DistanceCalculationResult => {
      const distance = calculateDistance(originLat, originLng, destLat, destLng);
      const deliveryFee = calculateDeliveryFee(distance, pricingRanges);
      const isWithinRange = isWithinDeliveryRange(distance, maxDeliveryDistance);
      void useRoadDistance; // road distance is async, handled separately
      return { distance, deliveryFee, isWithinRange, isLoading: false, error: null };
    },
    [],
  );

  const getRoadDistanceCalc = useCallback(
    async (lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> => {
      return getRoadDistance(lat1, lon1, lat2, lon2);
    },
    [],
  );

  // ── GPS auto-location ───────────────────────────────────────────────────

  const autoGeolocate = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      const loc = await getUserLocation();
      return loc;
    } catch {
      return null;
    }
  }, []);

  // ── Last address persistence ────────────────────────────────────────────

  const saveLastAddress = useCallback((address: string, lat: number, lng: number) => {
    try {
      const data: LastAddress = { address, lat, lng, ts: Date.now() };
      localStorage.setItem(LAST_ADDRESS_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, []);

  const loadLastAddress = useCallback((): LastAddress | null => {
    try {
      const raw = localStorage.getItem(LAST_ADDRESS_KEY);
      if (!raw) return null;
      const data: LastAddress = JSON.parse(raw);
      if (Date.now() - data.ts > LAST_ADDRESS_TTL_MS) {
        localStorage.removeItem(LAST_ADDRESS_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }, []);

  const clearLastAddress = useCallback(() => {
    localStorage.removeItem(LAST_ADDRESS_KEY);
  }, []);

  // ── Cleanup ─────────────────────────────────────────────────────────────

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    searchAddress,
    reverseGeocodeAddress,
    autoGeocode,
    calculateDistanceAndFee,
    getRoadDistanceCalc,
    autoGeolocate,
    saveLastAddress,
    loadLastAddress,
    clearLastAddress,
    clearSuggestions,
    suggestions,
    isLoading,
    error,
  };
}
