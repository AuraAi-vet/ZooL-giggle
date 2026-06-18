import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, XCircle, LogOut } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  recoveryAttempts: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    recoveryAttempts: 0
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Auto-recovery mechanism
    if (this.state.recoveryAttempts < 2) {
      console.log(`Auto-recovering attempt ${this.state.recoveryAttempts + 1}...`);
      setTimeout(() => {
        this.setState(prev => ({
          hasError: false,
          error: null,
          recoveryAttempts: prev.recoveryAttempts + 1
        }));
      }, 500); // give it half a second before trying again
    } else {
      // If we failed twice, log it to the server
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          context: { componentStack: errorInfo.componentStack, name: error.name },
          timestamp: new Date().toISOString()
        })
      }).catch(null);
    }
  }

  public handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      recoveryAttempts: prev.recoveryAttempts + 1
    }));
  };

  public handleResetLogin = () => {
    useAppStore.getState().setAuth(null, null);
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.state.recoveryAttempts < 2) {
        // We are currently in an auto-recovery phase, show a subtle loading state instead of a hard crash
        return (
          <div className="min-h-[400px] flex items-center justify-center p-6 text-slate-800">
             <div className="flex flex-col items-center gap-4 text-slate-400 font-medium animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <p>Recovering view state...</p>
             </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-10 max-w-lg w-full flex flex-col items-center text-center">
            
            <div className="relative flex items-center justify-center w-28 h-28 mb-8">
              <div className="absolute inset-0 bg-red-50 rounded-full" />
              <div className="absolute inset-2 bg-red-100/50 rounded-full animate-pulse" />
              <AlertTriangle className="w-12 h-12 text-red-500 relative z-10" />
              <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-sm border border-slate-100">
                <XCircle className="w-6 h-6 text-slate-400" />
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Critical Runtime Error</h2>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              We encountered an unrecoverable error in this view module. Auto-recovery failed.
            </p>
            
            {this.state.error && (
              <div className="w-full bg-slate-50 rounded-xl p-4 mb-8 text-left overflow-hidden border border-slate-100">
                <p className="font-mono text-xs text-red-500 truncate" title={this.state.error.message}>
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="flex flex-col gap-3 w-full">
              <div className="flex gap-3 w-full">
                <button 
                  onClick={this.handleRetry}
                  className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 flex items-center justify-center py-3.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 active:scale-[0.98] transition-all"
                >
                  Reload
                </button>
              </div>
              <button 
                onClick={this.handleResetLogin}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 active:scale-[0.98] transition-all border border-rose-100"
              >
                <LogOut className="w-5 h-5" />
                Reset State & Re-login
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
