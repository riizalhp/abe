import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// Using React.Component with type casting for React 19 compatibility
const ErrorBoundaryClass = React.Component as new (props: Props) => React.Component<Props, State>;

export default class ErrorBoundary extends ErrorBoundaryClass {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    (this as any).setState({ errorInfo });
  }

  handleRetry = (): void => {
    (this as any).setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): React.ReactNode {
    const props = (this as any).props as Props;
    
    if (this.state.hasError) {
      if (props.fallback) {
        return props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">
                error
              </span>
            </div>
            
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Oops! Terjadi Kesalahan
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Aplikasi mengalami error yang tidak terduga. Silakan coba lagi atau hubungi tim support jika masalah berlanjut.
            </p>

            {this.state.error && (
              <details className="mb-6 text-left bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                  Detail Error
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Coba Lagi
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }

    return props.children;
  }
}
