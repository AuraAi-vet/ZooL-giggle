import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Log to server API for remote tracing
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        context: {
          componentStack: errorInfo.componentStack,
          name: error.name
        },
        timestamp: new Date().toISOString()
      })
    }).catch(null); // Silent fail if logging fails
  }

  public handleRetry = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-10 max-w-lg w-full flex flex-col items-center text-center">
            
            {/* Clearer empty state graphic */}
            <div className="relative flex items-center justify-center w-28 h-28 mb-8">
              <div className="absolute inset-0 bg-red-50 rounded-full" />
              <div className="absolute inset-2 bg-red-100/50 rounded-full animate-pulse" />
              <AlertTriangle className="w-12 h-12 text-red-500 relative z-10" />
              <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-sm border border-slate-100">
                <XCircle className="w-6 h-6 text-slate-400" />
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Something went wrong</h2>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              We encountered an unexpected error rendering this view. Our team has been notified.
            </p>
            
            {this.state.error && (
              <div className="w-full bg-slate-50 rounded-xl p-4 mb-8 text-left overflow-hidden border border-slate-100">
                <p className="font-mono text-xs text-red-500 truncate" title={this.state.error.message}>
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={this.handleRetry}
                className="flex-[2] flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                Reload
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
