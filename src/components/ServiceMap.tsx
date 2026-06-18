import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Place, getDirectionsUrl } from '../services/mapsService';
import { ExternalLink, MapPin, Navigation, X, Star, Zap, Heart, Scissors, Home, ShoppingBag, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { createRoot } from 'react-dom/client';
import { useStore } from '../store/useStore';

interface ServiceMapProps {
  center: { lat: number, lng: number };
  places: Place[];
  onPlaceSelect?: (place: Place) => void;
  onMarkerClick?: (placeId: string) => void;
  onBookInit?: (place: Place) => void;
  onClosePopup?: () => void;
  isLoading?: boolean;
  selectedPlaceId?: string;
}

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A component to center map on selection
function MapController({ center, selectedLocation }: { center: { lat: number, lng: number }, selectedLocation?: { lat: number, lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (selectedLocation) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 15, { animate: true, duration: 1.5 });
    } else if (center) {
      map.flyTo([center.lat, center.lng], 13, { animate: true, duration: 1.5 });
    }
  }, [center, selectedLocation, map]);
  return null;
}

// React-Leaflet doesn't support complex React custom markers out of the box dynamically easily without divIcon,
// so we construct an HTML string or use a simplified divIcon.
const createCustomIcon = (place: Place, isSelected: boolean) => {
  const getTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'vet': return '#10B981'; // emerald-500
      case 'grooming': case 'groomer': return '#3B82F6'; // blue-500
      case 'boarding': return '#F59E0B'; // amber-500
      case 'shop': case 'pet_store': case 'pet store': return '#8B5CF6'; // violet-500
      case 'pharmacy': return '#EC4899'; // pink-500
      default: return '#2D2A26'; // primary
    }
  };
  const color = place.isSubsidized ? '#10B981' : getTypeColor(place.type);
  const scale = isSelected ? 1.5 : (place.isSubsidized ? 1.2 : 1);
  const size = 32 * scale;
  
  const innerHTML = `
    <div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${isSelected ? '2px solid #2D2A26' : '2px solid white'}; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); display: flex; align-items: center; justify-content: center; position: relative;">
      ${isSelected ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid ${color}; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
    </div>
  `;

  return L.divIcon({
    html: innerHTML,
    className: 'custom-leaflet-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size]
  });
};

const userIcon = L.divIcon({
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
      <div style="position: absolute; width: 32px; height: 32px; background-color: rgba(59, 130, 246, 0.2); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: relative; width: 16px; height: 16px; background-color: #2563EB; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
    </div>
  `,
  className: 'user-leaflet-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export function ServiceMap({ center, places: propPlaces, onPlaceSelect, onMarkerClick, onBookInit, onClosePopup, isLoading, selectedPlaceId }: ServiceMapProps) {
  const { nearbyPlaces } = useStore();
  const displayPlaces = nearbyPlaces && nearbyPlaces.length > 0 ? nearbyPlaces : propPlaces;
  const [localSelectedPlace, setLocalSelectedPlace] = useState<Place | null>(null);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (selectedPlaceId) {
      const p = displayPlaces.find(p => p.id === selectedPlaceId);
      if (p) setLocalSelectedPlace(p);
    }
  }, [selectedPlaceId, displayPlaces]);

  const handleMarkerClick = (p: Place) => {
    setLocalSelectedPlace(p);
    onMarkerClick?.(p.id);
  };

  return (
    <div className="w-full h-full relative rounded-[2rem] overflow-hidden border border-ruru-navy/10 shadow-xl bg-[#F5F5F0]">
      {/* Container must be z-0 so popups can go over */}
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={13} 
        style={{ width: '100%', height: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <MapController 
          center={center} 
          selectedLocation={localSelectedPlace?.location} 
        />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location */}
        <Marker position={[center.lat, center.lng]} icon={userIcon} />

        {/* Places */}
        {displayPlaces.map((place) => (
          <Marker 
            key={place.id}
            position={[place.location.lat, place.location.lng]}
            icon={createCustomIcon(place, (selectedPlaceId || localSelectedPlace?.id) === place.id)}
            eventHandlers={{
              click: () => handleMarkerClick(place)
            }}
          >
            {/* Custom Popup showing service name and distance */}
            <Popup className="custom-leaflet-popup min-w-[200px]" closeButton={false}>
              <div className="flex flex-col gap-1 p-1">
                <span className="font-brand font-bold text-ruru-navy text-sm">{place.name}</span>
                {place.distance && (
                  <span className="text-xs text-slate-500 font-medium">{place.distance}</span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating UI Container - Overlaid on map */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
        <div className="flex gap-2 pointer-events-auto self-start">
           <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg flex items-center gap-2">
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isOffline ? "bg-amber-500" : "bg-ruru-teal")} />
            <span className="text-[9px] font-black uppercase tracking-widest text-ruru-navy">
              {isOffline ? 'OSM Offline Cache Active' : 'OSM Powered'}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {(selectedPlaceId || localSelectedPlace) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-sm mx-auto bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border border-white/20 pointer-events-auto"
            >
              <div className={cn(
                "w-full h-2 rounded-full mb-4",
                (selectedPlaceId ? displayPlaces.find(p => p.id === selectedPlaceId) : localSelectedPlace)?.type === 'vet' ? "bg-ruru-teal" : "bg-amber-500"
              )} />
              <div className="flex justify-between items-start mb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-ruru-navy/60">
                      {(selectedPlaceId ? displayPlaces.find(p => p.id === selectedPlaceId) : localSelectedPlace)?.type}
                    </span>
                    {(selectedPlaceId ? displayPlaces.find(p => p.id === selectedPlaceId) : localSelectedPlace)?.isSubsidized && (
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border border-ruru-teal-200">
                        <Zap size={8} className="fill-emerald-600" /> Subsidized
                      </span>
                    )}
                  </div>
                  <h4 className="font-brand text-2xl text-ruru-navy line-clamp-1 pr-8">
                    {(selectedPlaceId ? displayPlaces.find(p => p.id === selectedPlaceId) : localSelectedPlace)?.name}
                  </h4>
                </div>
                <button 
                  onClick={() => {
                    setLocalSelectedPlace(null);
                    onClosePopup?.();
                  }}
                  className="absolute top-6 right-6 p-3 bg-[#F5F5F0] rounded-[1.5rem] text-ruru-navy/60 hover:text-ruru-navy transition-all hover:rotate-90"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4 mb-8">
                <p className="text-[11px] text-ruru-navy/60 flex items-center gap-2 font-medium">
                  <MapPin size={16} className="text-ruru-navy-light" /> 
                  <span className="truncate">{(selectedPlaceId ? displayPlaces.find(p => p.id === selectedPlaceId) : localSelectedPlace)?.address}</span>
                </p>
                <div className="flex items-center gap-4">
                  {(selectedPlaceId ? displayPlaces.find(p => p.id === selectedPlaceId) : localSelectedPlace)?.rating && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-[1.25rem] border border-amber-100">
                      <Star size={14} className="fill-amber-500 text-amber-500" />
                      <span className="text-xs font-black">{(selectedPlaceId ? displayPlaces.find(p => p.id === selectedPlaceId) : localSelectedPlace)?.rating}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-[1.25rem] border border-blue-100">
                    <Navigation size={14} className="rotate-45" />
                    <span className="text-[10px] font-black uppercase">Rapid Access</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={getDirectionsUrl((selectedPlaceId ? displayPlaces.find(p => p.id === selectedPlaceId) : localSelectedPlace)!.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 py-4 bg-[#F5F5F0] text-ruru-navy rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border border-ruru-navy/10 hover:bg-white/95 backdrop-blur-3xl transition-all shadow-sm"
                >
                  Directions
                </motion.a>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const p = (selectedPlaceId ? displayPlaces.find(p => p.id === selectedPlaceId) : localSelectedPlace) as Place;
                    if (onBookInit) {
                      onBookInit(p);
                    } else {
                      onPlaceSelect?.(p);
                    }
                  }}
                  className="flex items-center justify-center gap-3 py-4 bg-ruru-navy text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#2D2A26]/20"
                >
                  {onBookInit ? 'Book Service' : 'Visit Section'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
