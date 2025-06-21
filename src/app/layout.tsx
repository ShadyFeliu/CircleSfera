import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CircleSfera - Chat de Video Aleatorio",
  description: "Chatea con gente de todo el mundo en CircleSfera",
  themeColor: "#1a1a1a",
  keywords: "chat, video chat, random chat, anonymous chat",
  authors: [{ name: "CircleSfera Team" }],
  viewport: "width=device-width, initial-scale=1.0",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        
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
  );
}
