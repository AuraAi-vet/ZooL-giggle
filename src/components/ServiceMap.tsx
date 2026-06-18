import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  Marker, 
  Popup, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import localforage from 'localforage';
import { Place, getDirectionsUrl } from '../services/mapsService';
import { ExternalLink, MapPin, Navigation, X, Star, Zap, Heart, Scissors, Home, ShoppingBag, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence, animate } from 'motion/react';
import { cn } from '../lib/utils';
import { createRoot } from 'react-dom/client';
import { useStore } from '../store/useStore';
import { vibrateLight } from '../utils/vibrator';

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

// Offline-first caching tile layer powered by localForage with state synchronization
const addPendingTile = async (key: string, url: string) => {
  try {
    const list = await localforage.getItem<Array<{ key: string; url: string }>>('pending-tile-requests') || [];
    if (!list.some(item => item.key === key)) {
      list.push({ key, url });
      await localforage.setItem('pending-tile-requests', list);
    }
  } catch (err) {
    console.warn("Failed to save pending tile request:", err);
  }
};

interface OfflineTileLayerProps {
  url: string;
  attribution: string;
  onTileSynced?: (timestamp: string) => void;
}

export function OfflineTileLayer({ url, attribution, onTileSynced }: OfflineTileLayerProps) {
  const map = useMap();

  useEffect(() => {
    const CachingTileLayer = L.TileLayer.extend({
      createTile: function(coords: any, done: any) {
        const tile = document.createElement('img');
        tile.className = 'leaflet-tile';
        tile.crossOrigin = 'Anonymous';
        const tileUrl = this.getTileUrl(coords);
        const cacheKey = `tile-${coords.z}-${coords.x}-${coords.y}`;

        localforage.getItem<string>(cacheKey)
          .then((base64) => {
            if (base64) {
              tile.src = base64;
              done(null, tile);
            } else {
              // Online: fetch with CORS mode enabled, save to localforage cache as base64 on load
              fetch(tileUrl, { mode: 'cors' })
                .then((response) => response.blob())
                .then((blob) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64Data = reader.result as string;
                    localforage.setItem(cacheKey, base64Data).catch((err) => {
                      console.warn("Tile cache offline save issue:", err);
                    });

                    // Update OSM Sync timestamp
                    const nowStr = new Date().toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    });
                    localforage.setItem('osm-last-synced', nowStr).catch(() => {});
                    if (onTileSynced) {
                      onTileSynced(nowStr);
                    }

                    tile.src = base64Data;
                    done(null, tile);
                  };
                  reader.readAsDataURL(blob);
                })
                .catch((error) => {
                  // Connection issue or CORS fail: fallback to direct URL
                  console.warn("Direct tile fallback:", error);
                  addPendingTile(cacheKey, tileUrl);
                  tile.src = tileUrl;
                  done(null, tile);
                });
            }
          })
          .catch((err) => {
            console.warn("Tile cache retrieval failed:", err);
            tile.src = tileUrl;
            done(null, tile);
          });

        return tile;
      }
    });

    const layerInstance = new (CachingTileLayer as any)(url, { attribution });
    layerInstance.addTo(map);

    return () => {
      map.removeLayer(layerInstance);
    };
  }, [map, url, attribution, onTileSynced]);

  return null;
}

// Animate map panning smoothly to coordinates using fitBounds or smooth fly
function MapController({ center, selectedLocation }: { center: { lat: number, lng: number }, selectedLocation?: { lat: number, lng: number } }) {
  const map = useMap();
  const lastLocRef = useRef<{ lat: number; lng: number } | undefined>(undefined);

  useEffect(() => {
    if (selectedLocation) {
      if (lastLocRef.current?.lat === selectedLocation.lat && lastLocRef.current?.lng === selectedLocation.lng) {
        return;
      }
      lastLocRef.current = selectedLocation;

      // Fit map bounds to selected service location and its surrounding 5km radius
      const latLng = L.latLng(selectedLocation.lat, selectedLocation.lng);
      const bounds = latLng.toBounds(5000); // 5000 meters (5km) radius bounds
      map.fitBounds(bounds, { 
        animate: true, 
        duration: 1.5,
        padding: [30, 30]
      });
    } else {
      if (lastLocRef.current) {
        lastLocRef.current = undefined;
        map.setView([center.lat, center.lng], 13, {
          animate: true,
          duration: 1.2
        });
      }
    }
  }, [center, selectedLocation, map]);

  return null;
}

// React-Leaflet doesn't support complex React custom markers out of the box dynamically easily without divIcon,
// so we construct an HTML string with accessibility features.
const createCustomIcon = (place: Place, isSelected: boolean, hoveredLegendType: string | null) => {
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

  const isTypeMatch = (pt: string, target: string) => {
    const pType = pt.toLowerCase();
    const tType = target.toLowerCase();
    if (tType === 'vet') return pType === 'vet';
    if (tType === 'groomer') return pType === 'groomer' || pType === 'grooming';
    if (tType === 'pharmacy') return pType === 'pharmacy';
    if (tType === 'shop') return pType === 'shop' || pType === 'pet_store' || pType === 'pet store';
    if (tType === 'boarding') return pType === 'boarding';
    return pType === tType;
  };

  const getCategorySvg = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'vet': 
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
      case 'grooming': 
      case 'groomer': 
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="9.8" y1="9.8" x2="20" y2="20"/><line x1="9.8" y1="14.2" x2="20" y2="4"/></svg>`;
      case 'boarding': 
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
      case 'shop': 
      case 'pet_store': 
      case 'pet store': 
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
      default: 
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>`;
    }
  };

  const isHighlighted = hoveredLegendType ? isTypeMatch(place.type, hoveredLegendType) : false;
  const isDimmed = hoveredLegendType && !isHighlighted;

  const color = place.isSubsidized ? '#10B981' : getTypeColor(place.type);
  const scale = isSelected ? 1.4 : (isHighlighted ? 1.25 : (place.isSubsidized ? 1.15 : 1.0));
  const size = 38 * scale;
  
  const distanceStr = place.distance ? `, Distance: ${place.distance}` : '';
  const ariaLabel = `Map Marker for ${place.name} - Category: ${place.type || 'Service'}${distanceStr}`;
  const svgIcon = getCategorySvg(place.type);

  // Bento-inspired tear-drop shaped pinpoint with rotating hover and high-contrast color pop
  const innerHTML = `
    <div 
      class="custom-marker-inner"
      role="button" 
      aria-label="${ariaLabel}" 
      tabindex="0"
      style="
        background: white; 
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 50% 50% 50% 0; 
        transform: rotate(-45deg); 
        border: ${isSelected ? '3px solid #2D2A26' : '1.5px solid rgba(11,20,36,0.12)'}; 
        box-shadow: 0 10px 20px -5px rgba(0,0,0,0.18), 0 4px 6px -2px rgba(0,0,0,0.08); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        position: relative;
        opacity: ${isDimmed ? 0.25 : 1};
        transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
      "
    >
      <div style="
        background-color: ${color}; 
        width: 80%; 
        height: 80%; 
        border-radius: 50%; 
        transform: rotate(45deg); 
        display: flex; 
        align-items: center; 
        justify-content: center;
        box-shadow: inset 0 2px 4px rgba(255,255,255,0.2);
      ">
        ${svgIcon}
      </div>
      ${isSelected ? `<div style="position: absolute; inset: -4px; border-radius: 50% 50% 50% 0; border: 2px solid ${color}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
    </div>
  `;

  return L.divIcon({
    html: innerHTML,
    className: 'custom-leaflet-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size]
  });
};

const userIcon = L.divIcon({
  html: `
    <div 
      role="status" 
      aria-label="Your current dynamic physical location"
      style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;"
    >
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
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [hoveredLegendType, setHoveredLegendType] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const [syncProgress, setSyncProgress] = useState<number | null>(null);
  const [syncTotal, setSyncTotal] = useState<number>(0);
  const [syncCurrent, setSyncCurrent] = useState<number>(0);

  const isMounted = useRef(true);

  const startSyncingTiles = async () => {
    try {
      const pending = await localforage.getItem<Array<{ key: string, url: string }>>('pending-tile-requests') || [];
      if (pending.length === 0) return;

      if (isMounted.current) {
        setSyncTotal(pending.length);
        setSyncCurrent(0);
        setSyncProgress(0);
      }

      let completed = 0;
      const remaining: Array<{ key: string, url: string }> = [];

      for (const item of pending) {
        if (!isMounted.current) break;
        try {
          const res = await fetch(item.url, { mode: 'cors' });
          if (!res.ok) throw new Error("Fetch tile failed");
          const blob = await res.blob();
          
          await new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = async () => {
              try {
                const base64Data = reader.result as string;
                await localforage.setItem(item.key, base64Data);
                resolve();
              } catch (e) {
                reject(e);
              }
            };
            reader.onerror = () => reject(new Error("File read error"));
            reader.readAsDataURL(blob);
          });

          completed++;
          if (isMounted.current) {
            setSyncCurrent(completed);
            setSyncProgress(Math.round((completed / pending.length) * 100));
          }
        } catch (e) {
          console.warn("Tile sync failed for:", item.key, e);
          remaining.push(item);
        }
      }

      await localforage.setItem('pending-tile-requests', remaining);
      
      const nowStr = new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      await localforage.setItem('osm-last-synced', nowStr);
      if (isMounted.current) {
        setLastSynced(nowStr);
      }

      setTimeout(() => {
        if (isMounted.current) {
          setSyncProgress(null);
        }
      }, 3000);
    } catch (err) {
      console.warn("Tile sync system issue:", err);
      if (isMounted.current) {
        setSyncProgress(null);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    if (!isOffline) {
      startSyncingTiles();
    }
    return () => {
      isMounted.current = false;
    };
  }, [isOffline]);

  const isTypeMatch = (pt: string, target: string) => {
    const pType = pt.toLowerCase();
    const tType = target.toLowerCase();
    if (tType === 'all') return true;
    if (tType === 'vet') return pType === 'vet';
    if (tType === 'groomer') return pType === 'groomer' || pType === 'grooming';
    if (tType === 'pharmacy') return pType === 'pharmacy';
    if (tType === 'shop') return pType === 'shop' || pType === 'pet_store' || pType === 'pet store';
    if (tType === 'boarding') return pType === 'boarding';
    return pType === tType;
  };

  const filteredPlaces = React.useMemo(() => {
    if (selectedFilter === 'all') return displayPlaces;
    return displayPlaces.filter(p => isTypeMatch(p.type, selectedFilter));
  }, [displayPlaces, selectedFilter]);

  useEffect(() => {
    localforage.getItem<string>('osm-last-synced')
      .then((val) => {
        if (val) setLastSynced(val);
      })
      .catch((err) => console.log("Failed to load last synced tile metadata:", err));
  }, []);

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
    <motion.div 
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full relative rounded-[2rem] overflow-hidden border border-ruru-navy/10 shadow-xl bg-[#F5F5F0]"
    >
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
        
        <OfflineTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          onTileSynced={setLastSynced}
        />

        {/* User Location */}
        <Marker 
          position={[center.lat, center.lng]} 
          icon={userIcon}
          alt="User current position marker"
        />

        {/* Places */}
        {filteredPlaces.map((place) => (
          <Marker 
            key={place.id}
            position={[place.location.lat, place.location.lng]}
            icon={createCustomIcon(place, (selectedPlaceId || localSelectedPlace?.id) === place.id, hoveredLegendType)}
            alt={`Location marker for ${place.name} (${place.type})`}
            eventHandlers={{
              click: () => handleMarkerClick(place)
            }}
          >
            {/* Custom Popup showing service name and distance */}
            <Popup className="custom-leaflet-popup min-w-[200px]" closeButton={false}>
              <div className="flex flex-col gap-1 p-1" tabIndex={0}>
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
        <div className="flex justify-between items-start w-full pointer-events-none">
          <div className="flex flex-col gap-2.5 pointer-events-auto self-start max-w-[calc(100%-160px)]">
            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg flex items-center gap-2 pointer-events-auto" role="status" aria-live="polite">
              <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isOffline ? "bg-amber-500" : "bg-ruru-teal")} />
              <span className="text-[9px] font-black uppercase tracking-widest text-ruru-navy">
                {isOffline ? 'OSM Offline Cache Active' : 'OSM Powered'}
              </span>
              {lastSynced && (
                <span className="text-[8px] font-bold text-slate-500 border-l border-ruru-navy/10 pl-2">
                  Synced: {lastSynced}
                </span>
              )}
            </div>

            {/* In-Map Category Filter Pills */}
            <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/25 shadow-xl flex items-center gap-1 overflow-x-auto scrollbar-none max-w-full pointer-events-auto">
              {[
                { id: 'all', label: 'All', color: '#2D2A26' },
                { id: 'vet', label: 'Vets', color: '#10B981' },
                { id: 'groomer', label: 'Groomers', color: '#3B82F6' },
                { id: 'pharmacy', label: 'Pharmacies', color: '#EC4899' },
                { id: 'shop', label: 'Shops', color: '#8B5CF6' },
                { id: 'boarding', label: 'Boarding', color: '#F59E0B' }
              ].map((f) => {
                const isActive = selectedFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      vibrateLight();
                      setSelectedFilter(f.id);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-widest transition-all duration-200 shrink-0",
                      isActive 
                        ? "bg-ruru-navy text-white shadow-sm scale-105"
                        : "text-ruru-navy/60 hover:text-ruru-navy hover:bg-black/5"
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {syncProgress !== null && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="bg-white/95 backdrop-blur-md p-3.5 rounded-[1.5rem] border border-white/25 shadow-xl flex flex-col gap-2 w-full max-w-[280px] pointer-events-auto transition-all"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#10B981] flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                      Syncing Tile Cache...
                    </span>
                    <span className="text-[10px] font-black text-ruru-navy">{syncProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-emerald-500 h-full rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${syncProgress}%` }}
                      transition={{ ease: "easeInOut", duration: 0.1 }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider text-right">
                    Tile {syncCurrent} / {syncTotal}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bento Legend Overlay */}
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-3 rounded-[1.5rem] border border-white/20 shadow-xl flex flex-col gap-2.5 max-w-[145px] text-left transition-all duration-300 hover:shadow-2xl">
            <div className="flex justify-between items-center gap-1 border-b border-ruru-navy/10 pb-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-ruru-navy/70">Map Legend</span>
              <span className="w-1.5 h-1.5 rounded-full bg-ruru-teal animate-pulse" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div 
                className="flex items-center gap-2 group cursor-pointer"
                onMouseEnter={() => setHoveredLegendType('vet')}
                onMouseLeave={() => setHoveredLegendType(null)}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-125" />
                <span className="text-[9.5px] font-bold text-ruru-navy/85 tracking-wide">Veterinary</span>
              </div>
              <div 
                className="flex items-center gap-2 group cursor-pointer"
                onMouseEnter={() => setHoveredLegendType('groomer')}
                onMouseLeave={() => setHoveredLegendType(null)}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-125" />
                <span className="text-[9.5px] font-bold text-ruru-navy/85 tracking-wide">Groomer</span>
              </div>
              <div 
                className="flex items-center gap-2 group cursor-pointer"
                onMouseEnter={() => setHoveredLegendType('pharmacy')}
                onMouseLeave={() => setHoveredLegendType(null)}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899] shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-125" />
                <span className="text-[9.5px] font-bold text-ruru-navy/85 tracking-wide">Pharmacy</span>
              </div>
              <div 
                className="flex items-center gap-2 group cursor-pointer"
                onMouseEnter={() => setHoveredLegendType('shop')}
                onMouseLeave={() => setHoveredLegendType(null)}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-125" />
                <span className="text-[9.5px] font-bold text-ruru-navy/85 tracking-wide">Pet Shop</span>
              </div>
              <div 
                className="flex items-center gap-2 group cursor-pointer"
                onMouseEnter={() => setHoveredLegendType('boarding')}
                onMouseLeave={() => setHoveredLegendType(null)}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-125" />
                <span className="text-[9.5px] font-bold text-ruru-navy/85 tracking-wide">Boarding</span>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {(selectedPlaceId || localSelectedPlace) && (() => {
            const currentItem = selectedPlaceId ? displayPlaces.find(p => p.id === selectedPlaceId) : localSelectedPlace;
            if (!currentItem) return null;

            const getTypeColorClass = (type?: string) => {
              switch (type?.toLowerCase()) {
                case 'vet': return 'bg-[#10B981]';
                case 'grooming': case 'groomer': return 'bg-[#3B82F6]';
                case 'boarding': return 'bg-[#F59E0B]';
                case 'shop': case 'pet_store': case 'pet store': return 'bg-[#8B5CF6]';
                case 'pharmacy': return 'bg-[#EC4899]';
                default: return 'bg-ruru-navy';
              }
            };
            const barBgColor = getTypeColorClass(currentItem.type);

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-sm mx-auto bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border border-white/20 pointer-events-auto"
                role="dialog"
                aria-label="Selected place details"
              >
                <div className={cn(
                  "w-full h-2 rounded-full mb-4 transition-colors duration-300",
                  barBgColor
                )} />
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-ruru-navy/60">
                        {currentItem.type}
                      </span>
                      {currentItem.isSubsidized && (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border border-ruru-teal-200">
                          <Zap size={8} className="fill-emerald-600" /> Subsidized
                        </span>
                      )}
                    </div>
                    <h4 className="font-brand text-2xl text-ruru-navy line-clamp-1 pr-8">
                      {currentItem.name}
                    </h4>
                  </div>
                  <button 
                    onClick={() => {
                      setLocalSelectedPlace(null);
                      onClosePopup?.();
                    }}
                    className="absolute top-6 right-6 p-3 bg-[#F5F5F0] rounded-[1.5rem] text-ruru-navy/60 hover:text-ruru-navy transition-all hover:rotate-90"
                    aria-label="Close details"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4 mb-8">
                  <p className="text-[11px] text-ruru-navy/60 flex items-center gap-2 font-medium">
                    <MapPin size={16} className="text-ruru-navy-light" /> 
                    <span className="truncate">{currentItem.address}</span>
                  </p>
                  <div className="flex items-center gap-4">
                    {currentItem.rating && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-[1.25rem] border border-amber-100">
                        <Star size={14} className="fill-amber-500 text-amber-500" />
                        <span className="text-xs font-black">{currentItem.rating}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-[1.25rem] border border-blue-100" aria-label="Rapid Access Service available">
                      <Navigation size={14} className="rotate-45" />
                      <span className="text-[10px] font-black uppercase">Rapid Access</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={getDirectionsUrl(currentItem.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 py-4 bg-[#F5F5F0] text-ruru-navy rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border border-ruru-navy/10 hover:bg-white/95 backdrop-blur-3xl transition-all shadow-sm"
                    aria-label={`Get directions in Google Maps to ${currentItem.name}`}
                  >
                    Directions
                  </motion.a>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (onBookInit) {
                        onBookInit(currentItem);
                      } else {
                        onPlaceSelect?.(currentItem);
                      }
                    }}
                    className="flex items-center justify-center gap-3 py-4 bg-ruru-navy text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#2D2A26]/20"
                    aria-label={onBookInit ? `Book service with ${currentItem.name}` : `Visit details for ${currentItem.name}`}
                  >
                    {onBookInit ? 'Book Service' : 'Visit Section'}
                  </motion.button>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
