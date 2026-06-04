import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Mapa atractivo usando Stadia Maps (gratuito)
const TILE_LAYER_URL = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
const TILE_LAYER_ATTRIBUTION = '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  markerPosition?: [number, number] | null;
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapComponent({ center, zoom = 13, onLocationSelect, markerPosition }: MapComponentProps) {
  return (
    <MapContainer center={center} zoom={zoom} className="h-64 w-full rounded-xl">
      <TileLayer
        attribution={TILE_LAYER_ATTRIBUTION}
        url={TILE_LAYER_URL}
      />
      <MapEvents onLocationSelect={onLocationSelect} />
      {markerPosition && <Marker position={markerPosition} />}
    </MapContainer>
  );
}
