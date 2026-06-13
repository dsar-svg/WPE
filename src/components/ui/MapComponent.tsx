import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { reverseGeocode } from '../../lib/DistanceService';

// ── Venezuela bounds ────────────────────────────────────────────────────────
const VE_SW = L.latLng(0.6, -73.5);
const VE_NE = L.latLng(12.5, -59.8);
const VE_BOUNDS = L.latLngBounds(VE_SW, VE_NE);

// ── Panda SVG marker ────────────────────────────────────────────────────────
function pandaIcon(color: 'red' | 'orange'): L.DivIcon {
  const fill = color === 'red' ? '#cb2027' : '#ff6b00';
  const html = `
    <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
      <ellipse cx="22" cy="44" rx="12" ry="4" fill="rgba(0,0,0,0.18)"/>
      <!-- body -->
      <ellipse cx="22" cy="30" rx="16" ry="18" fill="#fff"/>
      <!-- ears -->
      <circle cx="10" cy="12" r="7" fill="${fill}"/>
      <circle cx="34" cy="12" r="7" fill="${fill}"/>
      <circle cx="10" cy="12" r="4" fill="#222"/>
      <circle cx="34" cy="12" r="4" fill="#222"/>
      <!-- eyes -->
      <ellipse cx="16" cy="24" rx="5" ry="6" fill="#222"/>
      <ellipse cx="28" cy="24" rx="5" ry="6" fill="#222"/>
      <circle cx="15" cy="22" r="2" fill="#fff"/>
      <circle cx="27" cy="22" r="2" fill="#fff"/>
      <!-- nose -->
      <ellipse cx="22" cy="30" rx="2.5" ry="1.8" fill="#222"/>
      <!-- mouth -->
      <path d="M19 33 Q22 36 25 33" stroke="#222" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <!-- pin needle -->
      <path d="M22 44 L22 50" stroke="${fill}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="22" cy="49" r="3" fill="${fill}"/>
      <circle cx="22" cy="49" r="1.5" fill="#fff"/>
    </svg>`;
  return L.divIcon({
    className: 'panda-marker',
    html,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
  });
}

const pandaRed = pandaIcon('red');
const pandaOrange = pandaIcon('orange');

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
  markerPosition?: [number, number] | null;
  style?: 'modern' | 'light';
  showPopup?: boolean;
  isPreview?: boolean;
  fixedCenterMarker?: boolean;
  draggable?: boolean;
  maxDeliveryDistance?: number;
  markerColor?: 'red' | 'orange';
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function isInsideVenezuela(lat: number, lng: number): boolean {
  return VE_BOUNDS.contains(L.latLng(lat, lng));
}

// ── Inner components ────────────────────────────────────────────────────────

function MapCenterUpdater({ markerPosition }: { markerPosition?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (markerPosition) {
      map.flyTo(markerPosition, map.getZoom(), { duration: 0.5 });
    }
  }, [markerPosition, map]);
  return null;
}

function MapMoveHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void | Promise<void> }) {
  const onSelectRef = useRef(onLocationSelect);
  onSelectRef.current = onLocationSelect;
  const isInitialMove = useRef(true);
  useMapEvents({
    moveend() {
      if (isInitialMove.current) {
        isInitialMove.current = false;
        return;
      }
      const c = map.getCenter();
      onSelectRef.current(c.lat, c.lng);
    },
  });
  const map = useMap();
  return null;
}

function MapClickHandler({
  onLocationSelect,
  showPopup,
}: {
  onLocationSelect: (lat: number, lng: number) => void | Promise<void>;
  showPopup?: boolean;
}) {
  const onSelectRef = useRef(onLocationSelect);
  onSelectRef.current = onLocationSelect;
  const map = useMapEvents({
    async click(e) {
      await onSelectRef.current(e.latlng.lat, e.latlng.lng);
      if (showPopup) {
        L.popup()
          .setLatLng(e.latlng)
          .setContent(`<div style="padding:6px;text-align:center;font-size:12px"><b>Ubicación</b><br/>${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}</div>`)
          .openOn(map);
      }
    },
  });
  return null;
}

function DraggableMarker({
  position,
  icon,
  onDragEnd,
  onOutOfBounds,
}: {
  position: [number, number];
  icon: L.DivIcon;
  onDragEnd?: (lat: number, lng: number, address: string | null) => void | Promise<void>;
  onOutOfBounds?: (lat: number, lng: number) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const map = useMap();
  const handleDragEnd = useCallback(async () => {
    const marker = markerRef.current;
    if (!marker) return;
    const { lat, lng } = marker.getLatLng();
    if (!isInsideVenezuela(lat, lng)) {
      onOutOfBounds?.(lat, lng);
      // snap back to last valid position inside Venezuela
      const center = map.getCenter();
      marker.setLatLng(center);
      return;
    }
    const addr = await reverseGeocode(lat, lng);
    onDragEnd?.(lat, lng, addr);
  }, [map, onDragEnd, onOutOfBounds]);

  return (
    <Marker
      ref={markerRef as any}
      position={position}
      icon={icon}
      draggable={true}
      eventHandlers={{ dragend: handleDragEnd }}
    />
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function MapComponent({
  center,
  zoom = 13,
  onLocationSelect,
  onDragEnd,
  onOutOfBounds,
  markerPosition,
  style = 'modern',
  showPopup = true,
  isPreview = false,
  fixedCenterMarker = false,
  draggable = false,
  markerColor = 'red',
}: MapComponentProps) {
  const tile = TILE_LAYERS[style];
  const icon = markerColor === 'orange' ? pandaOrange : pandaRed;

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

        {fixedCenterMarker ? (
          <MapMoveHandler onLocationSelect={onLocationSelect} />
        ) : (
          <>
            <MapCenterUpdater markerPosition={markerPosition} />
            <MapClickHandler onLocationSelect={onLocationSelect} showPopup={showPopup && !isPreview} />
          </>
        )}

        {/* Draggable panda marker */}
        {draggable && markerPosition ? (
          <DraggableMarker
            position={markerPosition}
            icon={icon}
            onDragEnd={onDragEnd}
            onOutOfBounds={onOutOfBounds}
          />
        ) : (
          !fixedCenterMarker && markerPosition && (
            <Marker position={markerPosition} icon={icon} />
          )
        )}
      </MapContainer>

      {/* Fixed center crosshair (for fixedCenterMarker mode) */}
      {fixedCenterMarker && (
        <div className="absolute inset-0 pointer-events-none z-[1000] flex items-center justify-center">
          <div
            className="w-5 h-5 border-[3px] border-primary-vibrant rounded-full bg-white/30 backdrop-blur-sm"
            style={{ boxShadow: '0 0 0 6px rgba(203,32,39,0.15), 0 2px 8px rgba(0,0,0,0.3)' }}
          />
        </div>
      )}
    </div>
  );
}
