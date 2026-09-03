import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Safe centralized error logging
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary caught error]:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600 shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Something unexpected happened
          </h2>

          <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
            An unexpected error occurred while displaying this page. Your data is safe. You can try refreshing the page or returning to the dashboard.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={this.handleReset}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => { window.location.href = '/'; }}
              className="flex items-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <details className="mt-8 text-left max-w-xl w-full p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono overflow-auto max-h-48">
              <summary className="cursor-pointer font-semibold text-slate-600 mb-2">
                Technical Details (Development Mode Only)
              </summary>
              <p className="font-bold text-red-600 mb-1">{this.state.error.toString()}</p>
              <pre className="text-[11px] whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
