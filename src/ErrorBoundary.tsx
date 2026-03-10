import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    const { error, errorInfo } = this.state;

    if (error) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
          <div className="max-w-xl bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-700 mb-4">Something went wrong</h1>
            <p className="text-gray-700 mb-4">An unexpected error occurred while loading the app.</p>
            <details className="whitespace-pre-wrap bg-gray-100 p-4 rounded">
              <summary className="cursor-pointer font-medium text-gray-700">Error details</summary>
              <pre className="text-xs text-gray-600 mt-2">
                {error.toString()}
                {errorInfo?.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
