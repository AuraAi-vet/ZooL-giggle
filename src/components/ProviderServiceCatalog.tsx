import React, { useState, useEffect } from 'react';
import { Package, Plus, DollarSign, Activity, Tag, Trash2, CheckCircle, Clock, Edit2, TrendingUp, CheckSquare, Square, X, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

const mockPerformanceData = [
  { name: 'Mon', views: 400 },
  { name: 'Tue', views: 300 },
  { name: 'Wed', views: 550 },
  { name: 'Thu', views: 450 },
  { name: 'Fri', views: 600 },
  { name: 'Sat', views: 700 },
  { name: 'Sun', views: 850 },
];
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

interface CatalogItem {
  id: string;
  providerId: string;
  type: 'service' | 'product';
  name: string;
  description: string;
  price: number;
  duration?: number; // For services
  stock?: number; // For products
  isActive?: boolean;
}

export default function ProviderServiceCatalog({ providerId }: { providerId: string }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [bulkPriceValue, setBulkPriceValue] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAiRecommendations, setShowAiRecommendations] = useState(false);

  // Form State
  const [type, setType] = useState<'service' | 'product'>('service');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [stock, setStock] = useState('0');

  useEffect(() => {
    loadCatalog();
  }, [providerId]);

  const loadCatalog = async () => {
    try {
      const saved = localStorage.getItem(`catalog_${providerId}`);
      if (saved) {
        setItems(JSON.parse(saved));
      } else {
        // Initial Mock Data
        const initial: CatalogItem[] = [
          { id: '1', providerId, type: 'service', name: 'General Wellness Exam', description: 'Comprehensive physical examination for cats and dogs.', price: 65, duration: 30, isActive: true },
          { id: '2', providerId, type: 'service', name: 'Dental Cleaning', description: 'Deep cleaning under anesthesia.', price: 250, duration: 60, isActive: true },
          { id: '3', providerId, type: 'product', name: 'Flea & Tick Shield (3 Month)', description: 'Advanced preventative care chewables.', price: 45, stock: 120, isActive: true },
        ];
        setItems(initial);
        localStorage.setItem(`catalog_${providerId}`, JSON.stringify(initial));
      }
    } catch(e) {}
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: CatalogItem = {
      id: editingId || ('cat_' + Date.now()),
      providerId,
      type,
      name,
      description,
      price: parseFloat(price) || 0,
      isActive: editingId ? items.find(i => i.id === editingId)?.isActive ?? true : true,
      ...(type === 'service' ? { duration: parseInt(duration) || 30 } : { stock: parseInt(stock) || 0 })
    };

    let newItems;
    if (editingId) {
      newItems = items.map(i => i.id === editingId ? newItem : i);
    } else {
      newItems = [...items, newItem];
    }

    setItems(newItems);
    localStorage.setItem(`catalog_${providerId}`, JSON.stringify(newItems));
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    resetForm();
  };

  const handleEditStart = (item: CatalogItem) => {
    setEditingId(item.id);
    setType(item.type);
    setName(item.name);
    setDescription(item.description);
    setPrice(item.price.toString());
    if (item.duration) setDuration(item.duration.toString());
    if (item.stock !== undefined) setStock(item.stock.toString());
    setIsAdding(true);
    
    // Attempt to scroll to the form
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const resetForm = () => {
    setEditingId(null);
    setIsAdding(false);
    setName('');
    setDescription('');
    setPrice('');
    setDuration('30');
    setStock('0');
  };

  const handleToggleActive = (id: string) => {
    const newItems = items.map(i => i.id === id ? { ...i, isActive: i.isActive === false ? true : false } : i);
    setItems(newItems);
    localStorage.setItem(`catalog_${providerId}`, JSON.stringify(newItems));
  };

  const handleDelete = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    localStorage.setItem(`catalog_${providerId}`, JSON.stringify(newItems));
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id));
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const toggleAllSelection = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => i.id));
    }
  };

  const handleBulkToggleActive = (makeActive: boolean) => {
    const newItems = items.map(i => selectedItems.includes(i.id) ? { ...i, isActive: makeActive } : i);
    setItems(newItems);
    localStorage.setItem(`catalog_${providerId}`, JSON.stringify(newItems));
    setSelectedItems([]);
  };

  const handleBulkUpdatePrice = () => {
    const newPrice = parseFloat(bulkPriceValue);
    if (!isNaN(newPrice) && newPrice >= 0) {
      const newItems = items.map(i => selectedItems.includes(i.id) ? { ...i, price: newPrice } : i);
      setItems(newItems);
      localStorage.setItem(`catalog_${providerId}`, JSON.stringify(newItems));
      setShowBulkPriceModal(false);
      setBulkPriceValue('');
      setSelectedItems([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleBulkDelete = () => {
    const newItems = items.filter(i => !selectedItems.includes(i.id));
    setItems(newItems);
    localStorage.setItem(`catalog_${providerId}`, JSON.stringify(newItems));
    setSelectedItems([]);
  };

  const handleAcceptAiRecommendation = () => {
    // Example: Decrease price of "1" (Wellness Exam) as it's highly booked, or maybe increase it?
    // Let's create an AI mock action that updates price for "General Wellness Exam" from 65 to 75
    // and hides an underperforming product.
    const newItems = items.map(item => {
      if (item.name === 'General Wellness Exam') {
        return { ...item, price: 75 };
      }
      return item;
    });
    setItems(newItems);
    localStorage.setItem(`catalog_${providerId}`, JSON.stringify(newItems));
    setShowAiRecommendations(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const services = items.filter(i => i.type === 'service');
  const products = items.filter(i => i.type === 'product');

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] border border-slate-200/60 p-6 flex flex-col pt-8 relative overflow-hidden min-h-[600px]">
      
      {showSuccess && (
        <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-emerald-600 animate-in fade-in duration-300">
           <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display font-black">Saved Successfully</h2>
        </div>
      )}

      {showBulkPriceModal && (
        <div className="absolute inset-0 z-30 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4 relative">
             <button aria-label="Close modal" onClick={() => setShowBulkPriceModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
               <X className="w-5 h-5"/>
             </button>
             <h3 className="font-bold text-slate-900 text-lg">Update Price (Bulk)</h3>
             <p className="text-slate-500 text-sm">Set a new price for {selectedItems.length} selected items.</p>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Price ($)</label>
               <input type="number" min="0" step="0.01" value={bulkPriceValue} onChange={e => setBulkPriceValue(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none" placeholder="0.00" />
             </div>
             <button onClick={handleBulkUpdatePrice} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md mt-2">
               Apply Price
             </button>
          </div>
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between min-w-[400px] animate-in slide-in-from-bottom-8">
           <div className="flex items-center gap-3">
             <div className="bg-slate-800 text-indigo-400 font-bold px-3 py-1 rounded-lg text-sm">{selectedItems.length}</div>
             <span className="font-bold text-sm">Selected</span>
           </div>
           <div className="flex items-center gap-2">
             <button onClick={() => handleBulkToggleActive(true)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors">Set Active</button>
             <button onClick={() => handleBulkToggleActive(false)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors">Set Hidden</button>
             <button onClick={() => setShowBulkPriceModal(true)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold transition-colors">Adjust Price</button>
             <button onClick={handleBulkDelete} className="p-1.5 ml-2 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
           </div>
        </div>
      )}

      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 relative z-10 gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-800 flex items-center gap-3">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
               <Package className="w-6 h-6" />
             </div>
             Practice Offerings
          </h2>
          <p className="text-slate-500 text-sm mt-1">Manage your service catalog and retail products available for billing.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAiRecommendations(!showAiRecommendations)}
            className={`flex items-center gap-2 px-4 py-2 ${showAiRecommendations ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'bg-slate-900 text-amber-400 hover:bg-slate-800'} rounded-xl text-sm font-bold transition-all shadow-md group`}
          >
            <Sparkles className={`w-4 h-4 ${showAiRecommendations ? '' : 'group-hover:animate-pulse'}`} /> 
            AI Insights
          </button>
          <button 
            onClick={toggleAllSelection}
            className={`flex items-center gap-2 px-4 py-2 ${selectedItems.length === items.length && items.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'} hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors`}
          >
            {selectedItems.length === items.length && items.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            Select All
          </button>
          <button 
            onClick={() => {
              if (isAdding) {
                resetForm();
              } else {
                setIsAdding(true);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 ${isAdding ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'} rounded-xl text-sm font-bold transition-colors`}
          >
            {isAdding ? 'Cancel' : <><Plus className="w-4 h-4" /> Add Item</>}
          </button>
        </div>
      </div>

      {showAiRecommendations && (
        <div className="mb-8 relative z-10 animate-in slide-in-from-top-4 duration-300">
           <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
               <Zap className="w-48 h-48 text-amber-600" />
             </div>
             
             <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-amber-600 font-bold tracking-wider uppercase text-xs mb-3">
                    <Sparkles className="w-4 h-4" /> Automated Analysis 
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Demand Surge Detected</h3>
                  <p className="text-sm text-slate-600 mb-4 max-w-2xl">
                    Our AI models indicate a 40% increase in regional bookings for <strong>General Wellness Exams</strong> over the past week. Concurrently, <strong>Flea & Tick Shield</strong> engagement has dropped by 15%. 
                  </p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                     <div className="bg-white/60 border border-amber-200/50 rounded-xl p-3 flex items-center gap-4">
                        <div className="text-xs font-bold text-slate-500 uppercase">Suggested Action</div>
                        <div className="flex items-center gap-2">
                           <span className="text-slate-800 font-bold">$65.00</span>
                           <ArrowRight className="w-4 h-4 text-slate-400" />
                           <span className="text-emerald-600 font-bold">$75.00</span>
                        </div>
                        <div className="text-xs text-slate-500">for Wellness Exam</div>
                     </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[200px]">
                  <button onClick={handleAcceptAiRecommendation} className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Apply Changes
                  </button>
                  <button onClick={() => setShowAiRecommendations(false)} className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-bold transition-colors">
                    Dismiss
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleSave} className="mb-10 bg-slate-50 rounded-2xl p-6 border border-slate-200 animate-in slide-in-from-top-4 duration-300 relative z-10">
          <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-widest">{editingId ? 'Edit Item' : 'New Item'}</h3>
          <div className="flex gap-4 mb-6">
            <label className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl border-2 cursor-pointer transition-all ${type === 'service' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
               <input type="radio" value="service" checked={type === 'service'} onChange={() => setType('service')} className="sr-only" />
               <Activity className="w-6 h-6 mb-2" />
               <span className="font-bold text-sm">Professional Service</span>
            </label>
            <label className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl border-2 cursor-pointer transition-all ${type === 'product' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
               <input type="radio" value="product" checked={type === 'product'} onChange={() => setType('product')} className="sr-only" />
               <Tag className="w-6 h-6 mb-2" />
               <span className="font-bold text-sm">Retail Product</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
               <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none" placeholder={type === 'service' ? "e.g. Annual Wellness Exam" : "e.g. Heartworm Prevention"} />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price ($)</label>
               <input required type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none" placeholder="0.00" />
             </div>
             <div className="md:col-span-2">
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
               <textarea required rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none resize-none" placeholder="Describe the item..."></textarea>
             </div>
             {type === 'service' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duration (Minutes)</label>
                  <input required type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                </div>
             ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Initial Stock</label>
                  <input required type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none" />
                </div>
             )}
          </div>
          
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Live Preview</label>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-[140px] pointer-events-none flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 pr-8 line-clamp-1">{name || 'Item Name'}</h4>
                  <p className="text-sm text-slate-500 mt-1 mb-2 line-clamp-2 pr-12">{description || 'Item description will appear here...'}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    {type === 'service' ? <><Clock className="w-4 h-4" /> {duration || 0} mins</> : <><Package className="w-4 h-4" /> {stock || 0} in stock</>}
                  </div>
                  <div className="font-bold text-lg text-emerald-600 flex items-center">
                    <DollarSign className="w-4 h-4" />{parseFloat(price || '0').toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                 <TrendingUp className="w-4 h-4" /> 7-Day Performance Insight
              </label>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm h-[140px] flex flex-col justify-between relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
                 <div className="relative z-10 flex justify-between items-end mb-2">
                   <div>
                     <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Total Interest</div>
                     <div className="text-white text-xl font-display font-bold">3,850 views</div>
                   </div>
                   <div className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-md">
                      +12.5%
                   </div>
                 </div>
                 <div className="h-12 w-full relative z-10 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockPerformanceData}>
                        <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={3} dot={false} strokeLinecap="round" />
                        <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                      </LineChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md mt-2">
            {editingId ? 'Update' : 'Save'} {type === 'service' ? 'Service' : 'Product'}
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid md:grid-cols-2 gap-8 relative z-10">
        
        {/* Services List */}
        <div>
          <h3 className="text-sm font-black text-slate-400 tracking-widest uppercase mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Professional Services
          </h3>
          <div className="space-y-4">
            {services.map(item => (
              <div key={item.id} className={`group bg-white border ${selectedItems.includes(item.id) ? 'border-indigo-400 ring-2 ring-indigo-400/20' : item.isActive === false ? 'border-dashed border-slate-200 opacity-60' : 'border-slate-200'} rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all relative`}>
                 <div className="absolute top-4 left-4 z-10">
                   <button onClick={() => toggleSelection(item.id)} className={`p-0.5 rounded-md ${selectedItems.includes(item.id) ? 'text-indigo-600' : 'text-slate-300 hover:text-indigo-400'}`}>
                     {selectedItems.includes(item.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                   </button>
                 </div>
                 <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleToggleActive(item.id)} className={`text-xs font-bold px-2 py-1 rounded-md ${item.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {item.isActive !== false ? 'Active' : 'Hidden'}
                    </button>
                    <button onClick={() => handleEditStart(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-md">
                       <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-md">
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
                 <div className="pl-8 pr-24">
                   <h4 className="font-bold text-slate-800">{item.name}</h4>
                   {item.isActive === false && <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-bold rounded mt-1">Inactive</span>}
                 </div>
                 <p className="text-sm text-slate-500 mt-1 mb-4 line-clamp-2 pl-8 pr-12">{item.description}</p>
                 <div className="flex items-center justify-between border-t border-slate-100 pt-3 pl-8">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <Clock className="w-4 h-4" /> {item.duration} mins
                    </div>
                    <div className="font-bold text-lg text-indigo-600 flex items-center">
                      <DollarSign className="w-4 h-4" />{item.price.toFixed(2)}
                    </div>
                 </div>
              </div>
            ))}
            {services.length === 0 && <p className="text-slate-400 text-sm italic">No services registered.</p>}
          </div>
        </div>

        {/* Products List */}
         <div>
          <h3 className="text-sm font-black text-slate-400 tracking-widest uppercase mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4" /> Retail Products
          </h3>
          <div className="space-y-4">
            {products.map(item => (
              <div key={item.id} className={`group bg-white border ${selectedItems.includes(item.id) ? 'border-emerald-400 ring-2 ring-emerald-400/20' : item.isActive === false ? 'border-dashed border-slate-200 opacity-60' : 'border-slate-200'} rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all relative`}>
                 <div className="absolute top-4 left-4 z-10">
                   <button onClick={() => toggleSelection(item.id)} className={`p-0.5 rounded-md ${selectedItems.includes(item.id) ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-400'}`}>
                     {selectedItems.includes(item.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                   </button>
                 </div>
                 <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleToggleActive(item.id)} className={`text-xs font-bold px-2 py-1 rounded-md ${item.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {item.isActive !== false ? 'Active' : 'Hidden'}
                    </button>
                    <button onClick={() => handleEditStart(item)} className="p-1.5 text-slate-400 hover:text-emerald-600 bg-slate-50 rounded-md">
                       <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-md">
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
                 <div className="pl-8 pr-24">
                   <h4 className="font-bold text-slate-800">{item.name}</h4>
                   {item.isActive === false && <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-bold rounded mt-1">Inactive</span>}
                 </div>
                 <p className="text-sm text-slate-500 mt-1 mb-4 line-clamp-2 pl-8 pr-12">{item.description}</p>
                 <div className="flex items-center justify-between border-t border-slate-100 pt-3 pl-8">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <Package className="w-4 h-4" /> {item.stock} in stock
                    </div>
                    <div className="font-bold text-lg text-emerald-600 flex items-center">
                      <DollarSign className="w-4 h-4" />{item.price.toFixed(2)}
                    </div>
                 </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-slate-400 text-sm italic">No products registered.</p>}
          </div>
        </div>

      </div>

    </div>
  );
}
