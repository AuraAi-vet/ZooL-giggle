import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Map as MapIcon, 
  AlertTriangle, 
  Zap, 
  X, 
  PhoneCall, 
  ExternalLink,
  ChevronRight,
  Star,
  Search,
  Sparkles,
  Clock,
  Calendar
} from 'lucide-react';
import { Service, Pet, BlockedSlot, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { getCurrentLocation, findNearbyPlaces, getStaticMapUrl, type Place } from '../services/mapsService';
import { ServiceMap } from '../components/ServiceMap';

function determineOSMTypeFromQuery(query: string): 'all' | 'vet' | 'groomer' | 'pharmacy' | 'shop' | 'boarding' {
  const q = query.toLowerCase();
  if (q.includes('vet') || q.includes('clinic') || q.includes('hospital')) return 'vet';
  if (q.includes('groom') || q.includes('wash')) return 'groomer';
  if (q.includes('pharmacy') || q.includes('medicine') || q.includes('drug')) return 'pharmacy';
  if (q.includes('board') || q.includes('hotel') || q.includes('stay') || q.includes('sit')) return 'boarding';
  if (q.includes('shop') || q.includes('store') || q.includes('buy') || q.includes('food')) return 'shop';
  return 'all';
}

interface ServicesViewProps {
  services: Service[];
  onServiceClick: (service: Service) => void;
  pets: Pet[];
  blockedSlots: BlockedSlot[];
  vets: UserProfile[];
  onBook: (petId: string, serviceName: string, date: string, vetId?: string, reason?: string) => void;
  setActiveTab: (t: any) => void;
  initialSearchQuery?: string;
}

export function ServicesView({ 
  services, 
  onServiceClick, 
  pets, 
  blockedSlots,
  vets,
  onBook, 
  setActiveTab,
  initialSearchQuery
}: ServicesViewProps) {
  const { 
    cachedLocation, setCachedLocation,
    nearbyPlaces, setNearbyPlaces,
    cachedAIServices, setCachedAIServices,
    cachedAIAdvice, setCachedAIAdvice
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showMap, setShowMap] = useState(true);
  const [currentLoc, setCurrentLoc] = useState<{lat: number, lng: number} | null>(cachedLocation);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [selectedVetId, setSelectedVetId] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  
  // AI Search State
  const [isAISearching, setIsAISearching] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [highlightedServiceId, setHighlightedServiceId] = useState<string | null>(null);

  const serviceRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

  const initialLoadPerformed = React.useRef(false);

  const scrollToService = (serviceName: string) => {
    const el = serviceRefs.current.get(serviceName);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedServiceId(serviceName);
    }
  };

  const aiSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const loadLocationAndNearby = async (force: boolean = false) => {
    if (!force && initialLoadPerformed.current) return;
    
    // Set guard immediately to prevent concurrent calls in React 18 Strict Mode
    if (!force) initialLoadPerformed.current = true;

    if (!force && cachedAIServices.length > 0 && cachedLocation) {
      return;
    }

    setIsAISearching(true);
    setLocationError(null);
    try {
      const loc = await getCurrentLocation();
      setCurrentLoc(loc);
      setCachedLocation(loc);
      
      if (loc.isFallback) {
        setLocationError("Couldn't detect your exact location. We're showing services based on the Trivandrum area.");
      }
      
      const query = initialSearchQuery || "veterinary clinics, groomers, and pet shops near me";
      setSearchQuery(query);
      
      // SEARCH FIRST: Fetch standard nearby places
      const places = await findNearbyPlaces(loc, 'all');
      setNearbyPlaces(places);
      
      // Removed Gemini API location search to reduce reliance and use OSM purely.
      
    } catch (error: any) {
      console.error('Failed to load location/places:', error);
      setLocationError("Could not access your location. Using default area.");
      if (error?.message?.includes("limit") || error?.message?.includes("Optimization") || error?.message?.includes("cap")) {
        toast.error("Cost Optimization: Limit reached. Standard mode engaged.");
      }
    } finally {
      setIsAISearching(false);
    }
  };

  useEffect(() => {
    loadLocationAndNearby();
  }, []);

  const handleSmartSearch = async () => {
    if (!searchQuery.trim() || !currentLoc) return;
    
    // Debounce
    if (aiSearchTimeout.current) clearTimeout(aiSearchTimeout.current);
    
    aiSearchTimeout.current = setTimeout(async () => {
        setIsAISearching(true);
        
        try {
          // SEARCH FIRST: 
          const type = determineOSMTypeFromQuery(searchQuery);
          const places = await findNearbyPlaces(currentLoc, type);
          setNearbyPlaces(places);
        } catch (error: any) {
          console.error('Smart search failed:', error);
          if (error?.message?.includes("limit") || error?.message?.includes("Optimization") || error?.message?.includes("cap")) {
             toast.error("Cost Optimization: Limit reached. Standard mode engaged.");
          }
        } finally {
          setIsAISearching(false);
        }
    }, 500); // Debounce for 500ms
  };


  const [priceFilter, setPriceFilter] = useState<'All' | 'Budget' | 'Standard' | 'Premium'>('All');
  const [showSubsidizedOnly, setShowSubsidizedOnly] = useState(false);
  const [selectedPetForFilter, setSelectedPetForFilter] = useState<string>('All');

  const categories = ['All', 'Govt/Public', 'Vet', 'Groomer', 'Boarding', 'Shops', 'Trainers', 'Breeders'];

  const filteredServices = React.useMemo(() => {
    // Combine incoming services with live nearbyPlaces from Maps
    const placesAsServices: Service[] = nearbyPlaces.map((pl, idx) => ({
      id: pl.id || `place-${idx}`,
      name: pl.name,
      type: pl.type === 'pharmacy' ? 'shop' : pl.type as any,
      rating: pl.rating || 4.5,
      address: pl.address,
      phone: (pl as any).phone || 'Not available',
      distance: 'Nearby',
      image: `https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&auto=format&fit=crop&q=60`,
      isSubsidized: false
    }));

    const allServicesMap = new Map();
    services.forEach(s => allServicesMap.set(s.name.toLowerCase(), s));
    placesAsServices.forEach(s => {
      if (!allServicesMap.has(s.name.toLowerCase())) {
        allServicesMap.set(s.name.toLowerCase(), s);
      }
    });
    
    const allServices = Array.from(allServicesMap.values());
    const selectedPet = pets.find(p => p.id === selectedPetForFilter);

    return allServices.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || s.type.toLowerCase() === activeCategory.toLowerCase();
      const matchesPrice = priceFilter === 'All' || s.pricePoint?.toLowerCase() === priceFilter.toLowerCase();
      const matchesSubsidized = !showSubsidizedOnly || s.isSubsidized;
      
      let matchesPet = true;
      if (selectedPet) {
        const isCat = selectedPet.type.toLowerCase() === 'cat';
        const isDog = selectedPet.type.toLowerCase() === 'dog';
        const sName = s.name.toLowerCase();
        const sDesc = ((s as any).description || '').toLowerCase();
        
        if (isDog && (sName.includes('feline') || sName.includes('cat only') || sDesc.includes('cats only'))) matchesPet = false;
        if (isCat && (sName.includes('canine') || sName.includes('dog only') || sDesc.includes('dogs only'))) matchesPet = false;
      }
      
      return matchesSearch && matchesCategory && matchesPrice && matchesSubsidized && matchesPet;
    }).sort((a, b) => {
      if (selectedPet) {
          const sNameA = a.name.toLowerCase();
          const sNameB = b.name.toLowerCase();
          const sDescA = ((a as any).description || '').toLowerCase();
          const sDescB = ((b as any).description || '').toLowerCase();
          
          const pType = selectedPet.type.toLowerCase();
          const pBreed = selectedPet.breed?.toLowerCase() || '';

          let scoreA = 0; let scoreB = 0;
          if (sNameA.includes(pType) || sDescA.includes(pType)) scoreA++;
          if (pBreed && (sNameA.includes(pBreed) || sDescA.includes(pBreed))) scoreA += 3;
          if (a.type === 'groomer' && pBreed.includes('long') && sDescA.includes('long')) scoreA += 2;

          if (sNameB.includes(pType) || sDescB.includes(pType)) scoreB++;
          if (pBreed && (sNameB.includes(pBreed) || sDescB.includes(pBreed))) scoreB += 3;
          if (b.type === 'groomer' && pBreed.includes('long') && sDescB.includes('long')) scoreB += 2;
          
          if (scoreA !== scoreB) return scoreB - scoreA;
      }
      return (b.rating || 0) - (a.rating || 0); // fallback to rating sort
    });
  }, [services, nearbyPlaces, searchQuery, activeCategory, priceFilter, showSubsidizedOnly, selectedPetForFilter, pets]);

  const displayServices = React.useMemo(() => {
    return filteredServices.filter(s => {
      const matchesPrice = priceFilter === 'All' || (s as any).pricePoint?.toLowerCase() === priceFilter.toLowerCase();
      const matchesSubsidized = !showSubsidizedOnly || (s as any).isSubsidized;
      return matchesPrice && matchesSubsidized;
    });
  }, [filteredServices, priceFilter, showSubsidizedOnly]);

  const selectedService = displayServices.find(s => s.name === highlightedServiceId);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleBookingPayment = async () => {
    if (!bookingService || !selectedPetId || !bookingDate) return;
    
    setIsProcessingPayment(true);
    try {
      // Direct instant booking for trial launch phase (payments paused)
      await onBook(selectedPetId, bookingService.name, bookingDate, selectedVetId, bookingReason);
      setBookingService(null);
      toast.success(`Booking configured! ${bookingService.name} has been successfully scheduled under ZooL's complimentary trial launch.`);
    } catch (error: any) {
      console.error('Trial Register error:', error);
      toast.error(error.message || 'Trial appointment failed to register.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-6 py-8 pb-32 space-y-12 max-w-5xl mx-auto"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shadow-sm shadow-emerald-500/5">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-emerald-500 rounded-full" 
              />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-800">Ecosystem: Online</p>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Node Cluster v4.2</p>
          </div>
          <h2 className="text-5xl font-brand text-slate-900 tracking-tighter leading-none italic">Services</h2>
          <p className="text-slate-400 text-lg font-medium leading-tight italic">Tactical discovery of verified clinical care assets.</p>
        </div>
        <div className="flex gap-4">
          <motion.button 
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadLocationAndNearby(true)}
            disabled={isAISearching}
            className={cn(
              "h-16 px-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm text-slate-900 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-4 group",
              isAISearching && "opacity-50 cursor-not-allowed"
            )}
          >
            <MapPin size={24} className={cn("group-hover:text-emerald-400 transition-colors", isAISearching && "animate-bounce")} />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">{isAISearching ? "Syncing..." : "Calibrate"}</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMap(!showMap)}
            className={cn(
              "w-16 h-16 rounded-[2rem] border transition-all flex items-center justify-center shadow-sm group",
              showMap ? "bg-slate-900 border-slate-900 text-emerald-400" : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
            )}
          >
            <MapIcon size={28} />
          </motion.button>
        </div>
      </header>

      {locationError && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-amber-50 border border-amber-200 p-8 rounded-[2.5rem] flex items-center gap-6 text-amber-900 shadow-sm mx-2"
        >
          <AlertTriangle size={36} className="shrink-0" />
          <p className="text-base font-medium italic leading-relaxed">{locationError}</p>
        </motion.div>
      )}

      <AnimatePresence>
        {showMap && currentLoc && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="w-full h-auto md:h-[700px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-ruru-navy/10 bg-white/95 backdrop-blur-3xl mb-12"
            >
              <ServiceMap 
                center={currentLoc} 
                selectedPlaceId={highlightedServiceId || undefined}
                onClosePopup={() => setHighlightedServiceId(null)}
                places={nearbyPlaces.length > 0 ? nearbyPlaces : filteredServices.map(s => ({
                  id: s.name,
                  name: s.name,
                  address: s.address,
                  type: s.type as any,
                  location: currentLoc, 
                  rating: s.rating
                }))} 
                isLoading={isAISearching}
                onMarkerClick={(id) => {
                  setHighlightedServiceId(id);
                  scrollToService(id);
                }}
                onPlaceSelect={(place) => {
                  scrollToService(place.name);
                }}
                onBookInit={(place) => {
                  setBookingService({
                    id: place.id,
                    name: place.name,
                    type: place.type as any,
                    rating: place.rating || 0,
                    distance: 'Nearby',
                    address: place.address,
                    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop',
                    phone: '+1 555-0000',
                  });
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 pb-24 md:pb-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHighlightedServiceId(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-3xl border border-slate-200 rounded-[2.5rem] w-full max-w-4xl max-h-full overflow-y-auto shadow-2xl relative z-10 no-scrollbar"
            >
              <div className="p-8 md:p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-ruru-teal/5 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row gap-10 relative z-10">
                  <div className="w-full md:w-48 h-48 md:h-auto rounded-[2.5rem] overflow-hidden shadow-xl shrink-0 border border-slate-100">
                    <img 
                      src={(selectedService as Service).image || `https://picsum.photos/seed/${selectedService.name}/400/400`} 
                      alt={selectedService.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-ruru-teal text-white rounded-full text-[9px] font-black uppercase tracking-widest leading-none">Active Selection</span>
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">{selectedService.type}</span>
                        </div>
                        <h3 className="text-3xl md:text-3xl font-brand text-slate-900 tracking-tight pr-12">{selectedService.name}</h3>
                      </div>
                      <div className="hidden md:flex gap-4 items-start">
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setBookingService(selectedService as Service)}
                          className="px-8 py-5 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all italic"
                        >
                          Book Appointment
                        </motion.button>
                      </div>
                      
                      <button 
                        onClick={() => setHighlightedServiceId(null)}
                        className="absolute top-8 right-8 p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all z-20"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                          <MapPin size={12} className="text-slate-300" /> Geographic
                        </p>
                        <p className="text-sm font-medium text-slate-600 line-clamp-2 pr-4">{selectedService.address}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                          <Star size={12} className="text-slate-300" /> Trust Score
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                            <Star size={12} className="fill-amber-500 text-amber-500" />
                            <span className="text-sm font-black">{selectedService.rating || '4.8'}</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            {(selectedService as any).userRatingsTotal ? `${(selectedService as any).userRatingsTotal} reviews` : 'verified'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                          <PhoneCall size={12} className="text-slate-300" /> Direct Contact
                        </p>
                        <p className="text-sm font-black text-slate-900">{(selectedService as any).phone || '+(91) 484-255-6677'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                          <Clock size={12} className="text-slate-300" /> Operating Hours
                        </p>
                        <p className="text-sm font-medium text-slate-600">
                          {selectedService.type === 'vet' && (selectedService as any).isEmergency ? (
                            <span className="text-amber-600 font-bold">24/7 Emergency Services</span>
                          ) : (
                            <span>Today: 9:00 AM - 7:00 PM <span className="text-emerald-500 ml-1 font-bold">(Open)</span></span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex flex-col gap-6">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                          <Calendar size={12} className="text-slate-300" /> Next Available Slots
                        </p>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                          {['Today, 2:30 PM', 'Today, 4:00 PM', 'Tomorrow, 9:30 AM', 'Tomorrow, 11:00 AM'].map((slot, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setBookingDate(slot.split(',')[0] === 'Today' ? new Date().toISOString().split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0]);
                                setBookingService(selectedService as Service);
                              }}
                              className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-[1rem] text-xs font-bold text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shrink-0 whitespace-nowrap"
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Additional Info: AI Description & Reviews */}
                      {((selectedService as any).description || ((selectedService as any).reviews && (selectedService as any).reviews.length > 0)) && (
                        <div className="space-y-6 pt-4">
                          {(selectedService as any).description && (
                            <div className="space-y-2 bg-ruru-teal/5 p-6 rounded-[1.5rem] border border-ruru-teal/10">
                              <p className="text-[10px] font-black text-ruru-teal-700 uppercase tracking-widest flex items-center gap-2 italic">
                                <Sparkles size={12} className="text-ruru-teal" /> AI Insights
                              </p>
                              <p className="text-sm text-slate-600 leading-relaxed italic">
                                "{(selectedService as any).description}"
                              </p>
                            </div>
                          )}
                          
                          {((selectedService as any).reviews && (selectedService as any).reviews.length > 0) && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(selectedService as any).reviews.slice(0, 2).map((review: any, i: number) => (
                                  <div key={i} className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-900">{review.author}</span>
                                      <div className="flex items-center gap-1">
                                        <Star size={10} className="fill-amber-500 text-amber-500" />
                                        <span className="text-[10px] font-black text-amber-600">{review.rating}</span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-500 italic">"{review.text}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="md:hidden pt-4 border-t border-slate-100 flex gap-4">
                        <motion.button 
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setBookingService(selectedService as Service)}
                          className="w-full px-8 py-5 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all italic text-center"
                        >
                          Book Appointment
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search & Intelligence Surface - Redesigned */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl -mx-6 px-6 py-6 border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-9 relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-slate-900 transition-colors">
                <Search size={22} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSmartSearch();
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSmartSearch()}
                placeholder="Search care assets (symptoms, specialties, providers)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] pl-16 pr-6 py-6 text-base font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all outline-none italic"
              />
            </div>
            <div className="md:col-span-3">
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSmartSearch}
                className="w-full h-full bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-center gap-4 shadow-3xl shadow-slate-900/20 transition-all text-[11px] font-black uppercase tracking-[0.3em] group italic"
              >
                <Search size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                Find Nearby
              </motion.button>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 w-full xl:w-auto shrink-0 overflow-x-auto no-scrollbar pb-1 px-1">
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-full border border-slate-200 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">For Pet:</span>
                <select 
                  value={selectedPetForFilter}
                  onChange={(e) => setSelectedPetForFilter(e.target.value)}
                  className="bg-transparent text-slate-900 text-[11px] font-black uppercase tracking-widest outline-none pr-4 italic cursor-pointer"
                >
                  <option value="All">All Pets</option>
                  {pets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {categories.map(cat => (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-6 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border italic",
                    activeCategory === cat 
                      ? "bg-slate-900 border-slate-900 text-white shadow-xl" 
                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-900 hover:text-slate-900"
                  )}
                >
                  {cat}
                </motion.button>
              ))}
            </div>

            <div className="flex gap-4 items-center w-full xl:w-auto shrink-0 justify-end">
              <div className="flex bg-slate-100 p-1.5 rounded-full border border-slate-200">
                {(['All', 'Budget', 'Premium'] as const).map(p => (
                  <button 
                    key={p}
                    onClick={() => setPriceFilter(p as any)}
                    className={cn(
                      "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all italic", 
                      priceFilter === p ? "bg-white text-slate-900 shadow-lg border border-slate-200/50" : "text-slate-400"
                    )}
                  >{p}</button>
                ))}
              </div>
              
              <button 
                onClick={() => setShowSubsidizedOnly(!showSubsidizedOnly)}
                className={cn(
                  "px-6 py-4 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-3 italic",
                  showSubsidizedOnly 
                    ? "bg-emerald-500 border-emerald-600 text-white shadow-xl shadow-emerald-500/20" 
                    : "bg-white border-slate-200 text-emerald-600 hover:border-emerald-500"
                )}
              >
                <Zap size={16} className={cn(showSubsidizedOnly && "fill-white")} />
                Subsidized
              </button>

              <div className="flex bg-slate-100 p-1.5 rounded-full border border-slate-200">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn("px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'grid' ? "bg-white text-slate-900 shadow-md border border-slate-200/50" : "text-slate-400")}
                >Grid</button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn("px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'list' ? "bg-white text-slate-900 shadow-md border border-slate-200/50" : "text-slate-400")}
                >List</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAISearching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-white/95 backdrop-blur-3xl rounded-[2.5rem] border border-ruru-navy/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">


          <div className={cn(
            "grid gap-10 transition-all duration-700 mx-2",
            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          )}>
            {activeCategory === 'Vet' && vets.map(vet => (
                <motion.div 
                    key={vet.uid}
                    className="bg-white border border-slate-200 rounded-[3.5rem] p-8 flex items-center gap-6"
                >
                    <div className="w-20 h-20 rounded-[2rem] overflow-hidden">
                        <img src={vet.image} alt={vet.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-brand text-xl text-slate-900">{vet.name}</h4>
                        <p className="text-slate-400 text-sm">{vet.location}</p>
                    </div>
                </motion.div>
            ))}
            {displayServices.length > 0 ? displayServices.map((service, idx) => (
              <motion.div 
                key={(service as Service).id || `service-${service.name}-${idx}`}
                id={`service-${service.name}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: idx * 0.05 }}
                ref={(el) => {
                  if (el) serviceRefs.current.set(service.name, el);
                }}
                className={cn(
                  "bg-white border rounded-[3.5rem] overflow-hidden transition-all duration-700 group flex relative cursor-pointer",
                  highlightedServiceId === service.name 
                    ? "border-emerald-500 shadow-3xl shadow-emerald-500/10 ring-1 ring-emerald-500/20 bg-emerald-50/5" 
                    : "border-slate-200 hover:shadow-3xl hover:border-slate-400 hover:shadow-slate-900/10",
                  viewMode === 'grid' ? "flex-col h-full" : "flex-col sm:flex-row items-center p-8 gap-8 md:gap-10"
                )}
                onClick={() => {
                  if (currentLoc) {
                    setHighlightedServiceId(service.name);
                    const el = serviceRefs.current.get(service.name);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    if (!showMap) setShowMap(true);
                  }
                }}
              >
                <div className={cn(
                  "relative overflow-hidden shrink-0",
                  viewMode === 'grid' ? "h-64 w-full" : "w-full sm:w-40 h-56 sm:h-40 rounded-[2.5rem]"
                )}>
                  <img 
                    src={(service as Service).image || `https://picsum.photos/seed/${service.name}/800/600`} 
                    alt={service.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  />
                  {viewMode === 'grid' && (
                    <div className="absolute top-6 right-6 flex gap-3">
                      {service.rating && (
                        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-white/50">
                          <Star size={16} className="text-amber-500 fill-amber-500" />
                          <span className="text-[12px] font-black text-slate-900">{service.rating}</span>
                          {(service as any).userRatingsTotal && (
                            <span className="text-[10px] font-black text-slate-400 ml-1 mt-0.5">({(service as any).userRatingsTotal} Verification)</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className={cn(
                  "flex-1 flex",
                  viewMode === 'grid' ? "p-10 flex-col justify-between space-y-8" : "flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
                )}>
                  <div className="space-y-5 flex-1 w-full">
                    <div className="flex justify-between items-start w-full">
                      <div className="space-y-2 w-full">
                        <h3 className="text-2xl md:text-3xl font-brand text-slate-900 tracking-tighter group-hover:text-slate-900 transition-colors line-clamp-2 italic">{service.name}</h3>
                        <div className="flex flex-wrap items-center gap-3">
                          {service.rating && viewMode === 'list' && (
                            <span className="px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-amber-100 italic">
                              <Star size={14} className="fill-amber-500 text-amber-500" /> {service.rating}
                              {(service as any).userRatingsTotal ? ` (+${(service as any).userRatingsTotal})` : ''}
                            </span>
                          )}
                          <span className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 italic">{service.type}</span>
                          {(service as any).isSubsidized && (
                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2 italic">
                              <Zap size={14} className="fill-emerald-500" /> Subsidized Node
                            </span>
                          )}
                          {selectedPetForFilter !== 'All' && (() => {
                            const p = pets.find(pet => pet.id === selectedPetForFilter);
                            if (!p) return null;
                            const sName = service.name.toLowerCase();
                            const sDesc = ((service as any).description || '').toLowerCase();
                            const pType = p.type.toLowerCase();
                            const pBreed = p.breed?.toLowerCase() || '';
                            const isMatch = sName.includes(pType) || sDesc.includes(pType) || (pBreed && (sName.includes(pBreed) || sDesc.includes(pBreed)));
                            if (isMatch) {
                              return (
                                <span className="px-4 py-1.5 bg-ruru-teal/10 text-ruru-teal-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-ruru-teal/20 flex items-center gap-2 italic">
                                  <Sparkles size={14} className="text-ruru-teal" /> Exact Match for {p.name}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <p className="text-[11px] md:text-[12px] font-medium text-slate-400 flex items-center gap-2.5 min-w-0 pt-2 italic">
                          <MapPin size={16} className="text-slate-300 shrink-0" /> <span className="truncate">{service.address}</span>
                          {service.distance && (
                            <>
                              <span className="w-1 h-1 bg-slate-200 rounded-full shrink-0" />
                              <span className="text-emerald-600 font-black shrink-0 tracking-widest">{service.distance}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "flex gap-4 w-full sm:w-auto shrink-0",
                    viewMode === 'list' ? "sm:ml-10" : ""
                  )}>
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHighlightedServiceId(service.name);
                        setShowMap(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-8 py-5 bg-white border border-slate-200 text-slate-900 rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm italic"
                    >
                      Locate
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setBookingService(service as Service)}
                      className="flex-1 sm:flex-none px-10 py-5 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:shadow-3xl hover:shadow-slate-900/20 transition-all shadow-xl italic"
                    >
                      Initialize Booking
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full text-center py-32 space-y-10 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 mx-2 group">
                <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200 shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
                  <Search size={48} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-brand text-slate-900 tracking-tighter italic">Discovery Null</h3>
                  <p className="text-lg text-slate-400 px-12 italic font-medium leading-relaxed">System failed to locate verified care assets matching current parameters.</p>
                </div>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                  className="px-10 py-4 bg-white border border-slate-200 rounded-full text-[11px] font-black uppercase tracking-widest text-slate-900 hover:shadow-2xl hover:border-slate-900 transition-all italic shadow-sm"
                >
                  Clear Node Parameters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal Redesigned */}
      <AnimatePresence>
        {bookingService && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingService(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white w-full max-w-xl rounded-[4rem] p-12 relative z-10 shadow-3xl space-y-10 border border-slate-100 overflow-y-auto max-h-[90vh] no-scrollbar"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[6rem] -z-10 blur-3xl opacity-50" />
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Configuration: Initializing</p>
                  </div>
                  <h2 className="text-4xl font-brand text-slate-900 tracking-tighter italic leading-none">Session Portal</h2>
                </div>
                <button onClick={() => setBookingService(null)} className="w-14 h-14 bg-slate-50 rounded-[2rem] text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center border border-slate-100 shadow-sm active:scale-90">
                  <X size={28} />
                </button>
              </div>

              <div className="space-y-10">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-2 group hover:border-slate-300 transition-all shadow-inner">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-3">Clinical Asset Target</label>
                  <p className="text-2xl font-brand text-slate-900 italic tracking-tight">{bookingService.name}</p>
                  <p className="text-sm font-medium text-slate-400 italic opacity-80">{bookingService.address}</p>
                </div>

                <div className="space-y-6">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic px-2">Associate Subject Profile</label>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1 snap-x snap-mandatory scroll-smooth">
                    {pets.map(pet => (
                      <motion.button
                        key={pet.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedPetId(pet.id)}
                        className={cn(
                          "flex items-center gap-4 px-8 py-4 rounded-full transition-all duration-500 border-2 shrink-0 group snap-center touch-manipulation",
                          selectedPetId === pet.id 
                            ? "bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/20" 
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-900"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
                          <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest leading-none italic">{pet.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic px-2">ZooL Certified Practitioners</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vets.map(vet => (
                      <button
                        key={vet.uid}
                        onClick={() => setSelectedVetId(vet.uid)}
                        className={cn(
                          "flex items-center gap-4 p-5 rounded-[2.5rem] border-2 transition-all group",
                          selectedVetId === vet.uid 
                            ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10" 
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-900"
                        )}
                      >
                        <div className="w-12 h-12 rounded-[1.5rem] overflow-hidden border-2 border-white shadow-sm shrink-0">
                          <img src={vet.image} alt={vet.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-left space-y-1">
                          <p className="text-[11px] font-black uppercase tracking-tight italic">{vet.name}</p>
                          <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-60", selectedVetId === vet.uid ? "text-emerald-400" : "text-slate-400")}>Surgeon Node</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic px-2">Temporal Allocation</label>
                  <div className="relative space-y-3">
                    <input 
                      type="datetime-local" 
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className={cn(
                        "w-full bg-slate-50 border-2 rounded-[2rem] px-8 py-6 focus:outline-none focus:bg-white text-base font-black uppercase tracking-widest transition-all italic",
                        bookingDate && blockedSlots.some(s => {
                          const [d, t] = bookingDate.split('T');
                          return s.date === d && s.time === t;
                        }) ? "border-amber-500 text-amber-700 bg-amber-50/50" : "border-slate-200 focus:border-slate-900"
                      )}
                    />
                    <AnimatePresence>
                      {bookingDate && blockedSlots.some(s => {
                        const [d, t] = bookingDate.split('T');
                        return s.date === d && s.time === t;
                      }) && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-4 flex items-center gap-2 italic"
                        >
                          <AlertTriangle size={14} /> This slot is restricted by the practitioner.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic px-2">Reason for Clinical Visit</label>
                  <textarea 
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    placeholder="Describe clinical intent or symptomatic observation..."
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] px-8 py-6 focus:outline-none focus:bg-white focus:border-slate-900 text-sm font-medium transition-all min-h-[140px] resize-none italic leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-8 w-full font-brand text-slate-800">
                <div className="bg-emerald-50 border border-emerald-200/65 rounded-[1.5rem] p-5 text-center flex items-center gap-3 justify-center">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <div className="text-left">
                    <h5 className="text-xs font-black uppercase tracking-wider text-emerald-900 italic">🎁 ZooL Trial Mode Active</h5>
                    <p className="text-[10px] text-emerald-700 font-medium leading-normal mt-0.5">Payments are paused for the launch phase. Enjoy free premium appointments.</p>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBookingPayment}
                  disabled={isProcessingPayment || !selectedPetId || !bookingDate || !selectedVetId || !bookingReason.trim() || blockedSlots.some(s => {
                    const [d, t] = bookingDate.split('T');
                    return s.date === d && s.time === t;
                  })}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-3xl shadow-slate-900/15 disabled:opacity-50 transition-all flex items-center justify-center gap-4 italic group"
                >
                  {isProcessingPayment ? (
                    <>
                      <Sparkles size={20} className="animate-spin text-emerald-400" />
                      Scheduling Trial booking...
                    </>
                  ) : (
                    <>
                      Confirm Free Trial Booking <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
