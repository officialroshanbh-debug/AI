import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ErrorBoundary } from '@/components/error-boundary';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ErrorBoundary>
          <Providers>
            <Navbar />
            {children}
            <Analytics />
            <SpeedInsights />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}

