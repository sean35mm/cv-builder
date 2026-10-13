import type { NextConfig } from 'next';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "base-uri 'self'; frame-ancestors 'none'; object-src 'none'",
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), microphone=()',
  },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
];

// Features hidden in the core-loop redesign keep their old URLs working.
const retiredRoutes = [
  { source: '/activity', destination: '/editor' },
  { source: '/analytics', destination: '/editor' },
  { source: '/inbox', destination: '/editor' },
  { source: '/testimonials', destination: '/editor' },
  { source: '/domains', destination: '/editor' },
  { source: '/directory', destination: '/' },
  { source: '/roadmap', destination: '/' },
  { source: '/changelog', destination: '/' },
  { source: '/recommend/:token', destination: '/' },
];

const nextConfig: NextConfig = {
  async redirects() {
    return retiredRoutes.map((route) => ({ ...route, permanent: false }));
  },
  async headers() {
    return [
      {
        source: '/((?!embed(?:/|$)).*)',
        headers: securityHeaders,
      },
      {
        source: '/u/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ];
  },
};

export default nextConfig;
