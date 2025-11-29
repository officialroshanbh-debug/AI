import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Enable React strict mode
  reactStrictMode: true,
  // Optimize fonts
  optimizeFonts: true,
  // Bundle analyzer (enable with ANALYZE=true)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')({
        enabled: true,
      });
      config.plugins.push(new BundleAnalyzerPlugin());
      return config;
    },
  }),
};

export default nextConfig;

