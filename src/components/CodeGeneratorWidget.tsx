import React, { useState } from 'react';
import { Terminal, Copy, CheckCircle, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function CodeGeneratorWidget() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResponse('');
    
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
      setIsGenerating(false);
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
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
           <Terminal className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            OpenAI Codex <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded pt-1 tracking-wider">Dev</span>
          </h2>
          <p className="text-sm text-slate-500 font-medium">Generate custom code snippets, automation scripts, or HTML templates.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., Write a python script to bulk-import animal patient records from a CSV file..."
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[100px] text-sm font-mono text-slate-700"
        ></textarea>
        
        <div className="flex justify-end">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
               <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
            ) : (
               <Code className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Code'}
          </button>
        </div>

        {response && (
          <div className="mt-4 relative animate-in fade-in slide-in-from-top-2 duration-300">
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
               <div className="markdown-body prose prose-invert max-w-none">
                 <ReactMarkdown>{response}</ReactMarkdown>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
