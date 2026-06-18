import React, { useState } from 'react';
import { Zap, CheckCircle, Copy, FileCode2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AutoOptimizeWidget() {
  const [code, setCode] = useState('');
  const [response, setResponse] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOptimize = async () => {
    if (!code.trim()) return;
    setIsOptimizing(true);
    setResponse('');
    
    // Construct the prompt for optimization
    const prompt = `Analyze the following code for performance improvements, security issues, and syntax fixes. Suggest optimizations and provide the optimized code:\n\n${code}`;
    
    try {
      const res = await fetch('/api/openai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });
      
      const data = await res.json();
      if (res.ok) {
        setResponse(data.response);
      } else {
        setResponse(`Error: ${data.error}`);
      }
    } catch (error) {
      setResponse("An error occurred while connecting to the AI Codex API.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
             <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Auto-Optimize Code <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded pt-1 tracking-wider">AI</span>
            </h2>
            <p className="text-sm text-slate-500 font-medium">Identify performance bottlenecks and improve syntax.</p>
          </div>
        </div>
        <button 
          onClick={handleOptimize}
          disabled={isOptimizing || !code.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          {isOptimizing ? (
             <div className="w-4 h-4 border-2 border-emerald-400 border-t-white rounded-full animate-spin"></div>
          ) : (
             <Zap className="w-4 h-4" />
          )}
          {isOptimizing ? 'Optimizing...' : 'Auto-Optimize'}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative">
           <div className="absolute top-3 left-4 text-slate-400">
              <FileCode2 className="w-5 h-5" />
           </div>
           <textarea
             value={code}
             onChange={(e) => setCode(e.target.value)}
             placeholder="Paste your code snippet here to analyze..."
             className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[150px] text-sm font-mono text-slate-700 transition-shadow"
           ></textarea>
        </div>

        {response && (
          <div className="mt-2 relative animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="absolute top-0 left-0 w-full h-8 bg-slate-800 rounded-t-xl flex items-center justify-between px-4 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              </div>
              <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors">
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="bg-[#1E1E1E] text-slate-300 p-5 pt-12 rounded-xl text-sm font-mono overflow-auto max-h-[400px]">
               <div className="markdown-body prose prose-invert max-w-none prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                 <ReactMarkdown>{response}</ReactMarkdown>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
