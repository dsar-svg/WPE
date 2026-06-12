import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const pandaIcon = new L.Icon({
  iconUrl: '/panda-marker.png',
  iconSize: [64, 64],
  iconAnchor: [32, 64],
});

const createCustomIcon = (color = 'var(--color-primary-vibrant)') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      ">
        <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const markerStyles = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  .custom-marker { transition: all 0.3s ease; }
  .custom-marker:hover { transform: scale(1.2); }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = markerStyles;
  document.head.appendChild(style);
}

const TILE_LAYERS = {
  modern: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/" target="_blank">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/" target="_blank">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
};

interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  onLocationSelect: (lat: number, lng: number) => void | Promise<void>;
  markerPosition?: [number, number] | null;
  style?: 'modern' | 'light';
  showPopup?: boolean;
  isPreview?: boolean;
  fixedCenterMarker?: boolean;
}

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

  const map = useMapEvents({
    moveend() {
      if (isInitialMove.current) {
        isInitialMove.current = false;
        return;
      }
      const center = map.getCenter();
      onSelectRef.current(center.lat, center.lng);
    },
  });
  return null;
}

function MapEvents({ onLocationSelect, showPopup }: { onLocationSelect: (lat: number, lng: number) => void | Promise<void>; showPopup?: boolean }) {
  const onSelectRef = useRef(onLocationSelect);
  onSelectRef.current = onLocationSelect;

  const map = useMapEvents({
    async click(e) {
      await onSelectRef.current(e.latlng.lat, e.latlng.lng);

      if (showPopup) {
        L.popup()
          .setLatLng(e.latlng)
          .setContent(`
            <div style="padding: 8px; text-align: center;">
              <strong>Ubicación seleccionada</strong><br>
              ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}
            </div>
          `)
          .openOn(map);
      }
    },
  });
  return null;
}

export function MapComponent({
  center,
  zoom = 13,
  onLocationSelect,
  markerPosition,
  style = 'modern',
  showPopup = true,
  isPreview = false,
  fixedCenterMarker = false
}: MapComponentProps) {
  const selectedTileLayer = TILE_LAYERS[style];

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={zoom}
        className={`${isPreview ? 'h-32' : 'h-64'} w-full rounded-xl shadow-lg border-2 border-white/20`}
        style={{ filter: isPreview ? 'brightness(0.9)' : 'none' }}
        dragging={!isPreview}
        scrollWheelZoom={!isPreview}
      >
        <TileLayer
          attribution={selectedTileLayer.attribution}
          url={selectedTileLayer.url}
        />
        {fixedCenterMarker ? (
          <MapMoveHandler onLocationSelect={onLocationSelect} />
        ) : (
          <>
            <MapCenterUpdater markerPosition={markerPosition} />
            <MapEvents onLocationSelect={onLocationSelect} showPopup={showPopup && !isPreview} />
          </>
        )}
        {!fixedCenterMarker && markerPosition && (
          <Marker
            position={markerPosition}
            icon={createCustomIcon(isPreview ? '#25D366' : 'var(--color-primary-vibrant)')}
          />
        )}
      </MapContainer>
      {fixedCenterMarker && (
        <div className="absolute inset-0 pointer-events-none z-[1000] flex items-center justify-center">
          <div style={{
            width: 0,
            height: 0,
            borderLeft: '14px solid transparent',
            borderRight: '14px solid transparent',
            borderBottom: '28px solid var(--color-primary-vibrant)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            transform: 'translateY(-50%)',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-vibrant)',
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            marginTop: -14,
          }} />
        </div>
      )}
    </div>
  );
}
