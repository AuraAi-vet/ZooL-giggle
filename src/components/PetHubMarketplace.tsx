import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, MapPin, Sparkles, Utensils, Heart, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface RecommendationItem {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  price?: string;
  action: string;
  icon: any;
  color: string;
}

const RECOMMENDATIONS: RecommendationItem[] = [
  {
    id: '1',
    title: 'The Healthy Pet Shop',
    category: 'Nearest Shop',
    description: 'Premium organic treats and holistic supplies. 0.8 km away.',
    image: 'https://images.unsplash.com/photo-1594498259353-6052be5471ac?w=800&auto=format&fit=crop',
    action: 'Get Directions',
    icon: MapPin,
    color: 'bg-ruru-teal'
  },
  {
    id: '2',
    title: 'Active Adventure Harness',
    category: 'Accessories',
    description: 'Orthopedic design for high-energy walks and safety.',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&auto=format&fit=crop',
    price: '$45.00',
    action: 'Shop Accessories',
    icon: ShoppingBag,
    color: 'bg-blue-500'
  },
  {
    id: '3',
    title: 'Pure Grain-Free Salmon',
    category: 'Foods',
    description: 'High-protein diet customized for your breed\'s metabolism.',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop',
    price: '$68.00',
    action: 'Order Food',
    icon: Utensils,
    color: 'bg-orange-500'
  },
  {
    id: '4',
    title: 'Post-Travel Relaxation',
    category: 'Care Recommendation',
    description: 'Expert-led session to reduce anxiety after travel.',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&auto=format&fit=crop',
    action: 'Book Care',
    icon: Heart,
    color: 'bg-purple-500'
  }
];

export function PetHubMarketplace() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-ruru-navy rounded-full" />
          <h4 className="text-[10px] font-black text-[#A8A29E] uppercase tracking-[0.3em]">Curated Essentials</h4>
        </div>
        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Sponsored</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {RECOMMENDATIONS.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -4 }}
            className="group relative bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
          >
            {/* Image Section */}
            <div className="h-32 relative overflow-hidden">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
              <div className="absolute top-4 left-4">
                <div className={cn("w-8 h-8 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg", item.color)}>
                  <item.icon size={16} />
                </div>
              </div>
              {item.price && (
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-ruru-navy">
                  {item.price}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-5 space-y-2">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest text-ruru-navy/60 mb-1">{item.category}</span>
                <h5 className="text-sm font-bold text-ruru-navy leading-tight line-clamp-1 group-hover:text-emerald-600 transition-colors">{item.title}</h5>
              </div>
              <p className="text-[10px] text-[#A8A29E] leading-relaxed line-clamp-2">
                {item.description}
              </p>
              <button className="w-full mt-2 py-3 bg-[#FDFBF7] rounded-[1.25rem] text-[9px] font-black uppercase tracking-widest text-ruru-navy-light group-hover:bg-ruru-navy group-hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                {item.action}
                <ChevronRight size={10} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
