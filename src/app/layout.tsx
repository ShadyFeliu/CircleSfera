import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './main.css'
import { ThemeProvider } from '../components/ThemeProvider'
import ErrorBoundary from "@/components/ErrorBoundary";
import AppFrame from "@/components/AppFrame";

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
          <AppFrame>{children}</AppFrame>
        </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
