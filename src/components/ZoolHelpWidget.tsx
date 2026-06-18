import { useState, useRef, useEffect } from 'react';
import { Bot, X, MessageSquare, Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { auth } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function ZoolHelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hi! I am the ZooL Assistant powered by Gemini. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userRole, setUserRole] = useState('role_owner_01');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchRole = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().roleId || 'role_owner_01');
        }
      }
    };
    fetchRole();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '', isStreaming: true }]);

    try {
      const response = await fetch('/api/gemini/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content, userRole }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let text = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          text += chunk;
          
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId ? { ...msg, content: text } : msg
          ));
        }
      }
    } catch (error) {
      console.error('Support Chat Error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId ? { ...msg, content: 'Sorry, I am having trouble connecting to the knowledge base.' } : msg
      ));
    } finally {
      setIsTyping(false);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
      ));
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 outline-none text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 origin-bottom-right">
          
          {/* Header */}
          <div className="p-4 bg-indigo-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-tight">ZooL Assistant</h3>
                <p className="text-indigo-200 text-xs font-medium flex items-center gap-1"><Sparkles className="w-3 h-3" /> Powered by Gemma</p>
              </div>
            </div>
            <button aria-label="Close chat" onClick={() => setIsOpen(false)} className="p-2 hover:bg-indigo-500 rounded-full transition-colors text-indigo-100 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                     <div className="markdown-body text-sm prose prose-sm max-w-none">
                       <ReactMarkdown>{msg.content}</ReactMarkdown>
                       {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-indigo-500 animate-pulse" />}
                     </div>
                  ) : (
                     <p className="text-sm font-medium">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isTyping && messages[messages.length - 1].role === 'user' && (
              <div className="flex justify-start">
                 <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm p-4 shadow-sm flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about app features or clinical guidelines..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 font-medium shadow-inner"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send Message"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 font-medium mt-2">AI can make mistakes. Verify clinical information.</p>
          </div>
        </div>
      )}
    </>
  );
}
