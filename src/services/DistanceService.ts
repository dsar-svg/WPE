import { AddressSuggestion } from '../types';

export class DistanceService {
  /**
   * Geocodifica una dirección usando Nominatim (OpenStreetMap)
   * @param address Dirección a geocodificar
   * @returns Array de sugerencias de direcciones
   */
  static async geocodeAddress(address: string): Promise<AddressSuggestion[]> {
    if (!address || address.trim().length < 3) {
      return [];
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&countrycodes=ve&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error(`Error en geocodificación: ${response.status}`);
      }

      const data = await response.json();
      return data.map((item: any) => ({
        place_id: item.place_id,
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
        boundingbox: item.boundingbox
      }));
    } catch (error) {
      console.error('Error en geocodificación:', error);
      return [];
    }
  }

  /**
   * Calcula la distancia en kilómetros entre dos puntos usando la fórmula Haversine
   * @param lat1 Latitud del punto 1
   * @param lon1 Longitud del punto 1
   * @param lat2 Latitud del punto 2
   * @param lon2 Longitud del punto 2
   * @returns Distancia en kilómetros
   */
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Redondear a 1 decimal
  }

  /**
   * Calcula la tarifa de delivery basada en la distancia y los rangos configurados
   * @param distance Distancia en kilómetros
   * @param ranges Rangos de tarifas configurados
   * @returns Tarifa calculada
   */
  static calculateDeliveryFee(distance: number, ranges: { maxDistance: number | null; fee: number }[]): number {
    // Ordenar rangos por distancia máxima (ascendente)
    const sortedRanges = [...ranges].sort((a, b) => {
      const aMax = a.maxDistance === null ? Infinity : a.maxDistance;
      const bMax = b.maxDistance === null ? Infinity : b.maxDistance;
      return aMax - bMax;
    });

    // Encontrar el rango que corresponde a la distancia
    for (const range of sortedRanges) {
      if (range.maxDistance === null || distance <= range.maxDistance) {
        return range.fee;
      }
    }

    // Si no hay rango, usar el último (que debería ser el de distancia máxima)
    return sortedRanges[sortedRanges.length - 1]?.fee || 0;
  }

  /**
   * Verifica si una distancia está dentro del rango de delivery permitido
   * @param distance Distancia en kilómetros
   * @param maxDeliveryDistance Distancia máxima permitida
   * @returns true si está dentro del rango
   */
  static isWithinDeliveryRange(distance: number, maxDeliveryDistance: number): boolean {
    return distance <= maxDeliveryDistance;
  }

  /**
   * Convierte grados a radianes
   */
  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Obtiene la ubicación aproximada del usuario usando geolocalización del navegador
   * @returns Coordenadas del usuario o null si no se puede obtener
   */
  static async getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('No se pudo obtener la ubicación del usuario:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000 // 5 minutos de cache
        }
      );
    });
  }
}