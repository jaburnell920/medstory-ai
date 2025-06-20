// src/app/layout.tsx

import './globals.css';
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';
import PerformanceMonitor from './components/PerformanceMonitor';

export const metadata = {
  title: 'MedStory AI',
  description: 'AI-powered medical story creation platform',
};

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-lg text-gray-600">Loading MedStory AI...</p>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <PerformanceMonitor />
        <Toaster />
        <Suspense fallback={<LoadingFallback />}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
