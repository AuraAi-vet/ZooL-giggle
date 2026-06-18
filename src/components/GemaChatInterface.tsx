import { useState } from 'react';
import { Sparkles, Send, Trash2, CalendarPlus } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface GemaChatProps {
  petContext?: any;
  onBookAction: () => void;
}

export default function GemaChatInterface({ petContext, onBookAction }: GemaChatProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: `Hi there! I'm Gema. How is ${petContext?.name || 'your pet'} doing today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const clearChat = () => setMessages([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);
    setInput('');

    try {
      const response = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: `User says: "${userMessage}". Context: Pet name is ${petContext?.name || 'unknown'}.`
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse AI messages for the action trigger
  const renderMessageContent = (text: string) => {
    const actionTag = '[ACTION_BOOK_TRIAL]';
    const hasAction = text.includes(actionTag);
    const cleanText = text.replace(actionTag, '').trim();

    return (
      <div className="flex flex-col gap-3">
        <div className="prose prose-sm prose-slate max-w-none text-xs leading-relaxed">
           <Markdown remarkPlugins={[remarkGfm]}>{cleanText}</Markdown>
        </div>
        {hasAction && (
          <button 
            onClick={onBookAction}
            className="flex items-center justify-center gap-2 mt-2 w-full py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
          >
            <CalendarPlus size={14} />
            Confirm Trial Appointment
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl p-6 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col gap-4 h-[400px] md:h-[500px] overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-400/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <h2 className="relative z-10 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-sky-50 rounded-xl border border-sky-100 shadow-sm relative">
             <div className="absolute inset-0 bg-sky-400/20 rounded-xl animate-pulse blur-sm"></div>
             <Sparkles size={16} className="text-sky-500 relative z-10" />
           </div>
           <span className="font-display tracking-tight text-sm bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">Gema Intelligence</span>
        </div>
        <button onClick={clearChat} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors tooltip focus:outline-none" title="Clear Chat">
           <Trash2 size={16} />
        </button>
      </h2>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 relative z-10 scrollbar-thin scrollbar-thumb-slate-200">
        {messages.map((m, i) => (
          <div key={i} className={`p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-slate-900 text-white ml-auto max-w-[85%] shadow-lg shadow-slate-900/10 rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-700 mr-auto max-w-[90%] shadow-sm rounded-tl-sm'}`}>
            {m.role === 'ai' ? renderMessageContent(m.text) : m.text}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-sky-500 font-medium italic pt-2">
            <Sparkles className="w-3 h-3 animate-spin" />
            Processing clinical context...
          </div>
        )}
      </div>
      <div className="flex gap-2 relative z-10 p-1 bg-slate-50 border border-slate-200 rounded-2xl">
        <input 
          className="flex-1 text-sm bg-transparent px-4 py-3 outline-none text-slate-800 placeholder-slate-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask Gema to analyze records..."
        />
        <button onClick={sendMessage} className="aspect-square flex items-center justify-center bg-slate-900 text-white rounded-xl hover:bg-sky-600 hover:shadow-[0_0_15px_rgba(14,165,233,0.4)] transition-all action-bounce m-1 px-4">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
