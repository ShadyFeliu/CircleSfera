"use client";

import { Component, ErrorInfo, ReactNode } from 'react';

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
    console.error('Error en la aplicación:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="bg-red-600 p-6 rounded-lg text-white max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">¡Ups! Algo salió mal</h2>
            <p className="mb-4">
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </p>
            <p className="text-sm mb-4 text-red-200">
              Error: {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-red-600 px-6 py-2 rounded-full font-bold hover:bg-red-100 transition-colors"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
