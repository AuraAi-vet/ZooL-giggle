import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-10 max-w-lg w-full flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Something went wrong</h2>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              We encountered an unexpected error rendering this view. Our team has been notified.
            </p>
            
            {this.state.error && (
              <div className="w-full bg-slate-50 rounded-xl p-4 mb-6 text-left overflow-hidden">
                <p className="font-mono text-xs text-red-500 truncate" title={this.state.error.message}>
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
