import { useState, useCallback } from 'react';
import { AddressSuggestion } from '../types';
import { DistanceService } from '../lib/DistanceService';

export interface DistanceCalculationResult {
  distance: number;
  deliveryFee: number;
  isWithinRange: boolean;
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  error: string | null;
}

export function useDistanceCalculation() {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca sugerencias de direcciones para autocompletado
   */
  const searchAddress = useCallback(async (query: string) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await DistanceService.geocodeAddress(query);
      setSuggestions(results);
    } catch (err) {
      setError('Error al buscar direcciones');
      console.error('Error en búsqueda de direcciones:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Calcula distancia y tarifa entre dos puntos
   */
  const calculateDistanceAndFee = useCallback((
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
    pricingRanges: { maxDistance: number | null; fee: number }[],
    maxDeliveryDistance: number
  ): DistanceCalculationResult => {
    const distance = DistanceService.calculateDistance(originLat, originLng, destinationLat, destinationLng);
    const deliveryFee = DistanceService.calculateDeliveryFee(distance, pricingRanges);
    const isWithinRange = DistanceService.isWithinDeliveryRange(distance, maxDeliveryDistance);

    return {
      distance,
      deliveryFee,
      isWithinRange,
      suggestions: [],
      isLoading: false,
      error: null
    };
  }, []);

  /**
   * Limpia las sugerencias y errores
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    searchAddress,
    calculateDistanceAndFee,
    clearSuggestions,
    suggestions,
    isLoading,
    error
  };
}