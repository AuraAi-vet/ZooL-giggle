import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { CalendarPlus, MapPin, Search } from 'lucide-react';

// Fix for default Leaflet icon in React
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// A green variant for selected
const customIconGreen = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Clinic {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  isOpenNow: boolean;
}

const mockGenerateClinics = (lat: number, lng: number): Clinic[] => {
  return [
    {
      id: "clinic_zool_tvm",
      name: "ZooL Pet Clinic - Trivandrum",
      address: "Kowdiar, Trivandrum, Kerala 695003",
      lat: lat + 0.01,
      lng: lng + 0.015,
      isOpenNow: true,
    },
    {
      id: "ext_2",
      name: "Happy Paws Vet Clinic",
      address: "Sasthamangalam, Trivandrum, Kerala",
      lat: lat - 0.012,
      lng: lng + 0.01,
      isOpenNow: true,
    },
    {
      id: "ext_3",
      name: "Blue Cross Animal Hospital",
      address: "Pattom, Trivandrum, Kerala",
      lat: lat + 0.005,
      lng: lng - 0.02,
      isOpenNow: false,
    },
    {
      id: "ext_4",
      name: "CUPPA Emergency Vet 24/7",
      address: "Kazhakkoottam, Trivandrum, Kerala",
      lat: lat - 0.02,
      lng: lng - 0.005,
      isOpenNow: true,
    }
  ];
};

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function NearbyClinicsWidget({ onBook }: { onBook: (clinicId: string, clinicName: string) => void }) {
  // Default to Trivandrum, Kerala coordinates
  const fallbackLocation: [number, number] = [8.5241, 76.9366];
  const [center, setCenter] = useState<[number, number]>(fallbackLocation);
  
  const clinics = useMemo(() => mockGenerateClinics(center[0], center[1]), [center[0], center[1]]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // Fallback if permission denied
        }
      );
    }
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] border border-white/50 p-1 flex flex-col h-full overflow-hidden relative min-h-[400px]">
      <div className="absolute top-4 left-4 z-[400] pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-black/5 pointer-events-auto w-max max-w-[calc(100vw-3rem)]">
          <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-500" />
            Nearby Care Providers (OSM)
          </h3>
          <p className="text-slate-500 text-xs mt-1">Select a marker on the map to book an appointment.</p>
        </div>
      </div>
      
      <div className="w-full h-full rounded-[20px] overflow-hidden z-10 isolate">
        <MapContainer 
          center={center} 
          zoom={13} 
          style={{ width: '100%', height: '100%', minHeight: '400px' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapController center={center} />
          
          {/* User Location Marker */}
          <Marker position={center} icon={customIconGreen}>
            <Popup>
              <strong>You are here</strong>
            </Popup>
          </Marker>

          {/* Clinic Markers */}
          {clinics.map(clinic => (
            <Marker 
              key={clinic.id} 
              position={[clinic.lat, clinic.lng]}
              icon={customIcon}
              eventHandlers={{
                click: () => setSelectedClinicId(clinic.id),
              }}
            >
              <Popup>
                <div className="p-1 max-w-[200px] text-sm">
                  <strong className="block mb-1 text-base">{clinic.name}</strong>
                  <p className="text-gray-600 mb-2 truncate text-xs whitespace-normal">{clinic.address}</p>
                  {clinic.isOpenNow ? (
                    <p className="text-emerald-600 font-medium text-xs mb-3">Open Now</p>
                  ) : (
                    <p className="text-rose-500 font-medium text-xs mb-3">Closed</p>
                  )}
                  <button 
                    onClick={() => onBook(clinic.id, clinic.name)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-brand-primary text-white rounded-lg font-semibold hover:bg-brand-primary/90 transition-all text-xs shadow-md"
                  >
                    <CalendarPlus className="w-4 h-4" /> Book Here
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
