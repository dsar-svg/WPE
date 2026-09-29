import { useRef, useEffect, useCallback, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { reverseGeocode } from '../../lib/DistanceService';

// ── Venezuela bounds ────────────────────────────────────────────────────────
const VE_SW = L.latLng(0.6, -73.5);
const VE_NE = L.latLng(12.5, -59.8);
const VE_BOUNDS = L.latLngBounds(VE_SW, VE_NE);

// ── Base map ────────────────────────────────────────────────────────────────
// Principal: OpenFreeMap (vectorial, datos OpenStreetMap, gratis y sin API key).
// Respaldo: Esri Canvas (raster, sin API key) si no hay WebGL o OpenFreeMap no carga.
// Nota: CARTO basemaps ahora exige API key y muestra marca de agua, por eso no se usa.
const OSM_ATTRIBUTION = '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';
const VECTOR_STYLES = {
  modern: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/positron',
};
// Si el estilo vectorial no termina de cargar en este tiempo, se usa el respaldo raster.
const VECTOR_LOAD_TIMEOUT_MS = 8000;

const ESRI_ATTRIBUTION = 'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors';
const ESRI_CANVAS = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';
const FALLBACK_TILE_LAYERS = {
  modern: {
    url: `${ESRI_CANVAS}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    labelsUrl: `${ESRI_CANVAS}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
  },
  light: {
    url: `${ESRI_CANVAS}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    labelsUrl: `${ESRI_CANVAS}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
  },
};
// Esri Canvas solo tiene tiles hasta z16; por encima Leaflet escala los de z16.
const FALLBACK_MAX_NATIVE_ZOOM = 16;

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// ── Types ───────────────────────────────────────────────────────────────────
interface MapComponentProps {
  center: [number, number];
  centerKey?: number;
  zoom?: number;
  onLocationSelect: (lat: number, lng: number) => void | Promise<void>;
  onDragEnd?: (lat: number, lng: number, address: string | null) => void | Promise<void>;
  onOutOfBounds?: (lat: number, lng: number) => void;
  style?: 'modern' | 'light';
  isPreview?: boolean;
  markerColor?: 'red' | 'orange';
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function isInsideVenezuela(lat: number, lng: number): boolean {
  return VE_BOUNDS.contains(L.latLng(lat, lng));
}

// ── Inner components ────────────────────────────────────────────────────────

/**
 * Flies the map to `center` every time `centerKey` changes OR center coordinates change.
 * Tracks both the counter and actual lat/lng to avoid missed updates from batched state.
 */
function CenterFlyer({
  center,
  zoom,
  centerKey,
  skipNextRef,
}: {
  center: [number, number];
  zoom: number;
  centerKey: number;
  skipNextRef: React.MutableRefObject<boolean>;
}) {
  const map = useMap();
  const prevKey = useRef(centerKey);
  const prevCenter = useRef(center);

  useEffect(() => {
    const keyChanged = centerKey !== prevKey.current;
    const centerChanged =
      prevCenter.current[0] !== center[0] || prevCenter.current[1] !== center[1];

    if (keyChanged || centerChanged) {
      prevKey.current = centerKey;
      prevCenter.current = center;
      skipNextRef.current = true;
      map.flyTo(center, zoom, { duration: 0.8 });
    }
  }, [centerKey, center, zoom, map, skipNextRef]);

  return null;
}

/**
 * Debounced moveend — waits 600ms after the user stops moving before firing.
 * This prevents intermediate pauses during drag from triggering geocode.
 */
function MapMoveHandler({
  onLocationSelect,
  onDragEnd,
  onOutOfBounds,
  skipNextRef,
}: {
  onLocationSelect: (lat: number, lng: number) => void | Promise<void>;
  onDragEnd?: (lat: number, lng: number, address: string | null) => void | Promise<void>;
  onOutOfBounds?: (lat: number, lng: number) => void;
  skipNextRef: React.MutableRefObject<boolean>;
}) {
  const onSelectRef = useRef(onLocationSelect);
  onSelectRef.current = onLocationSelect;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;
  const onOutOfBoundsRef = useRef(onOutOfBounds);
  onOutOfBoundsRef.current = onOutOfBounds;
  const isInitialMove = useRef(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const map = useMap();

  const processCenter = useCallback(() => {
    const c = map.getCenter();
    const lat = c.lat;
    const lng = c.lng;

    if (!isInsideVenezuela(lat, lng)) {
      onOutOfBoundsRef.current?.(lat, lng);
      return;
    }

    onSelectRef.current(lat, lng);

    if (onDragEndRef.current) {
      reverseGeocode(lat, lng).then((addr) => {
        onDragEndRef.current?.(lat, lng, addr);
      });
    }
  }, [map]);

  useMapEvents({
    moveend() {
      if (isInitialMove.current) {
        isInitialMove.current = false;
        return;
      }
      // Skip if this move was triggered by CenterFlyer (address selection)
      if (skipNextRef.current) {
        skipNextRef.current = false;
        return;
      }
      // Debounce: wait 1s after last moveend before processing
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(processCenter, 1000);
    },
  });

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return null;
}

/**
 * Capa base vectorial (MapLibre dentro de Leaflet). Se carga bajo demanda y llama
 * `onFail` si no hay WebGL, si falla la descarga o si el estilo no carga a tiempo.
 */
function VectorBaseLayer({ styleUrl, onFail }: { styleUrl: string; onFail: () => void }) {
  const map = useMap();
  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;

  useEffect(() => {
    if (!hasWebGL()) {
      onFailRef.current();
      return;
    }

    let cancelled = false;
    let loaded = false;
    let layer: L.Layer | null = null;
    const fail = () => {
      if (cancelled || loaded) return;
      cancelled = true;
      if (layer) map.removeLayer(layer);
      onFailRef.current();
    };
    const timer = setTimeout(fail, VECTOR_LOAD_TIMEOUT_MS);

    Promise.all([
      import('maplibre-gl'),
      // Vite empaqueta el worker de MapLibre (y su chunk compartido) en un solo archivo.
      import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
      import('@maplibre/maplibre-gl-leaflet'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ])
      .then(([maplibregl, { default: workerUrl }, { maplibreGL }]) => {
        if (cancelled) return;
        maplibregl.setWorkerUrl(workerUrl);
        const glLayer = maplibreGL({ style: styleUrl, attributionControl: false });
        layer = glLayer;
        glLayer.addTo(map);
        map.attributionControl?.addAttribution(OSM_ATTRIBUTION);
        const glMap = glLayer.getMaplibreMap();
        glMap.once('load', () => {
          loaded = true;
          clearTimeout(timer);
        });
        // Antes de cargar, cualquier error (estilo, red) activa el respaldo.
        // Después, MapLibre reintenta tiles por sí solo.
        glMap.on('error', fail);
        glMap.getCanvas().addEventListener('webglcontextlost', () => {
          loaded = false;
          fail();
        });
      })
      .catch(fail);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (layer) map.removeLayer(layer);
      map.attributionControl?.removeAttribution(OSM_ATTRIBUTION);
    };
  }, [map, styleUrl]);

  return null;
}

// ── Main component ──────────────────────────────────────────────────────────

export function MapComponent({
  center,
  centerKey = 0,
  zoom = 13,
  onLocationSelect,
  onDragEnd,
  onOutOfBounds,
  style = 'modern',
  isPreview = false,
  markerColor = 'red',
}: MapComponentProps) {
  const fallbackTile = FALLBACK_TILE_LAYERS[style];
  const [useFallback, setUseFallback] = useState(false);
  const pinColor = markerColor === 'orange' ? '#ff6b00' : '#cb2027';
  const skipNextRef = useRef(false);

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={zoom}
        maxBounds={VE_BOUNDS}
        maxBoundsViscosity={0.8}
        minZoom={5}
        maxZoom={18}
        className={`${isPreview ? 'h-32' : 'h-64'} w-full rounded-xl shadow-lg border-2 border-white/20`}
        style={{ filter: isPreview ? 'brightness(0.9)' : 'none' }}
        dragging={!isPreview}
        scrollWheelZoom={!isPreview}
      >
        {useFallback ? (
          <>
            <TileLayer attribution={ESRI_ATTRIBUTION} url={fallbackTile.url} maxNativeZoom={FALLBACK_MAX_NATIVE_ZOOM} />
            <TileLayer url={fallbackTile.labelsUrl} maxNativeZoom={FALLBACK_MAX_NATIVE_ZOOM} />
          </>
        ) : (
          <VectorBaseLayer styleUrl={VECTOR_STYLES[style]} onFail={() => setUseFallback(true)} />
        )}
        <CenterFlyer center={center} zoom={zoom} centerKey={centerKey} skipNextRef={skipNextRef} />
        <MapMoveHandler
          onLocationSelect={onLocationSelect}
          onDragEnd={onDragEnd}
          onOutOfBounds={onOutOfBounds}
          skipNextRef={skipNextRef}
        />
      </MapContainer>

      {/* Fixed center pin */}
      <div className="absolute inset-0 pointer-events-none z-[1000] flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-[3px]"
          style={{
            borderColor: pinColor,
            backgroundColor: `${pinColor}22`,
            boxShadow: `0 0 0 8px ${pinColor}15, 0 2px 10px rgba(0,0,0,0.3)`,
          }}
        />
        <div
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: pinColor,
            boxShadow: `0 0 6px ${pinColor}88`,
          }}
        />
      </div>
    </div>
  );
}
