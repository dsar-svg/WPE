import { useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { reverseGeocode } from '../../lib/DistanceService';

// ── Venezuela bounds ────────────────────────────────────────────────────────
const VE_SW = L.latLng(0.6, -73.5);
const VE_NE = L.latLng(12.5, -59.8);
const VE_BOUNDS = L.latLngBounds(VE_SW, VE_NE);

// ── Tile layers ─────────────────────────────────────────────────────────────
const TILE_LAYERS = {
  modern: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
};

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
      // Debounce: wait 600ms after last moveend before processing
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(processCenter, 1000);
    },
  });
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
  const tile = TILE_LAYERS[style];
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
        <TileLayer attribution={tile.attribution} url={tile.url} />
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
