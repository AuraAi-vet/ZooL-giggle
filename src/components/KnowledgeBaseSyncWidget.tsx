import { useState } from 'react';
import { Database, UploadCloud, CheckCircle, Loader2, Download } from 'lucide-react';
import { GemmaPipelineService } from '../services/gemmaPipelineService';

export default function KnowledgeBaseSyncWidget() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate invoking the AI data ingestion pipeline with 'vetbert'
      await GemmaPipelineService.seedBaselineKnowledge();
      
      // Simulate processing time for Kaggle dataset ingestion
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      setLastSync(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(error);
      alert('Failed to sync knowledge base.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const jsonlData = await GemmaPipelineService.exportFinetuningDataset();
      const blob = new Blob([jsonlData], { type: 'application/jsonlines+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zool_gemma_finetune_${new Date().toISOString().split('T')[0]}.jsonl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export dataset:', error);
      alert('Failed to export dataset.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-slate-200/60 p-6 flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-50/80 rounded-full blur-2xl group-hover:bg-indigo-100/80 transition-colors"></div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100/50">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-900 tracking-tight">Clinical AI Integration</h2>
          <p className="text-xs font-semibold text-slate-500">VetBERT Knowledge Base Sync</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 relative z-10">
        <p className="text-sm font-medium text-slate-600">
          Activate external clinical datasets and update the Gemma RAG pipeline context for strict diagnostic accuracy.
        </p>
        
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${lastSync ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
               <span className="text-sm font-bold text-slate-700">{lastSync ? 'Synchronized' : 'Update Required'}</span>
            </div>
            {lastSync && <span className="text-xs font-medium text-slate-500">Last sync: {lastSync}</span>}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
          >
            {isSyncing ? (
              <><Loader2 className="w-4 h-4 animate-spin"/> Ingesting...</>
            ) : lastSync ? (
              <><CheckCircle className="w-4 h-4 text-emerald-400"/> Resync</>
            ) : (
              <><UploadCloud className="w-4 h-4"/> Activate</>
            )}
          </button>
          
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <><Loader2 className="w-4 h-4 animate-spin"/> Exporting...</>
            ) : (
              <><Download className="w-4 h-4"/> Export JSONL</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
