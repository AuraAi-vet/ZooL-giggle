import React, { useState } from 'react';
import { Terminal, Copy, CheckCircle, Code, FileCode2, Zap, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const PROMPT_LIBRARY = {
  generate: [
    { label: 'React Component', template: 'Create a functional React component with Tailwind CSS that does...' },
    { label: 'API Route', template: 'Write an Express GET endpoint that connects to a database and returns...' },
    { label: 'Unit Test', template: 'Write a Jest unit test for a function that...' },
  ],
  refactor: [
    { label: 'Add Error Handling', template: 'Add robust try-catch error handling to this code and return appropriate status codes:\n\n' },
    { label: 'Optimize State', template: 'Optimize the React state management in this component to prevent unnecessary re-renders:\n\n' },
    { label: 'Convert to TypeScript', template: 'Convert this JavaScript code into strictly typed TypeScript, defining all necessary interfaces:\n\n' },
  ]
};

export default function CodexAssistant() {
  const [mode, setMode] = useState<'generate' | 'refactor'>('generate');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const applyTemplate = (template: string) => {
    setPrompt(template);
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setResponse('');
    
    // Construct the prompt based on mode
    let fullPrompt = prompt;
    if (mode === 'refactor') {
        fullPrompt = `Refactor the following code to improve performance, readability, and syntax. Provide the optimized code and a brief explanation:\n\n${prompt}`;
    }
    
    try {
      const res = await fetch('/api/openai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: fullPrompt })
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
      setIsProcessing(false);
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
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm border border-indigo-100">
             <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Codex Assistant <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded pt-1 tracking-wider">AI</span>
            </h2>
            <p className="text-sm text-slate-500 font-medium">Generate or refactor code snippets instantly.</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => { setMode('generate'); setResponse(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'generate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Code className="w-4 h-4" /> Generate
          </button>
          <button 
            onClick={() => { setMode('refactor'); setResponse(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'refactor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileCode2 className="w-4 h-4" /> Refactor
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Prompt Library */}
        <div className="flex flex-wrap gap-2 mb-2">
           <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase mr-2 tracking-wider">
              <BookOpen className="w-4 h-4" /> Library
           </div>
           {PROMPT_LIBRARY[mode].map((item, index) => (
             <button 
               key={index} 
               onClick={() => applyTemplate(item.template)}
               className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors shadow-sm"
             >
               {item.label}
             </button>
           ))}
        </div>

        <div className="relative">
           <textarea
             value={prompt}
             onChange={(e) => setPrompt(e.target.value)}
             placeholder={mode === 'generate' ? "Describe the code you want to generate..." : "Paste the code you want to refactor..."}
             className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[120px] text-sm font-mono text-slate-700"
           ></textarea>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleSubmit}
            disabled={isProcessing || !prompt.trim()}
            className={`flex items-center gap-2 px-6 py-3 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 ${mode === 'generate' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {isProcessing ? (
               <div className={`w-4 h-4 border-2 border-t-white rounded-full animate-spin ${mode === 'generate' ? 'border-indigo-400' : 'border-emerald-400'}`}></div>
            ) : mode === 'generate' ? (
               <Code className="w-4 h-4" />
            ) : (
               <Zap className="w-4 h-4" />
            )}
            {isProcessing ? 'Processing...' : mode === 'generate' ? 'Generate Code' : 'Refactor Code'}
          </button>
        </div>

        {response && (
          <div className="mt-4 relative animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="absolute top-0 left-0 w-full h-10 bg-slate-800 rounded-t-xl flex items-center justify-between px-4 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="text-slate-400 text-xs font-mono lowercase tracking-widest">{mode === 'generate' ? 'output.md' : 'refactored.md'}</div>
              <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                {copied ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            <div className="bg-[#1E1E1E] text-slate-300 p-6 pt-16 rounded-xl text-sm font-mono overflow-auto max-h-[500px]">
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
