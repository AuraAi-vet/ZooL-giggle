import React, { useState } from 'react';
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
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4 h-[400px] md:h-[500px]">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-indigo-50 rounded-lg">
             <Sparkles size={16} className="text-indigo-600" />
           </div>
           <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Gema Assistant</span>
        </div>
        <button onClick={clearChat} className="text-slate-400 hover:text-rose-500 transition-colors tooltip" title="Clear Chat">
           <Trash2 size={16} />
        </button>
      </h2>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m, i) => (
          <div key={i} className={`p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white ml-auto max-w-[85%] shadow-md shadow-indigo-600/20' : 'bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 mr-auto max-w-[90%] shadow-sm'}`}>
            {m.role === 'ai' ? renderMessageContent(m.text) : m.text}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-500 font-medium italic animate-pulse">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75" />
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150" />
            Gema is thinking...
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input 
          className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask Gema..."
        />
        <button onClick={sendMessage} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
