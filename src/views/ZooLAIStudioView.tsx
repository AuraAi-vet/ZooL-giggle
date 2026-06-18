import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Video, Camera, Activity, FileText, Loader2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateImage, generateVideoFromText, generateVideoFromImage, analyzeContent } from '../services/zoolAIService';

// Placeholder for the AI Creative Studio View
export default function ZooLAIStudioView() {
  const [activeTab, setActiveTab] = useState<'generate-image' | 'generate-video' | 'analyze'>('generate-image');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('2K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '3:4' | '4:3'>('16:9');
  const [thinkingLevel, setThinkingLevel] = useState(false);

  const handleGenerateImage = async () => {
    if (!prompt) return;
    setIsProcessing(true);
    setResultUrl(null);
    try {
      const url = await generateImage(prompt, resolution, aspectRatio);
      setResultUrl(url);
    } catch (e) {
      console.error(e);
      alert('Failed to generate image');
    }
    setIsProcessing(false);
  };

  const handleGenerateVideo = async () => {
    if (!prompt && !selectedFile) return;
    setIsProcessing(true);
    setResultUrl(null);
    try {
      if (selectedFile) {
        const url = await generateVideoFromImage(selectedFile, prompt);
        setResultUrl(url);
      } else {
        const url = await generateVideoFromText(prompt, aspectRatio);
        setResultUrl(url);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate video');
    }
    setIsProcessing(false);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeContent(selectedFile, prompt, thinkingLevel);
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
      alert('Failed to analyze content');
    }
    setIsProcessing(false);
  };

  return (
    <div className="p-6 md:p-8 min-h-screen bg-transparent relative">
      <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-indigo-400/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 w-full">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-display flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-cyan-50 border border-cyan-100 rounded-xl shadow-[0_4px_12px_rgba(6,182,212,0.1)]">
               <Sparkles className="w-6 h-6 text-cyan-500" />
            </div>
            ZooL AI Engine
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 text-sm mt-2 ml-1">Generate premium assets and analyze clinical media using advanced models.</p>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 overflow-hidden relative z-10">
        <div className="flex border-b border-slate-200/50 p-3 gap-3 bg-white/50">
          <button 
            onClick={() => setActiveTab('generate-image')}
            className={`flex-1 py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'generate-image' ? 'bg-slate-900 shadow-md text-white' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
          >
            <ImageIcon className="w-5 h-5" /> Image Engine
          </button>
          <button 
            onClick={() => setActiveTab('generate-video')}
            className={`flex-1 py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'generate-video' ? 'bg-slate-900 shadow-md text-white' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
          >
            <Video className="w-5 h-5" /> Video Synthesis
          </button>
          <button 
            onClick={() => setActiveTab('analyze')}
            className={`flex-1 py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'analyze' ? 'bg-slate-900 shadow-md text-white' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
          >
            <Activity className="w-5 h-5" /> Deep Analysis
          </button>
        </div>

        <div className="p-6 lg:p-8 grid lg:grid-cols-2 gap-8">
          
          {/* Controls Config */}
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Studio Prompt</label>
              <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate or analyze..."
                className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all resize-none"
              />
            </div>

            {activeTab === 'generate-image' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Resolution</label>
                  <select value={resolution} onChange={(e) => setResolution(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="1K">1K (Fast)</option>
                    <option value="2K">2K (Standard)</option>
                    <option value="4K">4K (Studio Quality)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Aspect Ratio</label>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="1:1">1:1 Square</option>
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                    <option value="4:3">4:3 Standard</option>
                    <option value="3:4">3:4 Vertical</option>
                  </select>
                </div>
              </div>
            )}

            {(activeTab === 'generate-video' || activeTab === 'analyze') && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Source Media (Optional for Video)</label>
                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors relative overflow-hidden">
                        {selectedFile ? (
                           <div className="flex flex-col items-center text-emerald-600">
                             <FileText className="w-8 h-8 mb-2" />
                             <span className="text-sm font-bold truncate max-w-[200px]">{selectedFile.name}</span>
                           </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Camera className="w-8 h-8 text-slate-400 mb-2" />
                              <p className="text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    </label>
                </div>
              </div>
            )}

            {activeTab === 'analyze' && (
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <input type="checkbox" id="thinkingMode" checked={thinkingLevel} onChange={(e) => setThinkingLevel(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500" />
                <label htmlFor="thinkingMode" className="text-sm font-bold text-slate-700 select-none">Enable High Thinking Mode (Pro)</label>
              </div>
            )}

            <button 
              onClick={() => {
                if (activeTab === 'generate-image') handleGenerateImage();
                if (activeTab === 'generate-video') handleGenerateVideo();
                if (activeTab === 'analyze') handleAnalyze();
              }}
              disabled={isProcessing || (!prompt && !selectedFile)}
              className="w-full py-4 bg-slate-900 border border-slate-800 text-white font-bold rounded-2xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing Request...</> : <><Sparkles className="w-5 h-5" /> Execute Request</>}
            </button>
          </div>

          {/* Results Canvas */}
          <div className="bg-white/50 rounded-[1.5rem] border border-slate-200/60 p-6 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none mix-blend-overlay"></div>
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-cyan-500" />
                  <p className="font-medium animate-pulse text-slate-500 text-sm">Synthesizing output using Gemini and Veo...</p>
                </motion.div>
              ) : resultUrl ? (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full flex flex-col pt-4">
                  <div className="flex-1 w-full relative bg-black/5 rounded-xl overflow-hidden border border-slate-200/50 flex items-center justify-center">
                    {activeTab === 'generate-image' ? (
                      <img src={resultUrl} alt="Generated" className="max-w-full max-h-[400px] object-contain shadow-md rounded-lg" />
                    ) : (
                       <video src={resultUrl} autoPlay loop controls className="max-w-full max-h-[400px] shadow-md rounded-lg" />
                    )}
                  </div>
                </motion.div>
              ) : analysisResult ? (
                <motion.div key="analysis" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full h-full overflow-y-auto custom-scrollbar p-6 bg-white border border-slate-200 shadow-sm rounded-xl text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {analysisResult}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">ZooL Canvas Ready</h3>
                  <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Configure your parameters on the left and execute to see results.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
