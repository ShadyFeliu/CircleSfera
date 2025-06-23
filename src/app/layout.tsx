import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './main.css'
import { ThemeProvider } from '../components/ThemeProvider'
import ErrorBoundary from "@/components/ErrorBoundary";
import Script from "next/script";
import SocketStatus from "@/components/SocketStatus";
import { useEffect, useState } from 'react';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CircleSfera - Conecta con el Mundo',
  description: 'Plataforma de videochat aleatorio para conectar con personas de todo el mundo',
  keywords: 'videochat, chat aleatorio, conectar, social, webcam',
  authors: [{ name: 'CircleSfera Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'CircleSfera - Conecta con el Mundo',
    description: 'Plataforma de videochat aleatorio para conectar con personas de todo el mundo',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CircleSfera - Conecta con el Mundo',
    description: 'Plataforma de videochat aleatorio para conectar con personas de todo el mundo',
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 'no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Hook para obtener el username de localStorage (solo en cliente)
  const [username, setUsername] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('circleSfera_user');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          setUsername(parsed.username || null);
        } catch {
          setUsername(null);
        }
      }
    }
  }, []);

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CircleSfera" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
        <ErrorBoundary>
          {/* Header global */}
          <header className="w-full flex items-center justify-between px-4 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 shadow-lg z-40">
            <a href="/" className="text-2xl md:text-3xl font-bold text-white tracking-tight">CircleSfera</a>
            {username && (
              <a
                href={`/@${username}`}
                className="flex items-center gap-2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-semibold px-4 py-2 md:px-6 md:py-2 rounded-full shadow transition-all text-sm md:text-base border border-white border-opacity-20"
                style={{textDecoration: 'none'}}
              >
                <span className="text-lg md:text-xl">👤</span>
                <span className="hidden sm:inline">Mi Perfil</span>
              </a>
            )}
          </header>
          {children}
        </ErrorBoundary>
        <SocketStatus />
        {/* Botón flotante de acceso a la guía de estilos */}
        <a
          href="/styleguide"
          target="_self"
          className="fixed z-50 bottom-6 left-6 md:left-auto md:right-6 bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 text-white font-bold px-4 py-2 md:px-5 md:py-3 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-all text-xs md:text-base"
          style={{textDecoration: 'none'}}
        >
          🎨 Guía de Estilos
        </a>
        </ThemeProvider>
        
        {/* Error Monitoring */}
        <Script
          id="error-monitoring"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.onerror = function(msg, url, lineNo, columnNo, error) {
                console.error('Error: ' + msg + '\\nURL: ' + url + '\\nLine: ' + lineNo + '\\nColumn: ' + columnNo + '\\nError object: ' + JSON.stringify(error));
                return false;
              };

              window.addEventListener('unhandledrejection', function(event) {
                console.error('Unhandled promise rejection:', event.reason);
              });

              // Performance monitoring
              if (window.PerformanceObserver) {
                try {
                  // FID observer
                  new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                      const metric = {
                        name: 'FID',
                        value: entry.processingStart - entry.startTime,
                        rating: entry.processingStart - entry.startTime < 100 ? 'good' : 'poor'
                      };
                      console.log('Performance metric:', metric);
                    }
                  }).observe({entryTypes: ['first-input']});

                  // LCP observer
                  new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                      const metric = {
                        name: 'LCP',
                        value: entry.startTime,
                        rating: entry.startTime < 2500 ? 'good' : 'poor'
                      };
                      console.log('Performance metric:', metric);
                    }
                  }).observe({entryTypes: ['largest-contentful-paint']});

                  // CLS observer
                  new PerformanceObserver((entryList) => {
                    let clsValue = 0;
                    for (const entry of entryList.getEntries()) {
                      if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                      }
                    }
                    const metric = {
                      name: 'CLS',
                      value: clsValue,
                      rating: clsValue < 0.1 ? 'good' : 'poor'
                    };
                    console.log('Performance metric:', metric);
                  }).observe({entryTypes: ['layout-shift']});
                } catch (e) {
                  console.error('Error setting up performance observers:', e);
                }
              }
            `
          }}
        />
      </body>
    </html>
  )
}
