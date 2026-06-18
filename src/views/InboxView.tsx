import { useState, useEffect } from 'react';
import { Mail, Send, RefreshCw, X, AlertCircle } from 'lucide-react';
import { getAccessToken } from '../lib/firebase';

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  payload?: any;
}

export default function InboxView() {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  
  // Compose state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchEmails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No access token available. Please sign in again.');
      }

      // Fetch message list
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=INBOX', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error(`Gmail API returned ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data.messages) {
        setMessages([]);
        return;
      }

      // Fetch details for each message
      const messageDetails = await Promise.all(
        data.messages.map(async (msg: { id: string }) => {
          const mRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return mRes.json();
        })
      );
      
      setMessages(messageDetails);
    } catch (err: any) {
      console.error('Failed to fetch emails:', err);
      setError(err.message || 'Failed to connect to Gmail.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeBody) return;
    
    // Explicit user confirmation for destructive/mutating action
    const confirmed = window.confirm(`Send email to ${composeTo}?`);
    if (!confirmed) return;

    setIsSending(true);
    try {
      const token = getAccessToken();
      if (!token) throw new Error('No access token');

      // Construct raw email
      const emailLines = [
        `To: ${composeTo}`,
        `Subject: ${composeSubject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        composeBody
      ];
      const emailStr = emailLines.join('\r\n');
      const base64EncodedEmail = btoa(emailStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: base64EncodedEmail })
      });

      if (!res.ok) {
        throw new Error(`Failed to send: ${res.statusText}`);
      }

      setIsComposeOpen(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      alert('Email sent successfully!');
      fetchEmails(); // refresh
    } catch (err: any) {
      console.error(err);
      alert('Error sending email: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const getHeader = (msg: GmailMessage, headerName: string) => {
    if (!msg.payload?.headers) return '';
    const header = msg.payload.headers.find((h: any) => h.name === headerName);
    return header ? header.value : '';
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-sky-500" />
            Inbox
          </h1>
          <p className="text-slate-500 text-sm">Workspace Email Integration</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fetchEmails()} 
            disabled={isLoading}
            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <Send className="w-4 h-4" />
            Compose
          </button>
        </div>
      </header>

      {error ? (
        <div className="p-6 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl flex flex-col items-center justify-center gap-4 h-64">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="font-medium text-center">{error}</p>
          <button 
            onClick={async () => {
              try {
                const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
                const { auth, googleProvider, setAccessToken } = await import('../lib/firebase');
                const result = await signInWithPopup(auth, googleProvider);
                const credential = GoogleAuthProvider.credentialFromResult(result);
                if (credential?.accessToken) {
                  setAccessToken(credential.accessToken);
                  fetchEmails();
                }
              } catch (err: any) {
                console.error(err);
                if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request' || err.code === 'auth/internal-error') {
                  setError("Please open the app in a new tab to authenticate (use the 'Open in new tab' icon at the top right of the preview).");
                } else {
                  setError("Failed to sign in: " + err.message);
                }
              }
            }}
            className="mt-2 px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm transition-colors"
          >
            Authenticate with Google
          </button>
        </div>
      ) : (
        <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Mail className="w-12 h-12 mb-3 opacity-20" />
              <p>No recent emails found in your inbox.</p>
            </div>
          ) : (
            <div className="overflow-y-auto w-full">
              {messages.map((msg) => (
                <div key={msg.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-800 text-sm">{getHeader(msg, 'From')}</p>
                    <span className="text-xs text-slate-400">
                      {new Date(parseInt(msg.internalDate)).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-medium text-slate-700 text-sm truncate">{getHeader(msg, 'Subject') || '(No Subject)'}</p>
                  <p className="text-xs text-slate-500 truncate">{msg.snippet}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compose Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compose-modal-title"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 id="compose-modal-title" className="font-bold text-slate-800">New Message</h3>
              <button 
                onClick={() => setIsComposeOpen(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none rounded-lg"
                aria-label="Close compose modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSend} className="flex flex-col p-4 gap-4">
              <input 
                type="email" 
                required
                placeholder="To" 
                value={composeTo}
                onChange={e => setComposeTo(e.target.value)}
                className="w-full px-4 py-2 border-b border-slate-200 focus:border-sky-500 focus:outline-none placeholder-slate-400 text-sm"
                aria-label="Recipient Email Address"
              />
              <input 
                type="text" 
                placeholder="Subject" 
                value={composeSubject}
                onChange={e => setComposeSubject(e.target.value)}
                className="w-full px-4 py-2 border-b border-slate-200 focus:border-sky-500 focus:outline-none placeholder-slate-400 text-sm font-medium"
                aria-label="Email Subject"
              />
              <textarea 
                placeholder="Write your email here..." 
                required
                value={composeBody}
                onChange={e => setComposeBody(e.target.value)}
                className="w-full px-4 py-2 h-48 focus:outline-none placeholder-slate-400 text-sm resize-none"
                aria-label="Email Body Message"
              />
              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={isSending || !composeTo || !composeBody}
                  className="flex items-center gap-2 px-6 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl font-bold transition-colors"
                >
                  {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
