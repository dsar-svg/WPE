import { AddressSuggestion } from '../types';

const routeCache = new Map<string, { distance: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function cacheKey(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const r = (n: number) => n.toFixed(3);
  return `${r(lat1)},${r(lon1)}|${r(lat2)},${r(lon2)}`;
}

function getCached(key: string): number | null {
  const entry = routeCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.distance;
  routeCache.delete(key);
  return null;
}

function setCache(key: string, distance: number): void {
  if (routeCache.size > 500) routeCache.clear();
  routeCache.set(key, { distance, timestamp: Date.now() });
}

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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=10&countrycodes=ve&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WPandaExpress/1.0 (PWA App)'
          }
        }
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

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
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
      if (range.maxDistance === null) {
        // Este es el rango "cachall" para distancias más allá de todos los límites finitos
        return range.fee;
      }
      if (distance <= range.maxDistance) {
        return range.fee;
      }
    }

    // No debería llegar aquí si ranges no está vacío, pero por seguridad
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
   * Obtiene distancia real por carretera con 3 niveles de precisión:
   * 1. GraphHopper (API key configurable, recomendado)
   * 2. OSRM público (fallback gratuito)
   * 3. Haversine (último recurso, línea recta)
   */
  static async getRoadDistance(lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> {
    const key = cacheKey(lat1, lon1, lat2, lon2);
    const cached = getCached(key);
    if (cached !== null) return cached;

    const apiKey = import.meta.env.VITE_GRAPHOPPER_API_KEY as string | undefined;
    let distance: number;

    if (apiKey) {
      try {
        distance = await this.getGraphHopperDistance(lat1, lon1, lat2, lon2, apiKey);
        setCache(key, distance);
        return distance;
      } catch (error) {
        console.warn('GraphHopper no disponible, usando OSRM:', error);
      }
    }

    try {
      distance = await this.getOSRMDistance(lat1, lon1, lat2, lon2);
    } catch (error) {
      console.warn('OSRM no disponible, usando Haversine:', error);
      distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    }

    setCache(key, distance);
    return distance;
  }

  /**
   * Distancia por GraphHopper (API key requerida)
   * Plan gratuito: 1,000 solicitudes/día
   */
  private static async getGraphHopperDistance(
    lat1: number, lon1: number, lat2: number, lon2: number, apiKey: string
  ): Promise<number> {
    const url = `https://graphhopper.com/api/1/route?point=${lat1},${lon1}&point=${lat2},${lon2}&vehicle=car&locale=es&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GraphHopper error: ${response.status}`);
    const data = await response.json();
    if (data.paths?.length > 0) {
      return Math.round((data.paths[0].distance / 1000) * 10) / 10;
    }
    throw new Error('GraphHopper: no route found');
  }

  /**
   * Distancia por OSRM público (OpenStreetMap)
   * Límite: ~1 req/s, sin garantías
   */
  private static async getOSRMDistance(
    lat1: number, lon1: number, lat2: number, lon2: number
  ): Promise<number> {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`,
      {
        headers: { 'User-Agent': 'WPandaExpress/1.0 (PWA App)' }
      }
    );
    if (!response.ok) throw new Error(`OSRM error: ${response.status}`);
    const data = await response.json();
    if (data.code === 'Ok' && data.routes?.length > 0) {
      return Math.round((data.routes[0].distance / 1000) * 10) / 10;
    }
    throw new Error('OSRM: no route found');
  }

  /**
   * Convierte grados a radianes
   */
  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Obtiene la ubicación aproximada del usuario usando geolocalización del navegador
   * @returns Coordenadas del usuario o un mensaje de error si no se puede obtener
   */
  static async getUserLocation(): Promise<{ lat: number; lng: number }> {
    if (!navigator.geolocation) {
      throw new Error('Geolocalización no soportada por el navegador');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Permiso de ubicación denegado'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Ubicación no disponible'));
              break;
            case error.TIMEOUT:
              reject(new Error('Tiempo de espera agotado'));
              break;
            default:
              reject(new Error('Error al obtener ubicación'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }
}