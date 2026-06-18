import { useState } from 'react';
import { getAccessToken } from '../lib/firebase';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface ExportToDocsButtonProps {
  content: string;
  title: string;
}

export default function ExportToDocsButton({ content, title }: ExportToDocsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [docUrl, setDocUrl] = useState<string | null>(null);

  const handleExport = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      alert("Please sign out and sign back in to authorize Google Docs.");
      return;
    }

    const confirmed = window.confirm(`Create a new Google Doc with this clinical note?`);
    if (!confirmed) return;

    setIsExporting(true);
    setStatus('idle');
    try {
      // 1. Create a new document
      const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title
        })
      });

      if (!createRes.ok) throw new Error('Failed to create Doc');
      const doc = await createRes.json();
      
      // 2. Insert text into document
      const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content
              }
            }
          ]
        })
      });

      if (!updateRes.ok) throw new Error('Failed to update Doc content');
      
      setDocUrl(`https://docs.google.com/document/d/${doc.documentId}/edit`);
      setStatus('success');
      
      // Reset success status after a few seconds
      setTimeout(() => {
        setStatus('idle');
      }, 5000);
      
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={handleExport}
        disabled={isExporting || status === 'success' || !content.trim()}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
          status === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
          status === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
          'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
        } disabled:opacity-50`}
      >
        {isExporting ? (
           <Loader2 size={14} className="animate-spin" />
        ) : status === 'success' ? (
           <Check size={14} />
        ) : status === 'error' ? (
           <AlertCircle size={14} />
        ) : (
           <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M14.5 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V7.5L14.5 2Z" fill="#4285F4"/>
             <path d="M14 2V8H20" fill="#316DF6"/>
             <path d="M8 13H16M8 17H16M8 9H11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
           </svg>
        )}
        {isExporting ? 'Exporting...' : 
         status === 'success' ? 'Exported' : 
         status === 'error' ? 'Failed' : 'Push to Docs'}
      </button>
      
      {status === 'success' && docUrl && (
        <a 
          href={docUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          Open Document
        </a>
      )}
    </div>
  );
}
