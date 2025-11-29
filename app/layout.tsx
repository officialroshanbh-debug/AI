import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// ... existing imports

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
            <Analytics />
            <SpeedInsights />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}

