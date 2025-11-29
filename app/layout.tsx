import type { Metadata } from 'next';
import { Inter, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/navbar';
import { ErrorBoundary } from '@/components/error-boundary';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Platform - Universal AI Chat',
  description: 'Multi-model AI chat platform with advanced learning capabilities',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} font-sans`}>
        <ErrorBoundary>
          <Providers>
            <Navbar />
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}

