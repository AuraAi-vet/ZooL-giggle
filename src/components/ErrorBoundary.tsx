import React, { Component, ErrorInfo, ReactNode } from 'react';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryKey: number;
  componentStack?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    retryKey: 0,
    componentStack: ''
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ componentStack: errorInfo.componentStack || '' });
  }

  public handleRetry = async () => {
    if (this.state.error) {
      try {
        await addDoc(collection(db, 'aiInteractionLogs'), {
          timestamp: serverTimestamp(),
          type: 'error_boundary_retry',
          errorName: this.state.error.name || 'Error',
          errorMessage: this.state.error.message || '',
          componentStack: this.state.componentStack || 'No stack trace available',
          timestampStr: new Date().toISOString()
        });
        console.log("Telemetry: Error boundary retry logged to aiInteractionLogs.");
      } catch (err) {
        console.error("Telemetry: Failed to log error boundary retry to Firestore:", err);
      }
    }

    this.setState((prevState) => ({
      hasError: false,
      error: null,
      retryKey: prevState.retryKey + 1
    }));
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const customFallback = this.props.fallback(this.state.error, this.handleRetry);
        if (customFallback) return customFallback;
      }
      
      let errorMessage = 'Something went wrong.';
      
      try {
        // Check if it's a Firestore JSON error
        const parsed = JSON.parse(this.state.error?.message || '');
        if (parsed.error) {
          errorMessage = `Database Error: ${parsed.error} (Operation: ${parsed.operationType})`;
        }
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFCFB]">
          <div className="bg-white/95 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-xl border border-ruru-navy/10 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-2xl font-brand text-ruru-navy-light">Oops! Something went wrong</h2>
            <p className="text-ruru-navy/60 text-sm leading-relaxed">
              {errorMessage}
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={this.handleRetry}
                className="w-full bg-ruru-teal hover:bg-ruru-teal/95 text-white py-4 rounded-[1.5rem] font-bold shadow-lg shadow-ruru-teal/10 active:scale-95 transition-all"
              >
                Retry
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 py-3 rounded-[1.5rem] text-sm font-medium transition-all"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
  }
}
