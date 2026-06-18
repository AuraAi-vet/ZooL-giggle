import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Sparkles } from 'lucide-react';

export default function ClinicalConciergeWidget() {
  const [messages, setMessages] = useState<{sender: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState('');

  const send = async () => {
    if (!input) return;
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    const currentInput = input;
    setInput('');
    
    // Call server
    const res = await fetch('/api/concierge/chat', {
       method: 'POST',
       headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({ message: currentInput })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { sender: 'ai', text: data.response }]);
  }

  return (
    <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col gap-4">
      <h3 className="text-sm font-bold flex items-center gap-2"><Sparkles className="text-yellow-400" size={16}/> Clinical Concierge</h3>
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-48">
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded-lg text-xs ${m.sender === 'user' ? 'bg-slate-700 self-end' : 'bg-slate-800'}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyPress={e => e.key === 'Enter' && send()}
          className="bg-slate-800 flex-1 px-3 py-2 rounded-xl text-xs"
          placeholder="Ask about Aura's care..."
        />
        <button onClick={send} className="bg-[#3B82F6] p-2 rounded-xl"><Send size={16} /></button>
      </div>
    </div>
  );
}
