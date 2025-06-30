import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRefresh = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex items-center justify-center p-4">
          <div className="kid-card-rainbow p-10 max-w-md w-full text-center">
            <div className="text-6xl mb-6">😅</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Oops! Something went wrong!
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Don't worry! Even the smartest computers sometimes need a little help. 
              Let's try again!
            </p>
            
            <div className="space-y-4">
              <button
                onClick={this.handleRefresh}
                className="kid-button-primary w-full"
              >
                <RefreshCw className="w-5 h-5 inline mr-2" />
                🔄 Try Again
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="kid-button-secondary w-full"
              >
                <Home className="w-5 h-5 inline mr-2" />
                🏠 Go Home
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-600 cursor-pointer">
                  Technical Details (for developers)
                </summary>
                <pre className="text-xs text-gray-500 mt-2 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
