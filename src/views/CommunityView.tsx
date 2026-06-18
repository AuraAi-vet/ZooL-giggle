import React from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  MessageSquare, 
  Plus, 
  Share2, 
  TrendingUp, 
  Users,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock
} from 'lucide-react';
import { CommunityPost } from '../types';
import { cn } from '../lib/utils';

interface CommunityViewProps {
  posts: CommunityPost[];
  onLikePost: (postId: string) => void;
  onCommentPost: (postId: string) => void;
  onCreatePost: () => void;
  onSharePost?: (post: CommunityPost) => void;
  sort?: 'recent' | 'popular' | 'urgent';
  onSortChange?: (sort: 'recent' | 'popular' | 'urgent') => void;
}

export function CommunityView({ 
  posts, 
  onLikePost, 
  onCommentPost, 
  onCreatePost,
  onSharePost,
  sort = 'recent',
  onSortChange
}: CommunityViewProps) {
  const filteredPosts = React.useMemo(() => {
    if (sort === 'urgent') return [...posts].filter(p => p.isUrgent);
    if (sort === 'popular') return [...posts].sort((a, b) => b.likes - a.likes);
    return [...posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posts, sort]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-6 py-10 pb-32 space-y-12 max-w-5xl mx-auto"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center gap-2 bg-soft-blue/30 px-3 py-1 rounded-full border border-soft-blue/50">
              <Users size={12} className="text-soft-ink" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-soft-ink">Community Hub Active</p>
            </div>
            <div className="h-3 w-px bg-soft-blue/30" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-soft-ink/30">Network Pulse v2.0</p>
          </div>
          <h2 className="text-5xl font-display font-semibold text-soft-ink tracking-tight mb-2">Pet Community</h2>
          <p className="text-soft-ink/50 text-lg font-medium leading-relaxed max-w-lg">Join a diverse ecosystem of pet owners, veterinarians, and local care providers.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreatePost}
          className="w-12 h-12 bg-soft-ink text-white rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-soft-ink/20 transition-all group"
        >
          <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
        </motion.button>
      </header>

      {/* Sorting & Topics Bento */}
      <div className="space-y-6 px-2">
        <div className="flex bg-white p-1.5 rounded-[1.5rem] w-full border border-soft-blue/20 shadow-sm">
          <button
            onClick={() => onSortChange?.('recent')}
            className={cn(
              "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              sort === 'recent' ? "bg-soft-blue/20 text-soft-ink" : "text-soft-ink/30 hover:text-soft-ink/60"
            )}
          >
            Recent
          </button>
          <button
            onClick={() => onSortChange?.('popular')}
            className={cn(
              "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              sort === 'popular' ? "bg-soft-purple/20 text-soft-ink" : "text-soft-ink/30 hover:text-soft-ink/60"
            )}
          >
            Trending
          </button>
          <button
            onClick={() => onSortChange?.('urgent')}
            className={cn(
              "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              sort === 'urgent' ? "bg-soft-pink/20 text-pink-600 font-bold" : "text-pink-400 hover:text-pink-600 font-bold"
            )}
          >
            Alerts
          </button>
        </div>

        <section className="flex gap-4 overflow-x-auto no-scrollbar py-1">
          {['Medicine', 'Adoptions', 'Rescue Hub', 'Vet Insights', 'General Help'].map(tag => (
            <motion.button 
              key={tag} 
              whileHover={{ y: -2 }}
              className="flex items-center gap-3 px-6 py-2.5 bg-white border border-soft-blue/20 rounded-full text-[10px] font-black text-soft-ink/60 hover:border-soft-blue/50 transition-all whitespace-nowrap shadow-sm uppercase tracking-widest"
            >
              <div className="w-1.5 h-1.5 bg-ruru-teal rounded-full shadow-lg shadow-ruru-teal/30" />
              {tag}
            </motion.button>
          ))}
        </section>
      </div>

      {/* Dynamic Network Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
        <motion.div 
          whileHover={{ y: -6, boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.05)' }}
          className="bg-white border border-soft-blue/20 p-10 rounded-[2.5rem] space-y-6 relative overflow-hidden group shadow-sm transition-all duration-500"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-soft-blue/10 rounded-bl-[4rem] group-hover:scale-110 transition-transform duration-500 blur-xl" />
          <div className="w-14 h-14 bg-soft-blue/20 rounded-[1.25rem] flex items-center justify-center text-soft-ink shadow-sm relative z-10">
            <TrendingUp size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] uppercase font-black text-soft-ink/30 tracking-[0.2em] mb-1">Global Interaction Index</p>
            <p className="text-4xl font-display font-semibold text-soft-ink tracking-tight">1,242 Active Hubs</p>
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ y: -6, boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.05)' }}
          className="bg-soft-ink p-10 rounded-[2.5rem] space-y-6 relative overflow-hidden group shadow-xl transition-all duration-500"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[4rem] group-hover:scale-110 transition-transform duration-500 blur-xl" />
          <div className="w-14 h-14 bg-white/10 text-white rounded-[1.25rem] flex items-center justify-center relative z-10">
            <Users size={24} />
          </div>
          <div className="relative z-10 text-white">
            <p className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] mb-1">Shared Resources</p>
            <p className="text-4xl font-display font-semibold text-white tracking-tight">48 Mutual Assets</p>
          </div>
        </motion.div>
      </section>

      <div className="space-y-12 px-2">
        {filteredPosts.map((post, idx) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className={cn(
              "group relative bg-white border border-soft-blue/20 rounded-[3.5rem] p-10 shadow-sm hover:shadow-xl hover:shadow-soft-blue/5 transition-all duration-500 space-y-8 overflow-hidden",
              post.isUrgent && "border-pink-200 bg-soft-pink/5" 
            )}
          >
            {post.isUrgent && (
              <div className="absolute top-0 right-0 p-8">
                <div className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-full shadow-lg shadow-pink-500/20">
                  <AlertCircle size={16} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Urgent Support</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-start">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-soft-ink flex items-center justify-center text-white font-display text-2xl font-bold shadow-lg shadow-soft-ink/10">
                    {post.author[0]}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-ruru-teal border-2 border-white rounded-full flex items-center justify-center text-white">
                    <CheckCircle2 size={12} strokeWidth={3} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-display text-2xl font-semibold text-soft-ink tracking-tight">{post.author}</h4>
                  <div className="flex flex-wrap items-center gap-4 text-soft-ink/30">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest leading-none">
                       <Clock size={12} />
                       <span>{post.timestamp}</span>
                    </div>
                    {post.location && (
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-soft-slate px-2 py-1 rounded-full border border-soft-blue/10 leading-none">
                        <MapPin size={12} className="text-soft-ink/40" />
                        <span>{post.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSharePost?.(post)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-soft-ink/10 hover:text-soft-ink hover:bg-soft-blue/10 transition-all"
              >
                <Share2 size={20} />
              </motion.button>
            </div>

            <div className="space-y-6">
              <p className="text-soft-ink/80 text-xl leading-relaxed font-medium tracking-tight">
                {post.content}
              </p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="px-4 py-1.5 bg-soft-slate text-soft-ink/40 rounded-full text-[10px] font-black uppercase tracking-widest border border-soft-blue/10 group-hover:bg-soft-ink group-hover:text-white transition-all duration-500">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-8 flex items-center gap-10 border-t border-soft-blue/10">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onLikePost(post.id)}
                className={cn(
                  "flex items-center gap-3 transition-all",
                  post.liked ? "text-pink-500" : "text-soft-ink/30 hover:text-pink-500"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm border",
                  post.liked ? "bg-soft-pink/20 border-pink-200" : "bg-soft-slate border-soft-blue/10"
                )}>
                  <Heart size={20} fill={post.liked ? "currentColor" : "none"} />
                </div>
                <div className="text-left leading-none">
                  <p className="text-[12px] font-black tracking-widest uppercase">{post.likes}</p>
                </div>
              </motion.button>
              
              <button 
                onClick={() => onCommentPost(post.id)}
                className="flex items-center gap-3 text-soft-ink/30 hover:text-soft-ink transition-all group/comment"
              >
                <div className="w-12 h-12 rounded-2xl bg-soft-slate border border-soft-blue/10 flex items-center justify-center group-hover/comment:bg-soft-blue/20 transition-all shadow-sm">
                  <MessageSquare size={20} />
                </div>
                <div className="text-left leading-none">
                  <p className="text-[12px] font-black tracking-widest uppercase">{post.comments}</p>
                </div>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
