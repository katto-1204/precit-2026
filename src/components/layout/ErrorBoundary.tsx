import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[PrepCIT] Uncaught UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-brand-600">
              <AlertTriangle className="h-5 w-5" />
              <h1 className="text-base font-semibold text-slate-900">
                PrepCIT encountered an unexpected error
              </h1>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Your local study progress in IndexedDB remains intact. Reload to recover the workspace.
            </p>
            <pre className="mb-4 overflow-x-auto rounded-md bg-slate-50 p-3 font-mono text-xs text-slate-700">
              {this.state.message}
            </pre>
            <Button onClick={() => window.location.reload()}>
              <RotateCcw className="h-4 w-4" />
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
