/**
 * OpenStreetMap Service for ZooL Vet & Co
 * Handles location-based services using OSM Overpass API.
 */

export interface Location {
  lat: number;
  lng: number;
  isFallback?: boolean;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  rating?: number;
  distance?: string;
  type: 'vet' | 'groomer' | 'pharmacy' | 'shop' | 'boarding';
  location: Location;
  isSubsidized?: boolean;
  pricePoint?: 'budget' | 'standard' | 'premium';
}

export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 8.5241, lng: 76.9366, isFallback: true });
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            isFallback: false
          });
        },
        (error) => {
          console.warn("Geolocation error:", error.message, "Code:", error.code);
          // Default to Trivandrum center if permission denied or timeout
          resolve({ lat: 8.5241, lng: 76.9366, isFallback: true });
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    }
  });
};

const placesApiCache = new Map<string, { timestamp: number, data: Place[] }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const findNearbyPlaces = async (location: Location, type: string): Promise<Place[]> => {
  const cacheKey = `${location.lat.toFixed(3)},${location.lng.toFixed(3)}-${type}`;
  const now = Date.now();
  const cached = placesApiCache.get(cacheKey);
  
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    // Determine OSM tags based on requested type
    let tags = "";
    if (type === "all" || type === "vet") {
      tags += `node["amenity"="veterinary"](around:5000,${location.lat},${location.lng});`;
    }
    if (type === "all" || type === "shop" || type === "groomer") {
      tags += `node["shop"="pet"](around:5000,${location.lat},${location.lng});`;
      tags += `node["shop"="pet_grooming"](around:5000,${location.lat},${location.lng});`;
    }
    if (type === "all" || type === "pharmacy") {
      tags += `node["amenity"="pharmacy"](around:5000,${location.lat},${location.lng});`;
      tags += `node["healthcare"="pharmacy"](around:5000,${location.lat},${location.lng});`;
    }
    if (type === "all" || type === "boarding") {
      tags += `node["amenity"="animal_boarding"](around:5000,${location.lat},${location.lng});`;
    }

    const query = `[out:json][timeout:15];(${tags});out body 15;`;
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query
    });

    if (!response.ok) throw new Error(`Overpass API error: ${response.status}`);
    
    const data = await response.json();
    const elements: any[] = data.elements || [];

    const places: Place[] = elements.map(el => {
      let placeType: Place['type'] = 'shop';
      let defaultName = 'Pet Service';
      
      if (el.tags.amenity === "veterinary") {
        placeType = 'vet';
        defaultName = 'Veterinary Clinic';
      } else if (el.tags.shop === "pet_grooming") {
        placeType = 'groomer';
        defaultName = 'Pet Groomer';
      } else if (el.tags.amenity === "pharmacy" || el.tags.healthcare === "pharmacy") {
        placeType = 'pharmacy';
        defaultName = 'Pharmacy';
      } else if (el.tags.amenity === "animal_boarding") {
        placeType = 'boarding';
        defaultName = 'Pet Boarding';
      } else if (el.tags.shop === "pet") {
        placeType = 'shop';
        defaultName = 'Pet Shop';
      }

      return {
        id: el.id.toString(),
        name: el.tags.name || defaultName,
        address: [el.tags['addr:street'], el.tags['addr:city']].filter(Boolean).join(', ') || 'Address not provided',
        type: placeType,
        location: { lat: el.lat, lng: el.lon },
        isSubsidized: el.tags.name?.toLowerCase().includes('government') || el.tags.name?.toLowerCase().includes('charity'),
        distance: 'Nearby' // We could calculate haversine here
      };
    });

    if (places.length > 0) {
      placesApiCache.set(cacheKey, { timestamp: Date.now(), data: places });
      return places;
    } else {
      return [];
    }
  } catch (error) {
    console.warn("OSM API error or no results:", error);
    return [];
  }
};

export const getDirectionsUrl = (location: Location) => {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=current%3B${location.lat}%2C${location.lng}`;
};

export const getStaticMapUrl = (location: Location, markers?: Location[]) => {
  const markerOverlay = markers?.map(m => `markers=${m.lat},${m.lng}`).join('&') || '';
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${location.lat},${location.lng}&zoom=14&size=600x300&maptype=mapnik&${markerOverlay}`;
};
