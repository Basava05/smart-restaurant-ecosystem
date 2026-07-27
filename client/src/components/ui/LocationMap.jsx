import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function LocationMap({ customerLoc, restaurantLoc }) {
  if (!restaurantLoc || !restaurantLoc.lat) return null;

  // Center on restaurant by default
  const center = [restaurantLoc.lat, restaurantLoc.lng];

  return (
    <div className="h-64 w-full rounded-2xl overflow-hidden border border-rail/20 shadow-sm mt-6">
      <MapContainer center={center} zoom={13} style={{ height: '100%', w: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        
        <Marker position={[restaurantLoc.lat, restaurantLoc.lng]}>
          <Popup>Restaurant</Popup>
        </Marker>

        {customerLoc && customerLoc.lat && (
          <Marker position={[customerLoc.lat, customerLoc.lng]}>
            <Popup>You</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
