import { useRef, useEffect } from 'react';
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
 * Watches `center` prop and flies the map there when it changes.
 * Used when the user types/selects an address and we need the pin to move.
 */
function CenterFlyer({
  center,
  zoom,
  onFlyStart,
}: {
  center: [number, number];
  zoom: number;
  onFlyStart: () => void;
}) {
  const map = useMap();
  const prevCenter = useRef(center);

  useEffect(() => {
    const [lat, lng] = center;
    const [prevLat, prevLng] = prevCenter.current;
    // Only fly if the coordinates actually changed (not from our own moveend)
    if (lat !== prevLat || lng !== prevLng) {
      onFlyStart();
      map.flyTo([lat, lng], zoom, { duration: 0.8 });
      prevCenter.current = center;
    }
  }, [center, zoom, map, onFlyStart]);

  return null;
}

/**
 * Fires on every map move/end — reports the center coordinates to the parent.
 * The center is the "pin" position since the marker is fixed in the middle.
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
      const c = map.getCenter();
      const lat = c.lat;
      const lng = c.lng;

      if (!isInsideVenezuela(lat, lng)) {
        onOutOfBoundsRef.current?.(lat, lng);
        return;
      }

      onSelectRef.current(lat, lng);

      // Reverse geocode the center and report via onDragEnd
      if (onDragEndRef.current) {
        reverseGeocode(lat, lng).then((addr) => {
          onDragEndRef.current?.(lat, lng, addr);
        });
      }
    },
  });
  const map = useMap();
  return null;
}

// ── Main component ──────────────────────────────────────────────────────────

export function MapComponent({
  center,
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

  const handleFlyStart = () => {
    skipNextRef.current = true;
  };

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
        <CenterFlyer center={center} zoom={zoom} onFlyStart={handleFlyStart} />
        <MapMoveHandler
          onLocationSelect={onLocationSelect}
          onDragEnd={onDragEnd}
          onOutOfBounds={onOutOfBounds}
          skipNextRef={skipNextRef}
        />
      </MapContainer>

      {/* Fixed center pin — always visible, never moves */}
      <div className="absolute inset-0 pointer-events-none z-[1000] flex items-center justify-center">
        {/* Outer ring */}
        <div
          className="w-8 h-8 rounded-full border-[3px]"
          style={{
            borderColor: pinColor,
            backgroundColor: `${pinColor}22`,
            boxShadow: `0 0 0 8px ${pinColor}15, 0 2px 10px rgba(0,0,0,0.3)`,
          }}
        />
        {/* Inner dot */}
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
