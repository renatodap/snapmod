'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error('[ErrorBoundary] Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    console.error('[ErrorBoundary] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    this.setState({
      error,
      errorInfo
    });

    // Log to analytics or error reporting service here if needed
  }

  handleReset = () => {
    console.log('[ErrorBoundary] User clicked reset');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            Something went wrong
          </h1>

          <p className="text-white/60 text-center mb-8 max-w-md">
            The app encountered an unexpected error. Please try refreshing the page.
          </p>

          {this.state.error && (
            <div className="bg-white/10 rounded-lg p-4 mb-6 max-w-md w-full">
              <p className="text-white/80 text-sm font-mono break-words">
                {this.state.error.message}
              </p>
            </div>
          )}

          <button
            onClick={this.handleReset}
            className="bg-blue-500 text-white px-8 py-4 rounded-2xl font-semibold flex items-center gap-3 active:scale-95 transition shadow-2xl shadow-blue-500/50"
          >
            <RefreshCw className="w-5 h-5" />
            Reload App
          </button>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-8 max-w-2xl w-full">
              <summary className="text-white/60 cursor-pointer mb-2">
                Error Details (Dev Only)
              </summary>
              <pre className="text-white/40 text-xs bg-white/5 p-4 rounded-lg overflow-auto max-h-96">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
